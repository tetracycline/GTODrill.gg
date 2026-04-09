import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

interface BugReportBody {
  message?: string
  appLang?: string
  pageUrl?: string
}

/**
 * 透過 Resend 寄送錯誤回報通知（僅後端使用，前端看不到收件者）。
 *
 * @param input - 信件內容
 */
async function sendBugReportEmail(input: {
  reportId: number
  message: string
  appLang: string
  pageUrl: string
  reporterUserId: string | null
  reporterEmailMasked: string | null
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.BUG_REPORT_NOTIFY_EMAIL
  const fromEmail = process.env.BUG_REPORT_FROM_EMAIL || 'GTO Trainer <onboarding@resend.dev>'
  if (!apiKey || !toEmail) {
    throw new Error('EMAIL_CONFIG_MISSING')
  }

  const subject = `GTO Bug Report #${input.reportId}`
  const text = [
    `Report ID: ${input.reportId}`,
    `App Language: ${input.appLang || '-'}`,
    `Page URL: ${input.pageUrl || '-'}`,
    `Reporter User ID: ${input.reporterUserId ?? '-'}`,
    `Reporter Masked Email: ${input.reporterEmailMasked ?? '-'}`,
    '',
    'Message:',
    input.message,
  ].join('\n')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      text,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`EMAIL_SEND_FAILED:${res.status}:${errText.slice(0, 200)}`)
  }
}

/**
 * 遮罩 email：例如 `a***@g***.com`。
 *
 * @param email - 原始 email
 */
function maskEmail(email: string): string {
  const [local, host = ''] = email.toLowerCase().trim().split('@')
  if (!local || !host) return 'hidden'
  const hostParts = host.split('.')
  const domain = hostParts[0] ?? ''
  const tld = hostParts.length > 1 ? `.${hostParts.slice(1).join('.')}` : ''
  const localMasked = `${local[0] ?? '*'}***`
  const domainMasked = `${domain[0] ?? '*'}***`
  return `${localMasked}@${domainMasked}${tld}`
}

/**
 * 錯誤回報 API：只儲存遮罩 email，不回傳／不顯示原始 email。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !serviceKey) {
    return res.status(500).json({ error: 'MISSING_ENV' })
  }

  let body: BugReportBody
  try {
    body = typeof req.body === 'string' ? (JSON.parse(req.body) as BugReportBody) : req.body
  } catch {
    return res.status(400).json({ error: 'INVALID_JSON' })
  }

  const message = body.message?.trim() ?? ''
  if (message.length < 8 || message.length > 4000) {
    return res.status(400).json({ error: 'INVALID_MESSAGE' })
  }

  const userClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let reporterUserId: string | null = null
  let reporterEmailMasked: string | null = null

  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const { data, error } = await userClient.auth.getUser(token)
    if (!error && data.user) {
      reporterUserId = data.user.id
      if (data.user.email) reporterEmailMasked = maskEmail(data.user.email)
    }
  }

  const payload = {
    reporter_user_id: reporterUserId,
    reporter_email_masked: reporterEmailMasked,
    message,
    app_lang: (body.appLang ?? '').slice(0, 12),
    page_url: (body.pageUrl ?? '').slice(0, 500),
  }

  const { data: inserted, error: insertErr } = await adminClient
    .from('bug_reports')
    .insert(payload)
    .select('id')
    .single()

  const reportId = insertErr || !inserted ? Date.now() : (inserted.id as number)
  const stored = !(insertErr || !inserted)
  if (!stored) {
    console.error('[report-bug] db insert failed:', insertErr)
  }

  let emailed = false
  try {
    await sendBugReportEmail({
      reportId,
      message,
      appLang: payload.app_lang,
      pageUrl: payload.page_url,
      reporterUserId,
      reporterEmailMasked,
    })
    emailed = true
  } catch (e) {
    console.error('[report-bug] email notify failed:', e)
    return res.status(500).json({ error: 'REPORT_FAILED' })
  }

  return res.status(200).json({ ok: true, id: reportId, stored, emailed })
}
