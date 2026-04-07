/**
 * Gumroad Ping／銷售 Webhook：依 email 更新 `profiles`，寫入 `subscription_status` 與 `subscription_expires_at`。
 *
 * 部署：`supabase functions deploy gumroad-webhook`
 * 環境變數（Dashboard → Edge Functions → Secrets 或 CLI secrets）：
 * - `SUPABASE_URL`（通常由平台自動注入）
 * - `SUPABASE_SERVICE_ROLE_KEY`
 * 選用：`GUMROAD_PRODUCT_ID` — 若設定則僅處理該 `product_id`，避免誤升級。
 *
 * 到期日推導：優先使用 ping 內明確之結束／下次扣款時間欄位；否則以 `sale_timestamp` 為基準，
 * 依 `recurrence` 加算（預設月費 +1 月；無法解析時 +30 天）。退款類欄位為真時改為 `free`。
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
  const explicit =
    getParam(
      params,
      'subscription_end_at',
      'subscription_ends_at',
      'current_period_ends_at',
      'current_period_end',
    ) || getParam(params, 'next_charge_date')

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

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const formData = await req.formData()
    const params = formDataToParamsLowercase(formData)

    const emailRaw = getParam(params, 'email')
    const email = emailRaw.toLowerCase()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const saleId = getParam(params, 'sale_id')
    const productId = getParam(params, 'product_id')

    const expectedProductId = Deno.env.get('GUMROAD_PRODUCT_ID')?.trim()
    if (expectedProductId && productId && productId !== expectedProductId) {
      return new Response(JSON.stringify({ error: 'Ignored: product_id mismatch' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !serviceKey) {
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
      const expiresAt = computeSubscriptionExpiresAt(params)
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
      return new Response(
        JSON.stringify({
          message: 'No profile row for this email; user may need to sign up first',
          email,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ message: 'Success', updated: data.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
