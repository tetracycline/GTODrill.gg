import { useCallback, useEffect, useState } from 'react'
import { getVs4betAction, getVs4betCallPercent, handName, type Vs4betAction } from '../../utils/ranges'
import { useKeyboard } from '../../hooks/useKeyboard'
import { useVs4betQuiz } from '../../hooks/useVs4betQuiz'
import { PlayingCard } from '../PlayingCard/PlayingCard'
import { RangeMatrix, type MatrixFlash } from '../RangeMatrix/RangeMatrix'
import { ShortcutOverlay } from '../ShortcutOverlay/ShortcutOverlay'
import { StatsBar } from '../StatsBar/StatsBar'
import type { Translations } from '../../i18n/types'
import { useTranslation } from '../../i18n/LanguageContext'
import styles from './Vs4betPage.module.css'

export interface Vs4betPageProps {
  quiz: ReturnType<typeof useVs4betQuiz>
}

/**
 * @param s - 文案
 */
function actionShort(s: string): string {
  const i = s.indexOf(' (')
  return i >= 0 ? s.slice(0, i) : s
}

/**
 * @param a - GTO
 * @param t - 翻譯
 */
function gtoVs4Label(a: Vs4betAction, t: Translations): string {
  return a === 'call' ? actionShort(t.actions.call) : actionShort(t.actions.fold)
}

/**
 * VS 4BET 訓練頁。
 */
export function Vs4betPage({ quiz }: Vs4betPageProps) {
  const { t } = useTranslation()
  const [shortcutOpen, setShortcutOpen] = useState(false)
  const [matrixFlash, setMatrixFlash] = useState<MatrixFlash>(null)

  const {
    currentHandIdx,
    currentCombo,
    phase,
    lastCorrect,
    stats,
    showRange,
    setShowRange,
    answer,
    nextHand,
    resetStats,
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
    (idx: number) => (getVs4betAction(idx) === 'call' ? 'call' : 'fold'),
    [],
  )

  const toggleShortcutOverlay = useCallback(() => setShortcutOpen((o) => !o), [])
  const closeShortcutOverlay = useCallback(() => setShortcutOpen(false), [])

  useKeyboard({
    mode: 'vs4bet',
    phase,
    shortcutOpen,
    toggleShortcutOverlay,
    closeShortcutOverlay,
    onNextHand: nextHand,
    onToggleShowRange: () => setShowRange((s) => !s),
    onResetStats: resetStats,
    onVs4betCall: () => answer('call'),
    onVs4betFold: () => answer('fold'),
  })

  const r = Math.floor(currentHandIdx / 13)
  const c = currentHandIdx % 13
  const name = handName(r, c)
  const gto = getVs4betAction(currentHandIdx)
  const callPct = getVs4betCallPercent()

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.sidebar.vs_4bet}</h1>
        <p className={styles.subtitle}>{t.pages.vs4_subtitle}</p>
      </header>

      <main className={styles.main}>
        <div className={styles.colLeft}>
          <StatsBar total={stats.total} correct={stats.correct} streak={stats.streak} />

          <div className={styles.settingsCard}>
            <div className={styles.titleRow}>
              <span className={styles.cardTitle}>{t.pages.scenario_settings}</span>
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
            <p className={styles.infoLine}>{t.pages.vs4_info}</p>
            <p className={styles.infoSmall}>{t.pages.vs4_gto_tip}</p>
          </div>

          <div className={styles.handCard}>
            <div className={styles.badge}>3BET</div>
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
                  className={`${styles.btn} ${styles.btnCall}`}
                  onClick={() => answer('call')}
                >
                  {t.actions.call}
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
                    ✓ {t.quiz.correct} {t.quiz.gto_colon} {gtoVs4Label(gto, t)}
                  </>
                ) : (
                  <>
                    ✗ {t.quiz.wrong} {t.quiz.gto_colon} {gtoVs4Label(gto, t)}
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
              <RangeMatrix
                colorMode="vs4bet"
                getAction={getMatrixAction}
                highlightHandIdx={currentHandIdx}
                flash={matrixFlash}
              />
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.dotC} aria-hidden />
                  {actionShort(t.actions.call)}
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.dotF} aria-hidden />
                  {actionShort(t.actions.fold)}
                </span>
              </div>
              <div className={styles.footer}>
                <span>{t.pages.vs4_footer_depth}</span>
                <span className={styles.footerRight}>
                  {t.pages.vs4_call_pct_fmt.replace('{n}', String(callPct))}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <ShortcutOverlay open={shortcutOpen} onClose={closeShortcutOverlay} mode="vs4bet" />
    </>
  )
}
