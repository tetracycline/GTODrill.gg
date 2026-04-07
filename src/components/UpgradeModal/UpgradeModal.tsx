import { useEffect } from 'react'
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
 */
export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const { t } = useTranslation()
  const upgradeHref = resolveUpgradeHref()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
