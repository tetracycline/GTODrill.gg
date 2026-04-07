import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { hasActiveProSubscription, supabase, type Profile } from '../lib/supabase'

export interface AuthContextValue {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  /** 是否已登入（與 `!!user` 相同；未登入即訪客模式）。 */
  isLoggedIn: boolean
  isAdmin: boolean
  isPro: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * 提供 Supabase 登入狀態、profiles 列與 Google／Email 登入方法。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  /** 未設定 Supabase 時不需等待連線，直接結束載入。 */
  const [loading, setLoading] = useState(() => Boolean(supabase))

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error || !data) {
      setProfile(null)
      return
    }
    setProfile(data as Profile)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    if (!supabase) return

    let cancelled = false

    void (async () => {
      const {
        data: { session: initial },
      } = await supabase.auth.getSession()
      if (cancelled) return
      setSession(initial)
      setUser(initial?.user ?? null)
      if (initial?.user) {
        await fetchProfile(initial.user.id)
      }
      setLoading(false)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      if (nextSession?.user) {
        void fetchProfile(nextSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      throw new Error(
        '未設定 Supabase：請在專案根目錄建立 .env，並設定 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY',
      )
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: '未設定 Supabase 環境變數，無法登入。' }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: '未設定 Supabase 環境變數，無法註冊。' }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
  }, [])

  const isAdmin = profile?.is_admin ?? false
  const isPro = hasActiveProSubscription(profile)
  const isLoggedIn = user !== null

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isLoggedIn,
        isAdmin,
        isPro,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 讀取驗證上下文；須包在 {@link AuthProvider} 內。
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook 與 Provider 同檔為常見模式
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
