import type { Language } from '../i18n/types'

const DEV_PATH = '/__gto/report-bug'
const PROD_PATH = '/api/report-bug'

export interface SubmitBugReportInput {
  message: string
  language: Language
  pageUrl: string
  accessToken?: string
}

/**
 * 送出錯誤回報（匿名顯示，不回傳原始 email）。
 *
 * @param input - 回報內容與當前語系
 */
export async function submitBugReport(input: SubmitBugReportInput): Promise<{ id: number }> {
  const path = import.meta.env.DEV ? DEV_PATH : PROD_PATH
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (input.accessToken) {
    headers.Authorization = `Bearer ${input.accessToken}`
  }
  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: input.message,
      appLang: input.language,
      pageUrl: input.pageUrl,
    }),
  })
  const j = (await res.json().catch(() => ({}))) as { error?: string; id?: number }
  if (!res.ok || typeof j.id !== 'number') {
    throw new Error(j.error ?? `API ${res.status}`)
  }
  return { id: j.id }
}
