/**
 * Gumroad Ping／銷售 Webhook：依 `email` 更新 `profiles`（`subscription_status`、`subscription_expires_at`）。
 *
 * ## 部署
 * ```bash
 * supabase functions deploy gumroad-webhook
 * ```
 *
 * ## Secrets（CLI 範例）
 * ```bash
 * supabase secrets set GUMROAD_PRODUCT_ID=pcjlyd
 * ```
 * - **`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` 等以 `SUPABASE_` 開頭的變數不可手動 `secrets set`**（CLI 會略過）；由 Supabase 在 Edge Function 執行環境**自動注入**，程式內照常 `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` 即可。
 * - **`GUMROAD_PRODUCT_ID`**：需自行設定；可填 **permalink**（`pcjlyd`）或數字 **product_id**，與 ping 的 `product_permalink` / `product_id` 比對（不分大小寫）。
 *
 * ## 到期日
 * 優先：`subscription_ended_at`、`license_key_expires_at` 及其他常見結束時間欄位 → 再依 `recurrence` 推算；
 * 若仍無法取得且屬訂閱情境，**fallback：`sale_timestamp`（或現在時間）+ 1 個月**。
 * 退款／爭議 ping 會將帳號改為 `free`。
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * 將 `FormData` 鍵名轉為小寫，便於對齊 Gumroad 欄位。
 *
 * @param formData - `Request.formData()` 結果。
 */
function formDataToParamsLowercase(formData: FormData): Map<string, string> {
  const m = new Map<string, string>()
  for (const [k, v] of formData.entries()) {
    m.set(String(k).toLowerCase(), String(v))
  }
  return m
}

/**
 * 讀取第一個非空之參數值（鍵名不分大小寫，以 `params` 內已小寫之鍵為準）。
 *
 * @param params - 小寫鍵 → 值。
 * @param keys - 候選鍵名（可寫原始大小寫，會轉小寫查詢）。
 */
function getParam(params: Map<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = params.get(k.toLowerCase())
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

/**
 * 是否應撤銷 Pro（退款、爭議、拒付等常見 ping 欄位）。
 *
 * @param params - Gumroad 表單鍵值。
 */
function shouldRevokePro(params: Map<string, string>): boolean {
  const refund = getParam(params, 'refunded', 'is_refunded', 'disputed', 'chargebacked')
  return ['true', '1', 'yes'].includes(refund.toLowerCase())
}

/**
 * 解析 `sale_timestamp` 或類似欄位為 `Date`；失敗則回傳 `new Date()`。
 *
 * @param params - Gumroad 表單鍵值。
 */
function parseSaleBaseTime(params: Map<string, string>): Date {
  const saleTsRaw = getParam(params, 'sale_timestamp', 'timestamp', 'purchased_at')
  if (!saleTsRaw) return new Date()
  const n = Number(saleTsRaw)
  if (!Number.isNaN(n)) {
    const ms = n < 1e12 ? n * 1000 : n
    const d = new Date(ms)
    if (!Number.isNaN(d.getTime())) return d
  }
  const d = new Date(saleTsRaw)
  if (!Number.isNaN(d.getTime())) return d
  return new Date()
}

/**
 * 依 Gumroad Ping 推導訂閱結束時間（ISO 8601）。
 * 若產品為買斷且無週期欄位，可回傳 `null`（寫入 DB 表示無到期日）。
 *
 * @param params - Gumroad 表單鍵值。
 */
function computeSubscriptionExpiresAt(params: Map<string, string>): string | null {
  /** Gumroad 文件／社群常見之明確到期欄位（含範例用之 `subscription_ended_at`、`license_key_expires_at`）。 */
  const explicit =
    getParam(params, 'subscription_ended_at', 'license_key_expires_at') ||
    getParam(
      params,
      'subscription_end_at',
      'subscription_ends_at',
      'current_period_ends_at',
      'current_period_end',
    ) ||
    getParam(params, 'next_charge_date')

  if (explicit) {
    const d = new Date(explicit)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }

  const recurrence = getParam(params, 'recurrence', 'subscription_period', 'price_interval').toLowerCase()
  const isSubscriptionPing =
    ['true', '1', 'yes'].includes(getParam(params, 'is_subscription').toLowerCase()) ||
    recurrence !== '' ||
    ['true', '1', 'yes'].includes(getParam(params, 'is_recurring_charge').toLowerCase())

  if (!isSubscriptionPing) {
    return null
  }

  const base = parseSaleBaseTime(params)
  const monthsRaw = getParam(params, 'subscription_duration_in_months', 'duration_in_months')
  const months = Number(monthsRaw)
  if (!Number.isNaN(months) && months > 0) {
    const e = new Date(base)
    e.setMonth(e.getMonth() + months)
    return e.toISOString()
  }

  if (recurrence.includes('year')) {
    const e = new Date(base)
    e.setFullYear(e.getFullYear() + 1)
    return e.toISOString()
  }
  if (recurrence.includes('quarter')) {
    const e = new Date(base)
    e.setMonth(e.getMonth() + 3)
    return e.toISOString()
  }
  if (recurrence.includes('week')) {
    const e = new Date(base)
    e.setDate(e.getDate() + 7)
    return e.toISOString()
  }
  if (
    recurrence.includes('month') ||
    recurrence === '' ||
    recurrence.includes('every month') ||
    recurrence.includes('monthly')
  ) {
    const e = new Date(base)
    e.setMonth(e.getMonth() + 1)
    return e.toISOString()
  }

  const e = new Date(base)
  e.setDate(e.getDate() + 30)
  return e.toISOString()
}

/**
 * Ping 是否屬於已設定的商品（`product_id` 或 `product_permalink` 其一相符即可）。
 *
 * @param params - 小寫鍵之表單參數。
 * @param expectedRaw - 環境變數 `GUMROAD_PRODUCT_ID`（可為 id 或 permalink）。
 */
function productMatchesFilter(params: Map<string, string>, expectedRaw: string | undefined): boolean {
  if (!expectedRaw?.trim()) return true
  const ex = expectedRaw.trim().toLowerCase()
  const pid = getParam(params, 'product_id')
  const permalink = getParam(params, 'product_permalink')
  if (pid && pid.toLowerCase() === ex) return true
  if (permalink && permalink.toLowerCase() === ex) return true
  return false
}

/**
 * 訂閱型 ping 在無法算出到期日時，自銷售時間起預設續一個月（與月費預設一致）。
 *
 * @param params - Gumroad 表單鍵值。
 */
function fallbackMonthlyExpiry(params: Map<string, string>): string {
  const b = parseSaleBaseTime(params)
  const e = new Date(b)
  e.setMonth(e.getMonth() + 1)
  return e.toISOString()
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    console.log('[gumroad-webhook] POST received')
    const formData = await req.formData()
    const params = formDataToParamsLowercase(formData)

    const emailRaw = getParam(params, 'email')
    const email = emailRaw.toLowerCase()
    if (!email) {
      console.warn('[gumroad-webhook] 400: missing email (test ping 常無此欄位)')
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const saleId = getParam(params, 'sale_id')

    const expectedProduct = Deno.env.get('GUMROAD_PRODUCT_ID')?.trim()
    if (expectedProduct && !productMatchesFilter(params, expectedProduct)) {
      console.warn('[gumroad-webhook] 400: product mismatch', {
        expected: expectedProduct,
        product_id: getParam(params, 'product_id') || '(empty)',
        product_permalink: getParam(params, 'product_permalink') || '(empty)',
      })
      return new Response(JSON.stringify({ error: 'Product mismatch' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !serviceKey) {
      console.error('[gumroad-webhook] 500: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return new Response(JSON.stringify({ error: 'Missing Supabase env' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (shouldRevokePro(params)) {
      patch.subscription_status = 'free'
      patch.subscription_expires_at = new Date().toISOString()
    } else {
      patch.subscription_status = 'pro'
      let expiresAt = computeSubscriptionExpiresAt(params)
      if (expiresAt == null) {
        const subscriptionLike =
          !!getParam(params, 'subscription_id') ||
          ['true', '1', 'yes'].includes(getParam(params, 'is_subscription').toLowerCase()) ||
          ['true', '1', 'yes'].includes(getParam(params, 'is_recurring_charge').toLowerCase()) ||
          !!getParam(params, 'recurrence') ||
          !!getParam(params, 'next_charge_date') ||
          !!expectedProduct
        if (subscriptionLike) {
          expiresAt = fallbackMonthlyExpiry(params)
        }
      }
      patch.subscription_expires_at = expiresAt
    }

    if (saleId) {
      patch.gumroad_sale_id = saleId
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(patch)
      .eq('email', email)
      .select('id')

    if (error) throw error

    if (!data?.length) {
      console.warn('[gumroad-webhook] 404: no profiles row for this email')
      return new Response(
        JSON.stringify({
          error: `Profile not found for email: ${email}`,
          email,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    console.log('[gumroad-webhook] 200: update successful', { updated: data.length })
    return new Response(
      JSON.stringify({ message: 'Update successful', updated: data.length }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('gumroad-webhook error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
