import { useOpponentType } from '../../contexts/OpponentTypeContext'
import type { CurrentCombo, QuizPhase } from '../../hooks/useQuiz'
import { useTranslation } from '../../i18n/LanguageContext'
import type { OpponentType } from '../../types/opponentType'
import { getAdjustedRFIAction } from '../../utils/exploitRanges'
import { handName, isRFI } from '../../utils/ranges'
import { PlayingCard } from '../PlayingCard/PlayingCard'
import styles from './HandCard.module.css'

/**
 * @param label - 按鈕文案（可能含快捷鍵括號）
 * @returns 括號前片段，供 GTO 行顯示
 */
function actionLabelShort(label: string): string {
  const i = label.indexOf(' (')
  return i >= 0 ? label.slice(0, i) : label
}

/**
 * @param type - 桌型 id
 * @param tr - 翻譯 `opponent_type` 區塊
 */
function opponentTypeShortLabel(
  type: OpponentType,
  tr: {
    gto: string
    fish: string
    nit: string
    aggro: string
    reg: string
  },
): string {
  switch (type) {
    case 'gto':
      return tr.gto
    case 'fish':
      return tr.fish
    case 'nit':
      return tr.nit
    case 'aggro':
      return tr.aggro
    case 'reg':
      return tr.reg
    default:
      return tr.gto
  }
}

export interface HandCardProps {
  positionLabel: string
  handIdx: number
  combo: CurrentCombo
  phase: QuizPhase
  lastCorrect: boolean | null
  onRaise: () => void
  onFold: () => void
}

/**
 * 位置徽章、兩張牌、手牌名、Raise/Fold 或結果區塊。
 */
export function HandCard({
  positionLabel,
  handIdx,
  combo,
  phase,
  lastCorrect,
  onRaise,
  onFold,
}: HandCardProps) {
  const { t } = useTranslation()
  const { opponentType } = useOpponentType()
  const r = Math.floor(handIdx / 13)
  const c = handIdx % 13
  const name = handName(r, c)
  const solverRaise = isRFI(handIdx, positionLabel)
  const expectedRaise = getAdjustedRFIAction(handIdx, positionLabel, opponentType) === 'raise'
  const solverLabel = actionLabelShort(solverRaise ? t.actions.raise : t.actions.fold)
  const expectedLabel = actionLabelShort(expectedRaise ? t.actions.raise : t.actions.fold)
  const tableDiffers = expectedRaise !== solverRaise

  return (
    <div className={styles.card}>
      <div className={styles.badge}>{positionLabel}</div>
      <div className={styles.opponentBadge}>
        {t.opponent_type.playing_vs}: {opponentTypeShortLabel(opponentType, t.opponent_type)}
      </div>

      <div className={styles.cardsRow}>
        <div className={styles.cardOverlap}>
          <PlayingCard rank={combo.rank1} suit={combo.suit1} />
        </div>
        <div className={styles.cardOverlap}>
          <PlayingCard rank={combo.rank2} suit={combo.suit2} />
        </div>
      </div>

      <div className={styles.handName}>{name}</div>

      {phase === 'question' ? (
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnRaise}`} onClick={onRaise}>
            {t.actions.raise}
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnFold}`} onClick={onFold}>
            {t.actions.fold}
          </button>
        </div>
      ) : (
        <div
          className={`${styles.result} ${lastCorrect ? styles.resultOk : styles.resultBad}`}
        >
          {lastCorrect ? (
            <>
              ✓ {t.quiz.correct}{' '}
              {tableDiffers ? (
                <>
                  {t.opponent_type.expected_colon}
                  {expectedLabel} · {t.opponent_type.solver_gto_colon}
                  {solverLabel}
                </>
              ) : (
                <>
                  {t.quiz.gto_colon} {solverLabel}
                </>
              )}
            </>
          ) : (
            <>
              ✗ {t.quiz.wrong}{' '}
              {tableDiffers ? (
                <>
                  {t.opponent_type.expected_colon}
                  {expectedLabel} · {t.opponent_type.solver_gto_colon}
                  {solverLabel}
                </>
              ) : (
                <>
                  {t.quiz.gto_colon} {solverLabel}
                </>
              )}
            </>
          )}
          {tableDiffers ? (
            <div className={styles.overrideDetail}>
              <p className={styles.overrideDetailLine}>
                {expectedRaise && !solverRaise ? t.quiz.rfi_explain_fish_adjust : null}
                {!expectedRaise && solverRaise ? t.quiz.rfi_explain_nit_adjust : null}
              </p>
              <p className={styles.overrideDetailLine}>
                {t.quiz.rfi_explain_gto_answer.replace('{action}', solverLabel)}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
