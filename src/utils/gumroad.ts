/**
 * Pro 訂閱之 Gumroad 產品頁；可透過環境變數 `VITE_GUMROAD_PRO_URL` 覆寫。
 */
const GUMROAD_PRO_URL =
  import.meta.env.VITE_GUMROAD_PRO_URL ?? 'https://4910063430969.gumroad.com/l/pcjlyd'

export { GUMROAD_PRO_URL }
