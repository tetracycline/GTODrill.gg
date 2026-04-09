import { useCallback, useEffect, useState } from 'react'
import {
  getCold4betAction,
  handName,
  hasCold4betCallRange,
  type Cold4betAction,
} from '../../utils/ranges'
import { useCold4betQuiz } from '../../hooks/useCold4betQuiz'
import { useKeyboard } from '../../hooks/useKeyboard'
import { PlayingCard } from '../PlayingCard/PlayingCard'
import { RangeMatrix, type MatrixFlash } from '../RangeMatrix/RangeMatrix'
import { ShortcutOverlay } from '../ShortcutOverlay/ShortcutOverlay'
import { StatsBar } from '../StatsBar/StatsBar'
import { OpponentProfile } from '../OpponentProfile/OpponentProfile'
import type { Translations } from '../../i18n/types'
import { useTranslation } from '../../i18n/LanguageContext'
import styles from './Cold4betPage.module.css'

export interface Cold4betPageProps {
  quiz: ReturnType<typeof useCold4betQuiz>
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
function coldGtoLabel(a: Cold4betAction, t: Translations): string {
  if (a === '4bet') return actionShort(t.actions.four_bet)
  if (a === 'call') return actionShort(t.actions.call)
  return actionShort(t.actions.fold)
}

/**
 * Cold 4-Bet 訓練頁。
 */
export function Cold4betPage({ quiz }: Cold4betPageProps) {
  const { t } = useTranslation()
  const [shortcutOpen, setShortcutOpen] = useState(false)
  const [matrixFlash, setMatrixFlash] = useState<MatrixFlash>(null)

  const {
    heroPos,
    currentHandIdx,
    currentCombo,
    phase,
    lastCorrect,
    stats,
    showRange,
    setShowRange,
    answer,
    nextHand,
    selectHeroPos,
    resetStats,
    heroIds,
  } = quiz

  const canCall = hasCold4betCallRange(heroPos)

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
    (idx: number) => getCold4betAction(idx, heroPos),
    [heroPos],
  )

  const toggleShortcutOverlay = useCallback(() => setShortcutOpen((o) => !o), [])
  const closeShortcutOverlay = useCallback(() => setShortcutOpen(false), [])

  useKeyboard({
    mode: 'cold4bet',
    phase,
    shortcutOpen,
    toggleShortcutOverlay,
    closeShortcutOverlay,
    onNextHand: nextHand,
    onToggleShowRange: () => setShowRange((s) => !s),
    onResetStats: resetStats,
    onCold4betFourbet: () => answer('4bet'),
    onCold4betCall: () => {
      if (canCall) answer('call')
    },
    onCold4betFold: () => answer('fold'),
    onCold4betToggleHero: selectHeroPos,
  })

  const r = Math.floor(currentHandIdx / 13)
  const c = currentHandIdx % 13
  const name = handName(r, c)
  const gto = getCold4betAction(currentHandIdx, heroPos)

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.sidebar.cold_4bet}</h1>
        <p className={styles.subtitle}>{t.pages.cold4_subtitle}</p>
      </header>

      <main className={styles.main}>
        <div className={styles.colLeft}>
          <StatsBar total={stats.total} correct={stats.correct} streak={stats.streak} />

          <div className={styles.settingsCard}>
            <div className={styles.titleRow}>
              <span className={styles.cardTitle}>{t.pages.cold_settings_title}</span>
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
            <div className={styles.rowLabel}>{t.pages.hero_row_cold}</div>
            <div className={styles.positions}>
              {heroIds.map((id, i) => (
                <div key={id} className={styles.posWrap}>
                  <button
                    type="button"
                    className={`${styles.posBtn} ${heroPos === id ? styles.posBtnActive : ''}`}
                    onClick={() => selectHeroPos(id)}
                  >
                    {id}
                  </button>
                  <span className={styles.keyHint}>({i + 1})</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.handCard}>
            <div className={styles.badge}>{heroPos}</div>
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
                  className={`${styles.btn} ${styles.btn4bet}`}
                  onClick={() => answer('4bet')}
                >
                  {t.actions.four_bet}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnCall} ${!canCall ? styles.btnDisabled : ''}`}
                  disabled={!canCall}
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
                    ✓ {t.quiz.correct} {t.quiz.gto_colon} {coldGtoLabel(gto, t)}
                  </>
                ) : (
                  <>
                    ✗ {t.quiz.wrong} {t.quiz.gto_colon} {coldGtoLabel(gto, t)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.colRight}>
          <OpponentProfile />
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
                <span className={styles.badgePill}>{heroPos}</span>
              </div>
              <RangeMatrix
                colorMode="cold4bet"
                getAction={getMatrixAction}
                highlightHandIdx={currentHandIdx}
                flash={matrixFlash}
              />
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.dot4} aria-hidden />
                  {actionShort(t.actions.four_bet).toUpperCase()}
                </span>
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
                <span>{t.pages.cold_footer_left}</span>
                <span>{t.pages.cold_ip_oop_note}</span>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <ShortcutOverlay
        open={shortcutOpen}
        onClose={closeShortcutOverlay}
        mode="cold4bet"
      />
    </>
  )
}
