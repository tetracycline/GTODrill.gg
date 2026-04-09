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
 * supabase secrets set GUMROAD_PRODUCT_ID=pcjlyd,0_RBqgEzaQqPnxB4h5l8KQ==
 * ```
 * - **`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` 等以 `SUPABASE_` 開頭的變數不可手動 `secrets set`**（CLI 會略過）；由 Supabase 在 Edge Function 執行環境**自動注入**，程式內照常 `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` 即可。
 * - **`GUMROAD_PRODUCT_ID`**：可填 **permalink**（`pcjlyd`）、Gumroad ping 內的 **`product_id` 字串**（常為 `0_xxxxx==` 這類），或**逗號分隔多個值**（任一命中即通過）。Ping 裡 `product_id` 與網址 permalink 通常不同，需擇一或兩者都設。
 *
 * ## 到期日
 * 優先：`subscription_ended_at`、`license_key_expires_at` 及其他常見結束時間欄位 → 再依 `recurrence` 推算；
 * 若仍無法取得且屬訂閱情境，**fallback：`sale_timestamp`（或現在時間）+ 1 個月**。
 * 退款／爭議 ping 會將帳號改為 `free`。
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * 將 Supabase／PostgREST 等非 `Error` 實例之 thrown 值轉成可讀字串（避免 log 出現 `[object Object]`）。
 *
 * @param err - `catch` 區塊捕獲之值。
 */
function formatUnknownError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>
    const parts: string[] = []
    if (typeof o.message === 'string') parts.push(o.message)
    if (typeof o.code === 'string') parts.push(`code=${o.code}`)
    if (typeof o.details === 'string') parts.push(o.details)
    if (typeof o.hint === 'string') parts.push(`hint=${o.hint}`)
    if (parts.length > 0) return parts.join(' | ')
    try {
      return JSON.stringify(o)
    } catch {
      return String(err)
    }
  }
  return String(err)
}

/**
 * 將 `.rpc` 回傳之 UUID 正規化為字串（純量或包在物件時皆處理）。
 *
 * @param data - `rpc` 的 `data`。
 */
function coerceRpcUuid(data: unknown): string | null {
  if (typeof data === 'string' && data.length > 0) return data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const v = (data as Record<string, unknown>).gumroad_lookup_user_id_by_email
    if (typeof v === 'string' && v.length > 0) return v
  }
  return null
}

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
 * 從 ping 取出可能代表「同一個商品」的識別字串（Gumroad 欄位依版本可能不同）。
 *
 * @param params - 小寫鍵之表單參數。
 */
function gumroadProductCandidates(params: Map<string, string>): string[] {
  const keys = [
    'product_id',
    'product_permalink',
    'permalink',
    'short_product_id',
    'product_unique_id',
  ] as const
  const seen = new Set<string>()
  const out: string[] = []
  for (const k of keys) {
    const v = getParam(params, k)
    if (!v) continue
    const low = v.toLowerCase()
    if (seen.has(low)) continue
    seen.add(low)
    out.push(low)
  }
  return out
}

/**
 * Ping 是否屬於已設定的商品。`GUMROAD_PRODUCT_ID` 可為逗號分隔之多個值（permalink、`product_id` 等），
 * 與 ping 內任一候選欄位相符即通過。
 *
 * @param params - 小寫鍵之表單參數。
 * @param expectedRaw - 環境變數 `GUMROAD_PRODUCT_ID`。
 */
function productMatchesFilter(params: Map<string, string>, expectedRaw: string | undefined): boolean {
  if (!expectedRaw?.trim()) return true
  const allowed = expectedRaw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const candidates = gumroadProductCandidates(params)
  if (candidates.length === 0) return false
  return allowed.some((ex) => candidates.some((c) => c === ex))
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

    console.log('[gumroad-webhook] form keys:', [...params.keys()].sort().join(',') || '(empty)')

    const emailRaw = getParam(params, 'email', 'purchaser_email', 'buyer_email')
    const email = emailRaw.toLowerCase()
    if (!email) {
      /** 測試 ping 常無 `email`；回 200 避免儀表板全紅，Gumroad 亦視為已送達。 */
      console.warn('[gumroad-webhook] skip: no email (Gumroad test ping?)')
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: 'missing_email',
          hint: 'Real purchases include email; test pings often do not.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const saleId = getParam(params, 'sale_id')

    const expectedProduct = Deno.env.get('GUMROAD_PRODUCT_ID')?.trim()
    if (expectedProduct && !productMatchesFilter(params, expectedProduct)) {
      console.warn('[gumroad-webhook] 400: product mismatch', {
        expected: expectedProduct,
        candidates_from_ping: gumroadProductCandidates(params),
        hint: 'Set GUMROAD_PRODUCT_ID to ping product_id OR permalink, comma-separated for both.',
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

    let { data, error } = await supabaseAdmin
      .from('profiles')
      .update(patch)
      .eq('email', email)
      .select('id')

    if (error) throw error

    /** `profiles.email` 常為空或與 auth 不同步時，依 `auth.users` 的 email 解析 id 再更新並回填 email。 */
    if (!data?.length) {
      console.log('[gumroad-webhook] no row for profiles.email, lookup auth.users by email')
      const { data: userId, error: rpcErr } = await supabaseAdmin.rpc('gumroad_lookup_user_id_by_email', {
        p_email: email,
      })
      if (rpcErr) {
        console.warn('[gumroad-webhook] rpc error:', formatUnknownError(rpcErr))
      }
      const uid = !rpcErr ? coerceRpcUuid(userId) : null
      if (uid) {
        const patchWithEmail = { ...patch, email }
        const res2 = await supabaseAdmin
          .from('profiles')
          .update(patchWithEmail)
          .eq('id', uid)
          .select('id')
        if (res2.error) throw res2.error
        data = res2.data
        if (data?.length) {
          console.log('[gumroad-webhook] updated by user id from auth lookup')
        }
      }
    }

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
    const message = formatUnknownError(err)
    console.error('[gumroad-webhook] 500:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
