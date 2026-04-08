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
 * 免費／訪客點選 Pro 功能時顯示的升級說明；導向 Gumroad 結帳。
 * 付款成功後由 Gumroad Ping（Supabase Edge Function）依**相同 email** 自動升級並在續訂時延長 `subscription_expires_at`。
 */
export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const { t } = useTranslation()
  const { isLoggedIn, refreshProfile } = useAuth()
  const upgradeHref = resolveUpgradeHref()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /**
   * 付款後手動重新拉取 `profiles`（Webhook 可能有數秒延遲）。
   */
  const handleRefreshStatus = async () => {
    setRefreshing(true)
    try {
      await refreshProfile()
    } finally {
      setRefreshing(false)
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

        <div className={styles.hintBlock}>
          <p className={styles.hintText}>{t.upgrade.checkout_email_hint}</p>
          <p className={styles.hintText}>{t.upgrade.auto_renew_hint}</p>
        </div>

        {isLoggedIn ? (
          <div className={styles.refreshRow}>
            <button
              type="button"
              className={styles.refreshBtn}
              disabled={refreshing}
              onClick={() => void handleRefreshStatus()}
            >
              {refreshing ? '…' : t.upgrade.refresh_status_cta}
            </button>
          </div>
        ) : null}

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
