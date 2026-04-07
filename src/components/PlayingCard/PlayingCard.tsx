import type { SuitCode } from '../../utils/cardCombo'
import { SUIT_SYMBOL } from '../../utils/cardCombo'
import styles from './PlayingCard.module.css'

export interface PlayingCardProps {
  rank: string
  suit: SuitCode
  /** 小型尺寸（翻後情境等） */
  size?: 'default' | 'compact'
}

/**
 * 單張撲克牌：四角標示與中央花色。
 */
export function PlayingCard({ rank, suit, size = 'default' }: PlayingCardProps) {
  const sym = SUIT_SYMBOL[suit]
  const colorClass = suit === 'h' || suit === 'd' ? styles.red : styles.black
  const cardClass = size === 'compact' ? `${styles.card} ${styles.cardCompact}` : styles.card

  return (
    <div className={cardClass}>
      <div className={`${styles.cornerTL} ${colorClass}`}>
        <span className={styles.rankTL}>{rank}</span>
        <span className={styles.suitSmall}>{sym}</span>
      </div>
      <div className={`${styles.centerSuit} ${colorClass}`}>{sym}</div>
      <div className={`${styles.cornerBR} ${colorClass}`}>
        <span className={styles.rankBR}>{rank}</span>
        <span className={styles.suitSmall}>{sym}</span>
      </div>
    </div>
  )
}
