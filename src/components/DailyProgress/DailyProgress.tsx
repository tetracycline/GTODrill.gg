import type { DailyProgress as DailyProgressData } from '../../hooks/useDailyProgress'
import { useTranslation } from '../../i18n/LanguageContext'
import styles from './DailyProgress.module.css'

export interface DailyProgressProps {
  progress: DailyProgressData
  accuracy: number
  pct: number
  target: number
}

/**
 * 側邊欄今日練習進度條與準確率。
 */
export function DailyProgress({ progress, accuracy, pct, target }: DailyProgressProps) {
  const { t } = useTranslation()
  const barClass =
    pct >= 80 ? styles.barGreen : pct >= 50 ? styles.barAmber : styles.barGray

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{t.daily.today_practice}</div>
      <div className={styles.barTrack}>
        <div className={`${styles.barFill} ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.counts}>
        {progress.total}/{target} {t.daily.hands_unit}
      </div>
      <div className={styles.accuracy}>
        {t.daily.accuracy} {accuracy}%
      </div>
    </div>
  )
}
