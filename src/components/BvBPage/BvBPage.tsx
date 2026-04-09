import { useCallback, useEffect, useState } from 'react'
import {
  getBvBBBAction,
  getBvBBBDefendPercent,
  getBvBSBFourbetPercent,
  getBvBSBVs3betAction,
  handName,
  type BvBBBAction,
  type BvBSBVs3betAction,
} from '../../utils/ranges'
import { useKeyboard } from '../../hooks/useKeyboard'
import { useBvBQuiz } from '../../hooks/useBvBQuiz'
import { PlayingCard } from '../PlayingCard/PlayingCard'
import { RangeMatrix, type MatrixFlash } from '../RangeMatrix/RangeMatrix'
import { ShortcutOverlay } from '../ShortcutOverlay/ShortcutOverlay'
import { StatsBar } from '../StatsBar/StatsBar'
import { OpponentProfile } from '../OpponentProfile/OpponentProfile'
import type { Translations } from '../../i18n/types'
import { useTranslation } from '../../i18n/LanguageContext'
import styles from './BvBPage.module.css'

export interface BvBPageProps {
  quiz: ReturnType<typeof useBvBQuiz>
}

/**
 * @param s - 動作文案
 */
function actionShort(s: string): string {
  const i = s.indexOf(' (')
  return i >= 0 ? s.slice(0, i) : s
}

/**
 * @param a - BB 情境 GTO
 * @param t - 翻譯
 */
function labelBB(a: BvBBBAction, t: Translations): string {
  if (a === '3bet') return actionShort(t.actions.three_bet)
  if (a === 'call') return actionShort(t.actions.call)
  return actionShort(t.actions.fold)
}

/**
 * @param a - SB 情境 GTO
 * @param t - 翻譯
 */
function labelSB(a: BvBSBVs3betAction, t: Translations): string {
  if (a === '4bet') return actionShort(t.actions.four_bet)
  if (a === 'call') return actionShort(t.actions.call)
  return actionShort(t.actions.fold)
}

/**
 * BvB 訓練：BB 防守 SB 開牌 / SB 面對 BB 3-bet。
 */
export function BvBPage({ quiz }: BvBPageProps) {
  const { t } = useTranslation()
  const [shortcutOpen, setShortcutOpen] = useState(false)
  const [matrixFlash, setMatrixFlash] = useState<MatrixFlash>(null)

  const {
    spot,
    setSpot,
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

  const isBB = spot === 'bb_defend'

  useEffect(() => {
    if (phase !== 'result' || lastCorrect === null) {
      setMatrixFlash(null)
      return
    }
    setMatrixFlash(lastCorrect ? 'correct' : 'wrong')
    const t = window.setTimeout(() => setMatrixFlash(null), 300)
    return () => clearTimeout(t)
  }, [phase, lastCorrect, currentHandIdx])

  const getMatrixActionBB = useCallback((idx: number) => getBvBBBAction(idx), [])
  const getMatrixActionSB = useCallback((idx: number) => getBvBSBVs3betAction(idx), [])

  const toggleShortcutOverlay = useCallback(() => setShortcutOpen((o) => !o), [])
  const closeShortcutOverlay = useCallback(() => setShortcutOpen(false), [])

  useKeyboard({
    mode: 'bvb',
    bvbSpot: isBB ? 'bb' : 'sb',
    phase,
    shortcutOpen,
    toggleShortcutOverlay,
    closeShortcutOverlay,
    onNextHand: nextHand,
    onToggleShowRange: () => setShowRange((s) => !s),
    onResetStats: resetStats,
    onBvBbbThreeBet: () => answer('3bet'),
    onBvBbbCall: () => answer('call'),
    onBvBbbFold: () => answer('fold'),
    onBvBsbFourbet: () => answer('4bet'),
    onBvBsbCall: () => answer('call'),
    onBvBsbFold: () => answer('fold'),
  })

  const r = Math.floor(currentHandIdx / 13)
  const c = currentHandIdx % 13
  const name = handName(r, c)
  const gtoBB = getBvBBBAction(currentHandIdx)
  const gtoSB = getBvBSBVs3betAction(currentHandIdx)

  const shortcutMode = isBB ? 'bvb_bb' : 'bvb_sb'
  const defendPct = getBvBBBDefendPercent()
  const fourPct = getBvBSBFourbetPercent()

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.sidebar.bvb}</h1>
        <p className={styles.subtitle}>{t.pages.bvb_subtitle}</p>
      </header>

      <main className={styles.main}>
        <div className={styles.colLeft}>
          <StatsBar total={stats.total} correct={stats.correct} streak={stats.streak} />

          <div className={styles.settingsCard}>
            <div className={styles.titleRow}>
              <span className={styles.cardTitle}>{t.pages.training_mode}</span>
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
            <div className={styles.rowLabel}>{t.pages.pick_scenario}</div>
            <div className={styles.modeRow}>
              <button
                type="button"
                className={`${styles.modeBtn} ${isBB ? styles.modeBtnActive : ''}`}
                onClick={() => setSpot('bb_defend')}
              >
                {t.pages.bvb_bb_defend}
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${!isBB ? styles.modeBtnActive : ''}`}
                onClick={() => setSpot('sb_vs_3bet')}
              >
                {t.pages.bvb_sb_vs}
              </button>
            </div>
          </div>

          <div className={styles.handCard}>
            <div className={styles.badgeRow}>
              {isBB ? (
                <>
                  <span className={styles.badgeSb}>{t.pages.bvb_sb_open}</span>
                  <span style={{ color: '#71717a' }}>→</span>
                  <span className={styles.badgeBb}>{t.pages.bvb_bb_hero}</span>
                </>
              ) : (
                <>
                  <span className={styles.badgeSb}>{t.pages.bvb_sb_hero}</span>
                  <span style={{ color: '#71717a' }}>{t.pages.facing}</span>
                  <span className={styles.badgeBb}>{t.pages.bvb_bb_3bet}</span>
                </>
              )}
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
              isBB ? (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btn3bet}`}
                    onClick={() => answer('3bet')}
                  >
                    {t.actions.three_bet}
                  </button>
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
              )
            ) : (
              <div
                className={`${styles.result} ${lastCorrect ? styles.resultOk : styles.resultBad}`}
              >
                {lastCorrect ? (
                  <>
                    ✓ {t.quiz.correct} {t.quiz.gto_colon}{' '}
                    {isBB ? labelBB(gtoBB, t) : labelSB(gtoSB, t)}
                  </>
                ) : (
                  <>
                    ✗ {t.quiz.wrong} {t.quiz.gto_colon}{' '}
                    {isBB ? labelBB(gtoBB, t) : labelSB(gtoSB, t)}
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
              <RangeMatrix
                colorMode={isBB ? 'vsrfi' : 'vs3bet'}
                getAction={isBB ? getMatrixActionBB : getMatrixActionSB}
                highlightHandIdx={currentHandIdx}
                flash={matrixFlash}
              />
              <div className={styles.legend}>
                {isBB ? (
                  <>
                    <span className={styles.legendItem}>
                      <span className={styles.dot3} aria-hidden />
                      {actionShort(t.actions.three_bet).toUpperCase()}
                    </span>
                    <span className={styles.legendItem}>
                      <span className={styles.dotC} aria-hidden />
                      {actionShort(t.actions.call)}
                    </span>
                    <span className={styles.legendItem}>
                      <span className={styles.dotF} aria-hidden />
                      {actionShort(t.actions.fold)}
                    </span>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              <div className={styles.footer}>
                <span>{isBB ? t.pages.bvb_bb_defend : t.pages.bvb_sb_vs}</span>
                <span className={styles.footerRight}>
                  {isBB
                    ? t.pages.bvb_continue_fmt.replace('{n}', String(defendPct))
                    : t.pages.bvb_fourbet_stat_fmt.replace('{n}', String(fourPct))}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <ShortcutOverlay open={shortcutOpen} onClose={closeShortcutOverlay} mode={shortcutMode} />
    </>
  )
}
