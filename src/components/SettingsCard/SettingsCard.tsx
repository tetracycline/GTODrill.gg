import { useTranslation } from '../../i18n/LanguageContext'
import styles from './SettingsCard.module.css'

const POSITIONS: { id: string; keyHint: string }[] = [
  { id: 'UTG', keyHint: 'Q' },
  { id: 'HJ', keyHint: 'W' },
  { id: 'CO', keyHint: 'E' },
  { id: 'BTN', keyHint: 'R' },
  { id: 'SB', keyHint: 'T' },
]

export interface SettingsCardProps {
  /** 目前選定的練習位置（單選） */
  selectedPosition: string
  onSelectPosition: (pos: string) => void
  onOpenShortcuts: () => void
  onResetStats: () => void
}

/**
 * 練習位置單選與快捷鍵／重置按鈕。
 */
export function SettingsCard({
  selectedPosition,
  onSelectPosition,
  onOpenShortcuts,
  onResetStats,
}: SettingsCardProps) {
  const { t } = useTranslation()
  const handleReset = () => {
    if (window.confirm(t.quiz.reset_confirm)) {
      onResetStats()
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <span className={styles.label}>{t.quiz.practice_position}</span>
        <div className={styles.iconRow}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={t.quiz.keyboard_shortcuts}
            onClick={onOpenShortcuts}
          >
            ⌨
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={t.quiz.reset_stats}
            onClick={handleReset}
          >
            ↺
          </button>
        </div>
      </div>
      <div className={styles.positions}>
        {POSITIONS.map(({ id, keyHint }) => (
          <div key={id} className={styles.posWrap}>
            <button
              type="button"
              className={`${styles.posBtn} ${selectedPosition === id ? styles.posBtnActive : ''}`}
              onClick={() => onSelectPosition(id)}
            >
              {id}
            </button>
            <span className={styles.keyHint}>({keyHint})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
