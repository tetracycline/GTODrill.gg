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
  created_at: string
  updated_at?: string
}
