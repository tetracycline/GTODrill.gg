import { useCallback, useEffect, useState } from 'react'
import { clearWrongQuizEntries, loadWrongQuizEntries, WRONG_BOOK_EVENT, type WrongQuizEntry } from '../../utils/wrongBook'
import {
  formatWrongBookForCopy,
  formatWrongQuizEntryLine,
  trainingModeDisplayLabel,
} from '../../utils/wrongBookFormat'
import type { Language } from '../../i18n/types'
import { useTranslation } from '../../i18n/LanguageContext'
import styles from './WrongBookPanel.module.css'

export interface WrongBookPanelProps {
  /** 是否顯示面板 */
  open: boolean
  onClose: () => void
}

/**
 * 錯題本：瀏覽、複製全文、清空（資料存於 localStorage）。
 */
/**
 * @param lang - 介面語言（對應 `Intl` locale）
 */
function intlLocaleForLang(lang: Language): string {
  if (lang === 'zh-CN') return 'zh-CN'
  if (lang === 'zh-TW') return 'zh-TW'
  return 'en-US'
}

export function WrongBookPanel({ open, onClose }: WrongBookPanelProps) {
  const { t, lang } = useTranslation()
  const [entries, setEntries] = useState<WrongQuizEntry[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setEntries(loadWrongQuizEntries())
  }, [])

  useEffect(() => {
    if (!open) return
    refresh()
  }, [open, refresh])

  useEffect(() => {
    const onUpdate = () => refresh()
    window.addEventListener(WRONG_BOOK_EVENT, onUpdate)
    return () => window.removeEventListener(WRONG_BOOK_EVENT, onUpdate)
  }, [refresh])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2000)
  }, [])

  const handleCopyAll = useCallback(async () => {
    const text = formatWrongBookForCopy(entries, t, intlLocaleForLang(lang))
    if (!text) {
      showToast(t.pages.wrongbook_toast_none)
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast(t.pages.wrongbook_toast_copied_fmt.replace('{n}', String(entries.length)))
    } catch {
      showToast(t.pages.wrongbook_toast_fail)
    }
  }, [entries, showToast, t, lang])

  const handleClear = useCallback(() => {
    if (entries.length === 0) return
    if (!window.confirm(t.pages.wrongbook_confirm_clear.replace('{n}', String(entries.length)))) return
    clearWrongQuizEntries()
    refresh()
    showToast(t.pages.wrongbook_toast_cleared)
  }, [entries.length, refresh, showToast, t.pages])

  if (!open) return null

  return (
    <>
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
          aria-labelledby="wrong-book-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className={styles.header}>
            <h2 id="wrong-book-title" className={styles.title}>
              {t.pages.wrongbook_title}
            </h2>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label={t.pages.wrongbook_close}
            >
              ×
            </button>
          </header>
          <div className={styles.toolbar}>
            <button type="button" className={styles.toolBtn} onClick={handleCopyAll}>
              {t.pages.wrongbook_copy}
            </button>
            <button type="button" className={`${styles.toolBtn} ${styles.toolBtnDanger}`} onClick={handleClear}>
              {t.pages.wrongbook_clear}
            </button>
          </div>
          <p className={styles.hint}>{t.pages.wrongbook_hint}</p>
          <div className={styles.listWrap}>
            {entries.length === 0 ? (
              <p className={styles.empty}>{t.pages.wrongbook_empty}</p>
            ) : (
              entries.map((e) => (
                <div key={e.id} className={styles.row}>
                  <div className={styles.rowMeta}>
                    <span className={styles.badge}>{trainingModeDisplayLabel(e.mode, t.pages)}</span>
                    {new Date(e.t).toLocaleString(intlLocaleForLang(lang), { hour12: false })} · {e.handLabel}
                  </div>
                  {formatWrongQuizEntryLine(e, t)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </>
  )
}
