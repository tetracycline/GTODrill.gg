import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { GUMROAD_PRO_URL } from '../../utils/gumroad'
import styles from './UpgradeModal.module.css'

export interface UpgradeModalProps {
  /** 關閉對話框。 */
  onClose: () => void
}

/**
 * 取得「升級 Pro」外連網址：`VITE_UPGRADE_URL` 優先，否則為 Gumroad（見 {@link GUMROAD_PRO_URL}）。
 */
function resolveUpgradeHref(): string {
  const override = (import.meta.env.VITE_UPGRADE_URL as string | undefined)?.trim()
  if (override) return override
  return GUMROAD_PRO_URL
}

/**
 * 免費／訪客點選 Pro 功能時顯示的升級說明；文案隨語系切換，預設開啟 Gumroad 結帳頁。
 * 已登入使用者可貼上 Gumroad 序號呼叫 `/api/activate-license` 啟用 Pro。
 */
export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const { t } = useTranslation()
  const { session, isLoggedIn, refreshProfile } = useAuth()
  const upgradeHref = resolveUpgradeHref()

  const [licenseKey, setLicenseKey] = useState('')
  const [licenseError, setLicenseError] = useState<string | null>(null)
  const [licenseOk, setLicenseOk] = useState(false)
  const [licenseLoading, setLicenseLoading] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /**
   * 驗證序號並更新目前帳號之 `profiles`（須已登入）。
   */
  const handleActivateLicense = async () => {
    setLicenseError(null)
    setLicenseOk(false)
    const trimmed = licenseKey.trim()
    if (!trimmed) {
      setLicenseError(t.upgrade.license_empty)
      return
    }
    if (!session?.access_token) {
      setLicenseError(t.upgrade.license_need_login)
      return
    }

    setLicenseLoading(true)
    try {
      const res = await fetch('/api/activate-license', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseKey: trimmed }),
      })
      const json = (await res.json()) as { error?: string; success?: boolean }
      if (!res.ok) {
        setLicenseError(json.error ?? t.upgrade.license_error_generic)
        return
      }
      setLicenseOk(true)
      setLicenseKey('')
      await refreshProfile()
    } catch {
      setLicenseError(t.upgrade.license_error_generic)
    } finally {
      setLicenseLoading(false)
    }
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="upgrade-title" className={styles.title}>
          {t.upgrade.title}
        </h2>
        <p className={styles.lead}>{t.upgrade.lead}</p>
        <ul className={styles.list}>
          <li>{t.upgrade.feature_bvb_line}</li>
          <li>{t.upgrade.feature_ai}</li>
          <li>{t.upgrade.feature_hand_history}</li>
          <li>{t.upgrade.feature_weak_sync}</li>
        </ul>
        <p className={styles.price}>{t.upgrade.price}</p>

        <div className={styles.licenseBlock}>
          <h3 className={styles.licenseTitle}>{t.upgrade.license_section_title}</h3>
          {licenseError ? (
            <p id="upgrade-license-err" className={styles.licenseError} role="alert">
              {licenseError}
            </p>
          ) : null}
          {licenseOk ? (
            <p className={styles.licenseOk} role="status">
              {t.upgrade.license_success}
            </p>
          ) : null}
          <input
            type="text"
            className={styles.licenseInput}
            value={licenseKey}
            onChange={(e) => {
              setLicenseKey(e.target.value)
              setLicenseError(null)
              setLicenseOk(false)
            }}
            placeholder={t.upgrade.license_placeholder}
            disabled={licenseLoading || !isLoggedIn}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(licenseError)}
            aria-describedby={licenseError ? 'upgrade-license-err' : undefined}
          />
          <button
            type="button"
            className={styles.licenseButton}
            onClick={() => void handleActivateLicense()}
            disabled={licenseLoading || !isLoggedIn}
          >
            {licenseLoading ? '…' : t.upgrade.license_submit}
          </button>
          {!isLoggedIn ? (
            <p className={styles.licenseHint}>{t.upgrade.license_need_login}</p>
          ) : null}
        </div>

        <div className={styles.actions}>
          <a
            className={styles.primary}
            href={upgradeHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.upgrade.cta}
          </a>
          <button type="button" className={styles.secondary} onClick={onClose}>
            {t.upgrade.dismiss}
          </button>
        </div>
      </div>
    </div>
  )
}
