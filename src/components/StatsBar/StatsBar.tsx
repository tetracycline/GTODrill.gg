import { useTranslation } from '../../i18n/LanguageContext'
import styles from './StatsBar.module.css'

export interface StatsBarProps {
  total: number
  correct: number
  streak: number
}

/**
 * 統計列：總計、正確、準確率、連續正確。
 */
export function StatsBar({ total, correct, streak }: StatsBarProps) {
  const { t } = useTranslation()
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.item}>
          <div className={styles.label}>{t.stats_bar.total}</div>
          <div className={styles.value}>{total}</div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>{t.stats_bar.correct}</div>
          <div
            className={`${styles.value} ${correct > 0 ? styles.valueCorrectPositive : ''}`}
          >
            {correct}
          </div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>{t.stats_bar.accuracy}</div>
          <div className={styles.value}>{accuracy}%</div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>{t.stats_bar.streak}</div>
          <div className={styles.value}>
            {streak} 🔥
          </div>
        </div>
      </div>
    </div>
  )
}
