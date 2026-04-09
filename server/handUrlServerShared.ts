/**
 * 伺服端安全抓取手牌／重播連結內容（Vercel API 與 Vite dev middleware 共用）。
 * 僅允許公開 HTTPS，阻擋常見 SSRF 目標。
 */

const MAX_CHARS = 120_000
const TIMEOUT_MS = 12_000

/** 錯誤代碼（客戶端可對應翻譯）。 */
export const HandUrlErrorCode = {
  HTTPS_ONLY: 'HTTPS_ONLY',
  INVALID_URL: 'INVALID_URL',
  PRIVATE_HOST: 'PRIVATE_HOST',
  FETCH_ABORT: 'FETCH_ABORT',
} as const

/**
 * 驗證是否為可抓取的公開 HTTPS URL。
 *
 * @param urlStr - 原始字串
 * @returns 解析後的 `URL`
 * @throws Error message 為 {@link HandUrlErrorCode} 之一
 */
export function assertPublicHttpsUrl(urlStr: string): URL {
  let u: URL
  try {
    u = new URL(urlStr.trim())
  } catch {
    throw new Error(HandUrlErrorCode.INVALID_URL)
  }
  if (u.protocol !== 'https:') {
    throw new Error(HandUrlErrorCode.HTTPS_ONLY)
  }
  const host = u.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local')
  ) {
    throw new Error(HandUrlErrorCode.PRIVATE_HOST)
  }
  if (/^10\.\d+\.\d+\.\d+$/.test(host)) {
    throw new Error(HandUrlErrorCode.PRIVATE_HOST)
  }
  if (/^192\.168\.\d+\.\d+$/.test(host)) {
    throw new Error(HandUrlErrorCode.PRIVATE_HOST)
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)) {
    throw new Error(HandUrlErrorCode.PRIVATE_HOST)
  }
  if (host === '169.254.169.254' || host.endsWith('.internal')) {
    throw new Error(HandUrlErrorCode.PRIVATE_HOST)
  }
  return u
}

export interface FetchHandUrlBodyResult {
  status: number
  contentType: string
  text: string
}

/**
 * GET 抓取 URL 回應本文並截斷長度。
 *
 * @param urlStr - 完整 HTTPS URL
 */
export async function fetchHandUrlBody(urlStr: string): Promise<FetchHandUrlBodyResult> {
  const u = assertPublicHttpsUrl(urlStr)
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS)
  try {
    const r = await fetch(u.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: ac.signal,
      headers: {
        'User-Agent': 'GTO-Trainer-HandImporter/1.0',
        Accept: 'text/html,application/json,text/plain;q=0.9,*/*;q=0.8',
      },
    })
    const ct = r.headers.get('content-type') ?? ''
    let text = await r.text()
    if (text.length > MAX_CHARS) {
      text = `${text.slice(0, MAX_CHARS)}\n\n[truncated]`
    }
    return { status: r.status, contentType: ct, text }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(HandUrlErrorCode.FETCH_ABORT)
    }
    throw e
  } finally {
    clearTimeout(t)
  }
}
