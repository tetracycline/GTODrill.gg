import { useCallback, useEffect, useState } from 'react'
import { getPushPercentForStack, handName, isPush } from '../../utils/ranges'
import { useKeyboard } from '../../hooks/useKeyboard'
import { usePushFoldQuiz } from '../../hooks/usePushFoldQuiz'
import { PlayingCard } from '../PlayingCard/PlayingCard'
import { RangeMatrix, type MatrixFlash } from '../RangeMatrix/RangeMatrix'
import { ShortcutOverlay } from '../ShortcutOverlay/ShortcutOverlay'
import { StatsBar } from '../StatsBar/StatsBar'
import { useTranslation } from '../../i18n/LanguageContext'
import styles from './PushFoldPage.module.css'

const POS_HINTS = ['Q', 'W', 'E', 'R', 'T']

export interface PushFoldPageProps {
  quiz: ReturnType<typeof usePushFoldQuiz>
}

/**
 * Push/Fold 訓練頁。
 */
export function PushFoldPage({ quiz }: PushFoldPageProps) {
  const { t } = useTranslation()
  const [shortcutOpen, setShortcutOpen] = useState(false)
  const [matrixFlash, setMatrixFlash] = useState<MatrixFlash>(null)

  const {
    stackBb,
    position,
    currentHandIdx,
    currentCombo,
    phase,
    lastCorrect,
    stats,
    showRange,
    setShowRange,
    answer,
    nextHand,
    selectStackBb,
    selectPosition,
    resetStats,
    stackPresets,
    positionIds,
  } = quiz

  useEffect(() => {
    if (phase !== 'result' || lastCorrect === null) {
      setMatrixFlash(null)
      return
    }
    setMatrixFlash(lastCorrect ? 'correct' : 'wrong')
    const t = window.setTimeout(() => setMatrixFlash(null), 300)
    return () => clearTimeout(t)
  }, [phase, lastCorrect, currentHandIdx])

  const getMatrixAction = useCallback(
    (idx: number) => (isPush(idx, stackBb, position) ? 'push' : 'fold'),
    [stackBb, position],
  )

  const pushPct = getPushPercentForStack(stackBb, position)

  const toggleShortcutOverlay = useCallback(() => setShortcutOpen((o) => !o), [])
  const closeShortcutOverlay = useCallback(() => setShortcutOpen(false), [])

  useKeyboard({
    mode: 'pushfold',
    phase,
    shortcutOpen,
    toggleShortcutOverlay,
    closeShortcutOverlay,
    onNextHand: nextHand,
    onToggleShowRange: () => setShowRange((s) => !s),
    onResetStats: resetStats,
    onPushFoldPush: () => answer('push'),
    onPushFoldFold: () => answer('fold'),
    onPushFoldToggleStack: selectStackBb,
    onPushFoldTogglePos: selectPosition,
  })

  const r = Math.floor(currentHandIdx / 13)
  const c = currentHandIdx % 13
  const name = handName(r, c)
  const gtoPush = isPush(currentHandIdx, stackBb, position)

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.sidebar.push_fold}</h1>
        <p className={styles.subtitle}>{t.pages.pushfold_subtitle}</p>
      </header>

      <main className={styles.main}>
        <div className={styles.colLeft}>
          <StatsBar total={stats.total} correct={stats.correct} streak={stats.streak} />

          <div className={styles.settingsCard}>
            <div className={styles.titleRow}>
              <span className={styles.cardTitle}>{t.pages.quiz_settings}</span>
              <div className={styles.iconRow}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label={t.quiz.keyboard_shortcuts}
                  onClick={() => setShortcutOpen(true)}
                >
                  ⌨
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label={t.quiz.reset_stats}
                  onClick={() => {
                    if (window.confirm(t.quiz.reset_confirm)) resetStats()
                  }}
                >
                  ↺
                </button>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>{t.quiz.stack_depth}</div>
              <div className={styles.positions}>
                {stackPresets.map((bb, i) => (
                  <div key={bb} className={styles.posWrap}>
                    <button
                      type="button"
                      className={`${styles.btnStack} ${stackBb === bb ? styles.btnStackActive : ''}`}
                      onClick={() => selectStackBb(bb)}
                    >
                      {bb} bb
                    </button>
                    <span className={styles.keyHint}>({i + 1})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.rowLabel}>{t.pages.chart_position_row}</div>
              <div className={styles.positions}>
                {positionIds.map((id, i) => (
                  <div key={id} className={styles.posWrap}>
                    <button
                      type="button"
                      className={`${styles.btnPos} ${position === id ? styles.btnPosActive : ''}`}
                      onClick={() => selectPosition(id)}
                    >
                      {id}
                    </button>
                    <span className={styles.keyHint}>({POS_HINTS[i]})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.handCard}>
            <div className={styles.badgeRow}>
              <span className={styles.badgeBb}>{stackBb} bb</span>
              <span className={styles.badgePos}>{position}</span>
            </div>
            <div className={styles.cardsRow}>
              <div className={styles.cardOverlap}>
                <PlayingCard rank={currentCombo.rank1} suit={currentCombo.suit1} />
              </div>
              <div className={styles.cardOverlap}>
                <PlayingCard rank={currentCombo.rank2} suit={currentCombo.suit2} />
              </div>
            </div>
            <div className={styles.handName}>{name}</div>

            {phase === 'question' ? (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPush}`}
                  onClick={() => answer('push')}
                >
                  {t.actions.push}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnFold}`}
                  onClick={() => answer('fold')}
                >
                  {t.actions.fold}
                </button>
              </div>
            ) : (
              <div
                className={`${styles.result} ${lastCorrect ? styles.resultOk : styles.resultBad}`}
              >
                {lastCorrect ? (
                  <>
                    ✓ {t.quiz.correct} {t.quiz.gto_colon}{' '}
                    {gtoPush ? t.pages.gto_push : t.pages.gto_fold}
                  </>
                ) : (
                  <>
                    ✗ {t.quiz.wrong} {t.quiz.gto_colon}{' '}
                    {gtoPush ? t.pages.gto_push : t.pages.gto_fold}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.colRight}>
          <button
            type="button"
            className={`${styles.toggle} ${showRange ? styles.toggleActive : ''}`}
            onClick={() => setShowRange((s) => !s)}
          >
            {showRange ? `◉ ${t.quiz.hide_range}` : `◉ ${t.quiz.show_range}`}
          </button>

          {showRange ? (
            <div className={styles.matrixCard}>
              <div className={styles.headerRow}>
                <span className={styles.headerLabel}>{t.quiz.current_settings}</span>
                <span className={styles.badgeBb}>{stackBb} bb</span>
                <span className={styles.badgePos}>{position}</span>
              </div>
              <RangeMatrix
                colorMode="pushfold"
                getAction={getMatrixAction}
                highlightHandIdx={currentHandIdx}
                flash={matrixFlash}
              />
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.dotP} aria-hidden />
                  {t.pages.gto_push}
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.dotF} aria-hidden />
                  {t.pages.gto_fold}
                </span>
              </div>
              <div className={styles.footer}>
                <span>
                  {t.pages.based_stack_pos
                    .replace('{stack}', String(stackBb))
                    .replace('{pos}', position)}
                </span>
                <span className={styles.footerRight}>
                  {t.pages.push_stat_pct_fmt.replace('{n}', String(pushPct))}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <ShortcutOverlay open={shortcutOpen} onClose={closeShortcutOverlay} mode="pushfold" />
    </>
  )
}
