import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import styles from './AuthModal.module.css'

export type AuthModalReason = 'save-progress' | 'upgrade-pro'

export interface AuthModalProps {
  /** 是否顯示彈窗。 */
  isOpen: boolean
  /** 關閉彈窗（含點背景、成功登入後）。 */
  onClose: () => void
  /** 開啟原因，決定標題文案。 */
  reason?: AuthModalReason
}

/**
 * 登入／註冊彈窗：Google OAuth 與 Email，依 `reason` 與目前語系顯示文案。
 */
export function AuthModal({ isOpen, onClose, reason = 'save-progress' }: AuthModalProps) {
  const { t } = useTranslation()
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const uid = useId()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const copy = useMemo(() => {
    if (reason === 'save-progress') {
      return { title: t.auth.modal_save_title, subtitle: t.auth.modal_save_subtitle }
    }
    return { title: t.auth.modal_upgrade_title, subtitle: t.auth.modal_upgrade_subtitle }
  }, [reason, t])

  useEffect(() => {
    if (isOpen && user) onClose()
  }, [isOpen, user, onClose])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setMode('login')
    }
  }, [isOpen, reason])

  if (!isOpen) return null

  const onGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.auth.error_google_failed)
      setLoading(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const fn = mode === 'login' ? signInWithEmail : signUpWithEmail
      const { error: err } = await fn(email.trim(), password)
      if (err) setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-auth-title`}
        onClick={(ev) => ev.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeX}
          onClick={onClose}
          aria-label={t.auth.modal_close_aria}
        >
          ×
        </button>

        <div className={styles.headerBlock}>
          <p className={styles.logo} aria-hidden>
            🃏
          </p>
          <p className={styles.brandName}>{t.auth.modal_brand}</p>
          <h2 id={`${uid}-auth-title`} className={styles.modalTitle}>
            {copy.title}
          </h2>
          <p className={styles.modalSubtitle}>{copy.subtitle}</p>
          {!isSupabaseConfigured ? (
            <p className={styles.devHint}>
              {t.auth.modal_supabase_hint_before}
              <code className={styles.devHintCode}>.env</code>
              {t.auth.modal_supabase_hint_after}
            </p>
          ) : null}
        </div>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => {
              setMode('login')
              setError(null)
            }}
          >
            {t.auth.tab_login}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
          >
            {t.auth.tab_signup}
          </button>
        </div>

        <button
          type="button"
          className={styles.googleBtn}
          onClick={() => void onGoogle()}
          disabled={loading}
        >
          <GoogleMark />
          {t.auth.google_sign_in}
        </button>

        <div className={styles.divider}>{t.auth.divider_or_email}</div>

        <form onSubmit={(e) => void onSubmit(e)}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={`${uid}-email`}>
              {t.auth.label_email}
            </label>
            <input
              id={`${uid}-email`}
              className={styles.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={`${uid}-password`}>
              {t.auth.label_password}
            </label>
            <input
              id={`${uid}-password`}
              className={styles.input}
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              minLength={6}
            />
          </div>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {mode === 'login' ? t.auth.submit_login : t.auth.submit_signup}
          </button>
        </form>

        {reason === 'upgrade-pro' ? (
          <button type="button" className={styles.continueFree} onClick={onClose}>
            {t.auth.continue_free}
          </button>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Google 品牌色塊圖示（簡化版）。
 */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}
