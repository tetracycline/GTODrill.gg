/**
 * OAuth／Email 驗證完成後要導回的站台根網址（不含尾隨 `/`）。
 *
 * 正式站請在 Vercel 設定 `VITE_SITE_URL=https://gtodrill.vercel.app`，
 * 否則若使用者從舊的 `*.vercel.app` 部署網址開站，Google 會導回已刪除的 deployment 而出現 `DEPLOYMENT_NOT_FOUND`。
 *
 * 本機開發勿設此變數，會自動使用 `window.location.origin`（例如 `http://localhost:5173`）。
 */
export function getAuthRedirectOrigin(): string {
  const raw = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()
  /** Vercel CLI 有時會把換行一併寫入，只取第一行避免 OAuth 導向錯誤網址。 */
  const fromEnv = raw ? raw.split(/\r?\n/)[0]!.trim() : ''
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}
