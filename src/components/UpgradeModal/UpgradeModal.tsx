import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { hasActiveProSubscription } from '../../lib/supabase'
import { GUMROAD_PRO_URL } from '../../utils/gumroad'
import styles from './UpgradeModal.module.css'

export interface UpgradeModalProps {
  /** 關閉對話框。 */
  onClose: () => void
  /** 特定情境提示（例如免費額度用盡）。 */
  contextMessage?: string | null
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
export function UpgradeModal({ onClose, contextMessage = null }: UpgradeModalProps) {
  const { t } = useTranslation()
  const { isLoggedIn, refreshProfile, user } = useAuth()
  const upgradeHref = resolveUpgradeHref()
  const [refreshing, setRefreshing] = useState(false)
  const [refreshHint, setRefreshHint] = useState<'idle' | 'pro' | 'free' | 'no_profile'>('idle')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /**
   * 付款後手動重新拉取 `profiles`；依回傳列立即顯示是否已 Pro（不依賴下一次 render 的 context）。
   */
  const handleRefreshStatus = async () => {
    setRefreshing(true)
    setRefreshHint('idle')
    try {
      const row = await refreshProfile()
      if (!row) {
        setRefreshHint('no_profile')
        return
      }
      if (hasActiveProSubscription(row)) {
        setRefreshHint('pro')
      } else {
        setRefreshHint('free')
      }
    } finally {
      setRefreshing(false)
    }
  }

  const accountEmail = user?.email?.trim() ?? ''

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
        {contextMessage ? <p className={styles.lead}>{contextMessage}</p> : null}
        <p className={styles.lead}>{t.upgrade.lead}</p>
        <ul className={styles.list}>
          <li>FREE includes:</li>
          <li>✅ RFI Training</li>
          <li>✅ VS RFI</li>
          <li>✅ Push Fold</li>
          <li>✅ 10 Postflop questions/day</li>
          <li>PRO $8/month includes everything +</li>
          <li>✅ BvB, VS 3BET, VS 4BET, Cold 4-Bet</li>
          <li>✅ Unlimited Postflop training</li>
          <li>✅ Weak Spot tracking</li>
        </ul>
        <p className={styles.price}>$8 / month</p>

        <div className={styles.hintBlock}>
          <p className={styles.hintText}>{t.upgrade.checkout_email_hint}</p>
          <p className={styles.hintText}>{t.upgrade.auto_renew_hint}</p>
        </div>

        {isLoggedIn && accountEmail ? (
          <p className={styles.accountEmail}>
            {t.upgrade.refresh_account_email_fmt.replace('{email}', accountEmail)}
          </p>
        ) : null}

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
            {refreshHint === 'pro' ? (
              <p className={styles.refreshOk} role="status">
                {t.upgrade.refresh_result_pro}
              </p>
            ) : null}
            {refreshHint === 'free' ? (
              <p className={styles.refreshWarn} role="status">
                {t.upgrade.refresh_result_free}
              </p>
            ) : null}
            {refreshHint === 'no_profile' ? (
              <p className={styles.refreshWarn} role="alert">
                {t.upgrade.refresh_result_no_profile}
              </p>
            ) : null}
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
