import { RANKS } from './ranges'

export type SuitCode = 's' | 'h' | 'd' | 'c'

export const SUIT_SYMBOL: Record<SuitCode, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
}

/**
 * 依手牌索引產生兩張牌的點數與花色（符合同花/不同花/對子）。
 * @param handIdx - 0–168
 */
export function pickComboForHandIndex(handIdx: number): {
  rank1: string
  rank2: string
  suit1: SuitCode
  suit2: SuitCode
} {
  const r = Math.floor(handIdx / 13)
  const c = handIdx % 13

  const pickSuit = (): SuitCode => {
    const codes: SuitCode[] = ['s', 'h', 'd', 'c']
    return codes[Math.floor(Math.random() * 4)]!
  }

  if (r === c) {
    const rank = RANKS[r]!
    let suit1 = pickSuit()
    let suit2 = pickSuit()
    while (suit2 === suit1) suit2 = pickSuit()
    return { rank1: rank, rank2: rank, suit1, suit2 }
  }

  if (r < c) {
    const suit = pickSuit()
    return { rank1: RANKS[r]!, rank2: RANKS[c]!, suit1: suit, suit2: suit }
  }

  const high = RANKS[c]!
  const low = RANKS[r]!
  let suit1 = pickSuit()
  let suit2 = pickSuit()
  while (suit2 === suit1) suit2 = pickSuit()
  return { rank1: high, rank2: low, suit1, suit2 }
}
