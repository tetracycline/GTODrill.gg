import { useCallback, useEffect, useState } from 'react'
import { handName, type VsRFIAction } from '../../utils/ranges'
import { useKeyboard } from '../../hooks/useKeyboard'
import { useVsRFIQuiz } from '../../hooks/useVsRFIQuiz'
import { PlayingCard } from '../PlayingCard/PlayingCard'
import { RangeMatrix, type MatrixFlash } from '../RangeMatrix/RangeMatrix'
import { ShortcutOverlay } from '../ShortcutOverlay/ShortcutOverlay'
import { StatsBar } from '../StatsBar/StatsBar'
import { OpponentProfile } from '../OpponentProfile/OpponentProfile'
import { VsRFISettingsCard } from '../VsRFISettingsCard/VsRFISettingsCard'
import type { Translations } from '../../i18n/types'
import { useTranslation } from '../../i18n/LanguageContext'
import { useOpponentType } from '../../contexts/OpponentTypeContext'
import { getAdjustedVsRFIAction } from '../../utils/exploitRanges'
import styles from './VsRFIPage.module.css'

/**
 * @param s - 按鈕文案
 */
function actionShort(s: string): string {
  const i = s.indexOf(' (')
  return i >= 0 ? s.slice(0, i) : s
}

/**
 * @param a - GTO 動作
 * @param t - 翻譯
 */
function gtoActionLabel(a: VsRFIAction, t: Translations): string {
  if (a === '3bet') return actionShort(t.actions.three_bet)
  if (a === 'call') return actionShort(t.actions.call)
  return actionShort(t.actions.fold)
}

export interface VsRFIPageProps {
  quiz: ReturnType<typeof useVsRFIQuiz>
}

/**
 * VS RFI 訓練整頁：統計、設定、手牌、範圍矩陣。
 */
export function VsRFIPage({ quiz }: VsRFIPageProps) {
  const { t } = useTranslation()
  const { opponentType } = useOpponentType()
  const [shortcutOpen, setShortcutOpen] = useState(false)
  const [matrixFlash, setMatrixFlash] = useState<MatrixFlash>(null)

  const {
    villainPos,
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
    selectVillain,
    selectHero,
    resetStats,
    heroIds,
    invalidComboHint,
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
    (idx: number) => getAdjustedVsRFIAction(idx, heroPos, villainPos, opponentType),
    [heroPos, villainPos, opponentType],
  )

  const toggleShortcutOverlay = useCallback(() => setShortcutOpen((o) => !o), [])
  const closeShortcutOverlay = useCallback(() => setShortcutOpen(false), [])

  const onThreeBet = useCallback(() => answer('3bet'), [answer])
  const onCall = useCallback(() => answer('call'), [answer])
  const onFold = useCallback(() => answer('fold'), [answer])

  useKeyboard({
    mode: 'vsrfi',
    phase,
    shortcutOpen,
    toggleShortcutOverlay,
    closeShortcutOverlay,
    onNextHand: nextHand,
    onToggleShowRange: () => setShowRange((s) => !s),
    onResetStats: resetStats,
    onVsRfiThreeBet: onThreeBet,
    onVsRfiCall: onCall,
    onVsRfiFold: onFold,
    onVsRfiToggleVillain: selectVillain,
  })

  const r = Math.floor(currentHandIdx / 13)
  const c = currentHandIdx % 13
  const name = handName(r, c)
  const gto = getAdjustedVsRFIAction(currentHandIdx, heroPos, villainPos, opponentType)
  const gtoLabel = gtoActionLabel(gto, t)

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.sidebar.vs_rfi}</h1>
        <p className={styles.subtitle}>{t.pages.vsrfi_subtitle}</p>
      </header>

      <main className={styles.main}>
        <div className={styles.colLeft}>
          <StatsBar total={stats.total} correct={stats.correct} streak={stats.streak} />
          <VsRFISettingsCard
            selectedVillain={villainPos}
            selectedHero={heroPos}
            heroIds={heroIds}
            onSelectVillain={selectVillain}
            onSelectHero={selectHero}
            onOpenShortcuts={() => setShortcutOpen(true)}
            onResetStats={resetStats}
          />

          {invalidComboHint ? (
            <div className={styles.comboHint} role="alert">
              {invalidComboHint}
            </div>
          ) : null}

          <div className={styles.handCard}>
            <div className={styles.badgeRow}>
              <div className={styles.badgeGroup}>
                <span>Hero</span>
                <span className={styles.badgeHero}>{heroPos}</span>
              </div>
              <div className={styles.badgeGroup}>
                <span>Villain</span>
                <span className={styles.badgeVillain}>{villainPos}</span>
              </div>
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
                  className={`${styles.btn} ${styles.btn3bet}`}
                  disabled={!!invalidComboHint}
                  onClick={onThreeBet}
                >
                  {t.actions.three_bet}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnCall}`}
                  disabled={!!invalidComboHint}
                  onClick={onCall}
                >
                  {t.actions.call}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnFold}`}
                  disabled={!!invalidComboHint}
                  onClick={onFold}
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
                    ✓ {t.quiz.correct} {t.quiz.gto_colon} {gtoLabel}
                  </>
                ) : (
                  <>
                    ✗ {t.quiz.wrong} {t.quiz.gto_colon} {gtoLabel}
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
                <span className={styles.headerLabel}>Hero</span>
                <span className={styles.badgeHero}>{heroPos}</span>
                <span className={styles.headerLabel}>Villain</span>
                <span className={styles.badgeVillain}>{villainPos}</span>
              </div>
              <RangeMatrix
                colorMode="vsrfi"
                getAction={getMatrixAction}
                highlightHandIdx={currentHandIdx}
                flash={matrixFlash}
              />
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.dot3bet} aria-hidden />
                  3-BET
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.dotCall} aria-hidden />
                  Call
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.dotFold} aria-hidden />
                  Fold
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <ShortcutOverlay open={shortcutOpen} onClose={closeShortcutOverlay} mode="vsrfi" />
    </>
  )
}
