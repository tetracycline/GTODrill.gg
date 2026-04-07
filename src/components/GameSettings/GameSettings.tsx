import { useEffect, useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import type { Language } from '../../i18n/types'
import styles from './GameSettings.module.css'

const THEME_KEY = 'gto-theme'

export interface GameSettingsProps {
  /** 是否顯示設定面板 */
  open: boolean
  /** 關閉面板（backdrop／關閉鈕） */
  onClose: () => void
  /** 每日目標手數 */
  dailyTarget: number
  /** 變更每日目標 */
  onDailyTargetChange: (n: number) => void
}

/**
 * 語言、主題、每日目標與 Rake 教育說明。
 */
export function GameSettings({
  open,
  onClose,
  dailyTarget,
  onDailyTargetChange,
}: GameSettingsProps) {
  const { t, lang, setLang } = useTranslation()
  const [theme, setThemeState] = useState<'dark' | 'light'>(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY) === 'light'
      ? 'light'
      : 'dark',
  )

  /**
   * @param next - 主題
   */
  function applyTheme(next: 'dark' | 'light') {
    setThemeState(next)
    localStorage.setItem(THEME_KEY, next)
    document.documentElement.setAttribute('data-theme', next)
  }

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
    const stored =
      typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY) === 'light'
        ? 'light'
        : 'dark'
    setThemeState(stored)
    document.documentElement.setAttribute('data-theme', stored)
  }, [open])

  if (!open) return null

  /**
   * @param l - 語言按鈕
   */
  function langChip(l: Language, label: string) {
    return (
      <button
        key={l}
        type="button"
        className={`${styles.langChip} ${lang === l ? styles.langChipActive : ''}`}
        onClick={() => setLang(l)}
      >
        {label}
      </button>
    )
  }

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
        aria-labelledby="game-settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="game-settings-title" className={styles.title}>
            {t.settings.title}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t.settings.rake_close}
          >
            ×
          </button>
        </header>
        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t.settings.preferences}</h3>
            <p className={styles.prefLabel}>{t.settings.language}</p>
            <div className={styles.langRow}>
              {langChip('zh-TW', '繁中')}
              {langChip('zh-CN', '简中')}
              {langChip('en', 'EN')}
            </div>
            <p className={styles.prefLabel}>{t.settings.theme}</p>
            <div className={styles.themeRow}>
              <button
                type="button"
                className={`${styles.themeBtn} ${theme === 'dark' ? styles.themeBtnActive : ''}`}
                onClick={() => applyTheme('dark')}
              >
                {t.settings.dark_mode}
              </button>
              <button
                type="button"
                className={`${styles.themeBtn} ${theme === 'light' ? styles.themeBtnActive : ''}`}
                onClick={() => applyTheme('light')}
              >
                {t.settings.light_mode}
              </button>
            </div>
            <label className={styles.prefLabel} htmlFor="daily-target-input">
              {t.settings.daily_target}
            </label>
            <input
              id="daily-target-input"
              type="number"
              min={1}
              max={2000}
              className={styles.targetInput}
              value={dailyTarget}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                if (Number.isFinite(n) && n > 0) onDailyTargetChange(n)
              }}
            />
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t.settings.rake_dialog_title}</h3>
            <h4 className={styles.subHeading}>{t.settings.rake_sec1_title}</h4>
            <p className={styles.sectionText}>{t.settings.rake_sec1_p1}</p>
            <p className={styles.sectionText}>{t.settings.rake_sec1_p2}</p>
            <h4 className={styles.subHeading}>{t.settings.rake_sec2_title}</h4>
            <p className={styles.sectionText}>{t.settings.rake_sec2_p1}</p>
            <p className={styles.sectionText}>{t.settings.rake_sec2_p2}</p>
            <p className={styles.sectionText}>{t.settings.rake_sec2_p3}</p>
            <h4 className={styles.subHeading}>{t.settings.rake_sec3_title}</h4>
            <ul className={styles.list}>
              <li>{t.settings.rake_sec3_li1}</li>
              <li>{t.settings.rake_sec3_li2}</li>
              <li>{t.settings.rake_sec3_li3}</li>
              <li>{t.settings.rake_sec3_li4}</li>
            </ul>
            <div className={styles.sourceBlock}>
              <p className={styles.sourceLabel}>{t.settings.rake_source_label}</p>
              <p className={styles.sourceQuote}>{t.settings.rake_source_quote}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
