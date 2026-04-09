import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchHandUrlBody, HandUrlErrorCode } from '../server/handUrlServerShared'

/**
 * Vercel Serverless：代客戶端抓取手牌重播／分享連結（繞過瀏覽器 CORS）。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  let body: { url?: string }
  try {
    body = typeof req.body === 'string' ? (JSON.parse(req.body) as { url?: string }) : req.body
  } catch {
    return res.status(400).json({ ok: false, error: HandUrlErrorCode.INVALID_URL })
  }

  const url = body?.url?.trim()
  if (!url) {
    return res.status(400).json({ ok: false, error: HandUrlErrorCode.INVALID_URL })
  }

  try {
    const { status, contentType, text } = await fetchHandUrlBody(url)
    return res.status(200).json({ ok: true, status, contentType, text })
  } catch (e) {
    const code = e instanceof Error ? e.message : 'UNKNOWN'
    if (code === HandUrlErrorCode.HTTPS_ONLY || code === HandUrlErrorCode.INVALID_URL) {
      return res.status(400).json({ ok: false, error: code })
    }
    if (code === HandUrlErrorCode.PRIVATE_HOST) {
      return res.status(403).json({ ok: false, error: code })
    }
    if (code === HandUrlErrorCode.FETCH_ABORT) {
      return res.status(504).json({ ok: false, error: code })
    }
    return res.status(502).json({ ok: false, error: 'FETCH_FAILED' })
  }
}
