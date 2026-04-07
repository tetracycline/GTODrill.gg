import { useEffect } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import { HandHistoryPage } from './HandHistoryPage'
import styles from './HandHistoryDialog.module.css'

export interface HandHistoryDialogProps {
  /** 是否顯示對話窗 */
  open: boolean
  /** 關閉對話窗（backdrop／關閉鈕／Esc） */
  onClose: () => void
}

/**
 * 手牌分析：全螢幕對話窗包裝（內容與 {@link HandHistoryPage} 相同）。
 */
export function HandHistoryDialog({ open, onClose }: HandHistoryDialogProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hand-history-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h2 id="hand-history-dialog-title" className={styles.title}>
              {t.hand_history.title}
            </h2>
            <p className={styles.subtitle}>{t.hand_history.subtitle}</p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t.pages.wrongbook_close}
          >
            ×
          </button>
        </header>
        <div className={styles.body}>
          <HandHistoryPage variant="embedded" />
        </div>
      </div>
    </div>
  )
}
