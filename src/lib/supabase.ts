import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * 是否已設定 Supabase（本機未設 `.env` 時為 `false`，應用仍可載入並使用訪客模式）。
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

/**
 * 瀏覽器端 Supabase 客戶端（使用 anon key，受 RLS 保護）。
 * 未設定環境變數時為 `null`，呼叫端須先判斷。
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

/**
 * 使用者公開檔案列（對應 `public.profiles`）。
 */
export type Profile = {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  is_admin: boolean
  subscription_status: 'free' | 'pro'
  subscription_expires_at: string | null
  /** Gumroad webhook 寫入之最後 `sale_id`（若已執行對應 migration）。 */
  gumroad_sale_id?: string | null
  created_at: string
  updated_at?: string
}

/**
 * 目前是否為有效 Pro：`subscription_status === 'pro'` 且未過期。
 * `subscription_expires_at` 為 `null` 或空字串時視為無到期日（向下相容舊資料／買斷）。
 *
 * @param profile - 使用者 `profiles` 列，可為 `null`。
 */
export function hasActiveProSubscription(profile: Profile | null | undefined): boolean {
  if (!profile || profile.subscription_status !== 'pro') return false
  const exp = profile.subscription_expires_at
  if (exp == null || exp === '') return true
  const t = new Date(exp).getTime()
  if (Number.isNaN(t)) return true
  return t > Date.now()
}
