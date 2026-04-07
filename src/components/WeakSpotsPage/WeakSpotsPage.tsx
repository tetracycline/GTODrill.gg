import { useMemo, useState } from 'react'
import type { WeakSpot } from '../../utils/weakSpots'
import {
  countWeakSpotsForMode,
  modeAccuracyPercent,
  weakSpotHandLabel,
  weakSpotModeLabel,
  WEAK_SPOT_TRACKED_MODES,
} from '../../utils/weakSpots'
import type { DailyProgress } from '../../hooks/useDailyProgress'
import { useTranslation } from '../../i18n/LanguageContext'
import styles from './WeakSpotsPage.module.css'

export interface WeakSpotsPageProps {
  spots: readonly WeakSpot[]
  progressByMode: DailyProgress['byMode']
  onStartReview: (mode: (typeof WEAK_SPOT_TRACKED_MODES)[number]) => void
}

/**
 * 弱點分析：依模式列出錯題加權項目並可一鍵進入複習。
 */
export function WeakSpotsPage({ spots, progressByMode, onStartReview }: WeakSpotsPageProps) {
  const { t } = useTranslation()
  const [openMode, setOpenMode] = useState<string | null>(null)

  const modesWithAny = useMemo(() => {
    return WEAK_SPOT_TRACKED_MODES.filter((m) => countWeakSpotsForMode(spots, m) > 0)
  }, [spots])

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.sidebar.weak_spots}</h1>
        <p className={styles.subtitle}>{t.pages.weakspots_subtitle}</p>
      </header>

      <main className={styles.main}>
        {modesWithAny.length === 0 ? (
          <div className={styles.empty}>{t.pages.weakspots_empty}</div>
        ) : (
          modesWithAny.map((mode) => {
            const list = spots.filter((s) => s.mode === mode)
            const n = list.length
            const acc = modeAccuracyPercent(progressByMode, mode)
            const expanded = openMode === mode

            return (
              <div key={mode} className={styles.card}>
                <div className={styles.row}>
                  <div>
                    <div className={styles.modeName}>{weakSpotModeLabel(mode)}</div>
                    <div className={styles.stats}>
                      {t.pages.weakspots_leaks_fmt.replace('{n}', String(n))}
                      {acc != null ? ` ／ ${t.quiz.accuracy} ${acc}%` : ''}
                    </div>
                  </div>
                  <button type="button" className={styles.btn} onClick={() => onStartReview(mode)}>
                    {t.pages.weakspots_review}
                  </button>
                </div>
                <div className={styles.details}>
                  <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => setOpenMode(expanded ? null : mode)}
                    aria-expanded={expanded}
                  >
                    {expanded ? t.pages.weakspots_collapse : t.pages.weakspots_expand}
                  </button>
                  {expanded
                    ? list.map((s, i) => (
                        <div key={`${s.mode}-${s.position}-${s.handIdx}-${s.questionId}-${i}`} className={styles.spotLine}>
                          {s.questionId != null
                            ? t.pages.weakspots_spot_question_fmt
                                .replace('{pos}', s.position)
                                .replace('{id}', String(s.questionId))
                                .replace('{n}', String(s.wrongCount))
                            : t.pages.weakspots_spot_hand_fmt
                                .replace('{pos}', s.position)
                                .replace(
                                  '{hand}',
                                  s.handIdx != null ? weakSpotHandLabel(s.handIdx) : '?',
                                )
                                .replace('{n}', String(s.wrongCount))}
                        </div>
                      ))
                    : null}
                </div>
              </div>
            )
          })
        )}
      </main>
    </>
  )
}
