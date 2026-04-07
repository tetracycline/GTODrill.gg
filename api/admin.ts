import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/**
 * Vercel Serverless：以 service role 讀寫全站 profiles；請求須帶有效 JWT 且該使用者為 admin。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anon || !serviceKey) {
    return res.status(500).json({ error: 'Missing Supabase environment variables' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const token = authHeader.replace(/^Bearer\s+/i, '')

  const userClient = createClient(url, anon)
  const { data: userData, error: authError } = await userClient.auth.getUser(token)
  if (authError || !userData.user) return res.status(401).json({ error: 'Invalid token' })

  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: adminProfile, error: profErr } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .single()

  if (profErr || !adminProfile?.is_admin) return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const { data: profiles, error: listErr } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (listErr) return res.status(500).json({ error: listErr.message })

    const { count: totalUsers, error: c1 } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: proUsers, error: c2 } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'pro')

    if (c1 || c2) return res.status(500).json({ error: (c1 ?? c2)?.message })

    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)
    const { data: todayRows, error: tErr } = await adminClient
      .from('quiz_results')
      .select('user_id')
      .gte('created_at', start.toISOString())

    if (tErr) return res.status(500).json({ error: tErr.message })

    const activeToday = new Set((todayRows ?? []).map((r) => r.user_id as string)).size

    return res.status(200).json({
      profiles: profiles ?? [],
      totalUsers: totalUsers ?? 0,
      proUsers: proUsers ?? 0,
      activeToday,
      monthlyRevenueUsd: 0,
    })
  }

  if (req.method === 'PATCH') {
    let body: { userId?: string; updates?: Record<string, unknown> }
    try {
      body = typeof req.body === 'string' ? (JSON.parse(req.body) as typeof body) : req.body
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }

    const userId = body.userId
    const updates = body.updates
    if (!userId || !updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'userId and updates required' })
    }

    const allowed = ['is_admin', 'subscription_status', 'subscription_expires_at', 'display_name'] as const
    const patch: Record<string, unknown> = {}
    for (const k of allowed) {
      if (k in updates) patch[k] = updates[k]
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No allowed fields to update' })
    }

    const { error } = await adminClient.from('profiles').update(patch).eq('id', userId)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
