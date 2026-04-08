import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/**
 * Vercel Serverless：以 Gumroad `licenses/verify` 驗證序號後，將目前登入使用者之 `profiles` 升級為 Pro。
 *
 * 環境變數（Vercel）：
 * - `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`
 * - `GUMROAD_PRODUCT_ID`：產品 **permalink**（例如 `pcjlyd`），對應 verify 的 `product_permalink`
 * - 選用 `GUMROAD_ACCESS_TOKEN`：賣方 API token；若 verify 回傳未授權，請於 Gumroad 後台建立並設定此值（query `access_token`）
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const url = process.env.VITE_SUPABASE_URL
    const anon = process.env.VITE_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const productPermalink = process.env.GUMROAD_PRODUCT_ID?.trim()

    if (!url || !anon || !serviceKey || !productPermalink) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const jwt = authHeader.replace(/^Bearer\s+/i, '')

    let body: { licenseKey?: string }
    try {
      body = typeof req.body === 'string' ? (JSON.parse(req.body) as typeof body) : req.body
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }

    const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : ''
    if (!licenseKey) {
      return res.status(400).json({ error: 'Please enter your license key' })
    }

    const userClient = createClient(url, anon)
    const { data: userData, error: authError } = await userClient.auth.getUser(jwt)
    if (authError || !userData.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const gumroadToken = process.env.GUMROAD_ACCESS_TOKEN?.trim()
    const verifyUrl = gumroadToken
      ? `https://api.gumroad.com/v2/licenses/verify?access_token=${encodeURIComponent(gumroadToken)}`
      : 'https://api.gumroad.com/v2/licenses/verify'

    const gumroadRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        product_permalink: productPermalink,
        license_key: licenseKey,
        increment_uses_count: 'false',
      }).toString(),
    })

    const gumroadData = (await gumroadRes.json()) as { success?: boolean; message?: string }
    console.log('Gumroad response:', JSON.stringify(gumroadData))

    if (!gumroadData.success) {
      return res.status(400).json({
        error: 'Invalid license key. Please check and try again.',
      })
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { error: updateErr } = await adminClient
      .from('profiles')
      .update({
        subscription_status: 'pro',
        subscription_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userData.user.id)

    if (updateErr) {
      console.error('Activate license Supabase update:', updateErr)
      return res.status(500).json({ error: 'Server error. Please contact support.' })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Activate license error:', err)
    return res.status(500).json({
      error: 'Server error. Please contact support.',
    })
  }
}
