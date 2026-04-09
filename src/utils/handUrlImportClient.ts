import type { Language } from '../i18n/types'

/** 與 `server/handUrlServerShared` 的錯誤代碼一致（避免客戶端 bundle 引入伺服端模組）。 */
const URL_FETCH_ERR = {
  HTTPS_ONLY: 'HTTPS_ONLY',
  INVALID_URL: 'INVALID_URL',
  PRIVATE_HOST: 'PRIVATE_HOST',
  FETCH_ABORT: 'FETCH_ABORT',
} as const

const DEV_FETCH_PATH = '/__gto/fetch-hand-url'
const PROD_FETCH_PATH = '/api/fetch-hand-url'

/**
 * 是否為單行 HTTPS URL（用於觸發連結抓取流程）。
 *
 * @param s - 使用者輸入
 */
export function isSingleLineHttpsUrl(s: string): boolean {
  const t = s.trim()
  if (!t || t.includes('\n') || t.includes('\r')) return false
  return /^https:\/\/[^\s]+$/i.test(t)
}

export type HandUrlFetchResponse =
  | { ok: true; status: number; contentType: string; text: string }
  | { ok: false; error: string }

/**
 * 請求後端代抓連結內容。
 *
 * @param url - HTTPS URL
 */
export async function requestHandUrlFetch(url: string): Promise<HandUrlFetchResponse> {
  const path = import.meta.env.DEV ? DEV_FETCH_PATH : PROD_FETCH_PATH
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  let j: { ok?: boolean; error?: string; status?: number; contentType?: string; text?: string }
  try {
    j = (await res.json()) as typeof j
  } catch {
    return { ok: false, error: 'FETCH_FAILED' }
  }
  if (!res.ok || !j.ok) {
    return { ok: false, error: j.error ?? 'FETCH_FAILED' }
  }
  return {
    ok: true,
    status: j.status ?? res.status,
    contentType: j.contentType ?? '',
    text: j.text ?? '',
  }
}

/**
 * 將抓取結果包成送給教練模型的使用者訊息。
 *
 * @param url - 原始連結
 * @param bodyText - 回應本文
 * @param lang - 介面語言
 */
export function formatCoachUserMessageFromFetchedUrl(
  url: string,
  bodyText: string,
  lang: Language,
): string {
  const head =
    lang === 'en'
      ? 'The user submitted a hand replay / share link. Below is raw content fetched by the server (may be HTML or text; JS-only pages may be incomplete). Please extract any hand history or street actions you can find, then analyze in order: preflop → flop → turn → river, with GTO-oriented advice for ~100bb 6-max NLHE unless the text implies otherwise.'
      : lang === 'zh-CN'
        ? '用户提交了手牌重播／分享链接。以下为服务器抓取的原始内容（可能是 HTML 或纯文本；若页面为前端动态渲染可能不完整）。请尽量识别手牌过程与公共牌，再按翻前→翻牌→转牌→河牌分析，并以 100bb 左右 6-max 现金桌 GTO 思路为主（除非文中另有说明）。'
        : '使用者提交了手牌重播／分享連結。以下為伺服器抓取的原始內容（可能是 HTML 或純文字；若頁面為前端動態渲染可能不完整）。請盡量辨識手牌過程與公共牌，再依翻前→翻牌→轉牌→河牌分析，並以約 100bb 6-max 現金桌 GTO 思路為主（除非文中另有說明）。'

  return `${head}\n\nURL:\n${url}\n\n---\n${bodyText}`
}

/**
 * 將 {@link HandUrlErrorCode} 等代碼對應成介面顯示用短句（其餘回傳通用錯誤）。
 *
 * @param code - 後端錯誤代碼
 * @param labels - 各語系文案
 */
export function mapHandUrlErrorToLabel(
  code: string,
  labels: {
    https: string
    invalid: string
    privateHost: string
    timeout: string
    failed: string
  },
): string {
  switch (code) {
    case URL_FETCH_ERR.HTTPS_ONLY:
      return labels.https
    case URL_FETCH_ERR.INVALID_URL:
      return labels.invalid
    case URL_FETCH_ERR.PRIVATE_HOST:
      return labels.privateHost
    case URL_FETCH_ERR.FETCH_ABORT:
      return labels.timeout
    default:
      return labels.failed
  }
}
