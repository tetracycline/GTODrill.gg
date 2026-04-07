import { useCallback, useState } from 'react'
import { useKeyboard } from '../../hooks/useKeyboard'
import { usePostflopQuiz } from '../../hooks/usePostflopQuiz'
import { PlayingCard } from '../PlayingCard/PlayingCard'
import { ShortcutOverlay } from '../ShortcutOverlay/ShortcutOverlay'
import { StatsBar } from '../StatsBar/StatsBar'
import { parseBoardCards, parseTwoCardString } from '../../utils/postflopAI'
import { useTranslation } from '../../i18n/LanguageContext'
import styles from './PostflopPage.module.css'

export interface PostflopPageProps {
  quiz: ReturnType<typeof usePostflopQuiz>
}

/**
 * 解析位置字串為兩側標籤（如 BTN vs BB）。
 */
function parsePositionParts(position: string): { left: string; right: string } | null {
  const m = position.match(/^(.+?)\s+vs\s+(.+)$/i)
  if (!m) return null
  return { left: m[1]!.trim(), right: m[2]!.trim() }
}

/**
 * 翻後 C-Bet 訓練頁。
 */
export function PostflopPage({ quiz }: PostflopPageProps) {
  const { t } = useTranslation()
  const [shortcutOpen, setShortcutOpen] = useState(false)
  const { currentQuestion, phase, pickedOption, stats, answer, nextHand, resetStats } = quiz

  const toggleShortcutOverlay = useCallback(() => setShortcutOpen((o) => !o), [])
  const closeShortcutOverlay = useCallback(() => setShortcutOpen(false), [])

  const answerByIndex = useCallback(
    (index: number) => {
      if (!currentQuestion || phase !== 'question') return
      const opt = currentQuestion.options[index]
      if (opt) answer(opt)
    },
    [currentQuestion, phase, answer],
  )

  useKeyboard({
    mode: 'postflop-cbet',
    phase,
    shortcutOpen,
    toggleShortcutOverlay,
    closeShortcutOverlay,
    onNextHand: nextHand,
    onToggleShowRange: () => {},
    onResetStats: resetStats,
    onPostflopOptionIndex: answerByIndex,
    postflopOptionCount: currentQuestion?.options.length ?? 0,
  })

  const posParts = currentQuestion ? parsePositionParts(currentQuestion.position) : null
  const heroParsed = currentQuestion ? parseTwoCardString(currentQuestion.heroCards) : null
  const boardCards = currentQuestion ? parseBoardCards(currentQuestion.board) : []

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.pages.postflop_page_title}</h1>
        <p className={styles.subtitle}>{t.pages.postflop_subtitle}</p>
      </header>

      <main className={styles.main}>
        <div className={styles.colLeft}>
          <StatsBar total={stats.total} correct={stats.correct} streak={stats.streak} />

          <div className={styles.settingsCard}>
            <div className={styles.titleRow}>
              <span className={styles.cardTitle}>{t.pages.postflop_card_title}</span>
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

          {phase === 'loading' ? (
            <div className={styles.loadingBox}>{t.pages.postflop_loading}</div>
          ) : null}

          {currentQuestion && phase !== 'loading' ? (
            <>
              <div className={styles.situationCard}>
                <div className={styles.posRow}>
                  {posParts ? (
                    <>
                      <span className={styles.badgeBtn}>{posParts.left}</span>
                      <span className={styles.badgeVs}>vs</span>
                      <span className={styles.badgeBb}>{posParts.right}</span>
                    </>
                  ) : (
                    <span className={styles.badgeBb}>{currentQuestion.position}</span>
                  )}
                </div>

                <div className={styles.boardRow}>
                  <span className={styles.boardLabel}>{t.quiz.board}</span>
                  {boardCards.length === 0 ? (
                    <span className={`${styles.cardPill} ${styles.cardPillDark}`}>
                      {t.pages.postflop_preflop_pill}
                    </span>
                  ) : (
                    boardCards.map((c, i) => (
                      <span
                        key={`${c.rank}${c.suit}-${i}`}
                        className={`${styles.cardPill} ${c.suit === 'h' || c.suit === 'd' ? styles.cardPillRed : styles.cardPillDark}`}
                      >
                        {c.rank}
                        {c.suit === 's' ? '♠' : c.suit === 'h' ? '♥' : c.suit === 'd' ? '♦' : '♣'}
                      </span>
                    ))
                  )}
                </div>
                <div className={styles.boardTypeSub}>{currentQuestion.boardType}</div>

                <div className={styles.heroRow}>
                  <span className={styles.heroLabel}>{t.quiz.your_hand}</span>
                  {heroParsed ? (
                    <div className={styles.heroCards}>
                      <div className={styles.heroOverlap}>
                        <PlayingCard rank={heroParsed.rank1} suit={heroParsed.suit1} size="compact" />
                      </div>
                      <div className={styles.heroOverlap}>
                        <PlayingCard rank={heroParsed.rank2} suit={heroParsed.suit2} size="compact" />
                      </div>
                    </div>
                  ) : (
                    <span className={styles.cardPillDark}>{currentQuestion.heroCards}</span>
                  )}
                </div>

                <div className={styles.metaRow}>
                  {t.quiz.pot} {currentQuestion.pot} · {t.quiz.facing} {currentQuestion.facing}
                </div>

                {currentQuestion.type === 'hardcoded' ? (
                  <span className={styles.badgeGto}>{t.pages.postflop_gto_badge}</span>
                ) : (
                  <span className={styles.badgeAi}>{t.pages.postflop_ai_badge}</span>
                )}
              </div>

              <div className={styles.questionCard}>
                <p className={styles.questionText}>{currentQuestion.question}</p>
                <div className={styles.options}>
                  {currentQuestion.options.map((opt, i) => {
                    const hint = `(${i + 1})`
                    const isResult = phase === 'result'
                    const isCorrectOpt = opt === currentQuestion.correctAnswer
                    const isPicked = pickedOption === opt
                    let extra = ''
                    if (isResult && isCorrectOpt) extra = styles.optCorrect
                    if (isResult && isPicked && !isCorrectOpt) extra = styles.optWrong

                    return (
                      <button
                        key={opt}
                        type="button"
                        className={`${styles.optBtn} ${extra}`}
                        disabled={isResult}
                        onClick={() => answer(opt)}
                      >
                        <span>{opt}</span>
                        <span className={styles.optHint}>
                          {hint}
                          {isResult && isCorrectOpt ? (
                            <span className={styles.markOk}> ✓</span>
                          ) : null}
                          {isResult && isPicked && !isCorrectOpt ? (
                            <span className={styles.markBad}> ✗</span>
                          ) : null}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className={styles.colRight}>
          {phase === 'result' && currentQuestion ? (
            <div className={styles.explainPanel}>
              <div className={styles.explainTitle}>{t.pages.postflop_explain}</div>
              <div className={styles.explainBody}>{currentQuestion.explanation}</div>
              <div className={styles.explainSource}>
                {t.quiz.source}：{currentQuestion.source}
              </div>
              <div className={styles.nextRow}>
                <span className={styles.optHint}>{t.pages.postflop_next_hint}</span>
                <button type="button" className={styles.nextBtn} onClick={nextHand}>
                  {t.pages.postflop_next_btn}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.placeholderExplain}>{t.pages.postflop_placeholder}</div>
          )}
        </div>
      </main>

      <ShortcutOverlay open={shortcutOpen} onClose={closeShortcutOverlay} mode="postflop-cbet" />
    </>
  )
}
