import { handName, isRFI } from '../../utils/ranges'
import type { CurrentCombo, QuizPhase } from '../../hooks/useQuiz'
import { useTranslation } from '../../i18n/LanguageContext'
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
  const r = Math.floor(handIdx / 13)
  const c = handIdx % 13
  const name = handName(r, c)
  const gtoRaise = isRFI(handIdx, positionLabel)
  const gtoLabel = actionLabelShort(gtoRaise ? t.actions.raise : t.actions.fold)

  return (
    <div className={styles.card}>
      <div className={styles.badge}>{positionLabel}</div>

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
  )
}
