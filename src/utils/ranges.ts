// utils/ranges.ts
// Source: PokerCoaching 6-max 100bb GTO ranges (solver-based)

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']

/**
 * @param r - 列索引（0–12）
 * @param c - 欄索引（0–12）
 * @returns 矩陣格對應的手牌字串（如 AA、AKs、65o）
 */
export function handName(r: number, c: number): string {
  if (r === c) return RANKS[r] + RANKS[r]
  if (r < c) return RANKS[r] + RANKS[c] + 's'
  return RANKS[c] + RANKS[r] + 'o'
}

/**
 * @param r - 列索引
 * @param c - 欄索引
 * @returns 0–168 的手牌索引
 */
export function handIndex(r: number, c: number): number {
  return r * 13 + c
}

/**
 * 將如 "66+,A3s+,K8s+" 的範圍字串解析為手牌索引集合。
 * @param rangeStr - 逗號分隔的範圍片段
 */
export function parseRange(rangeStr: string): Set<number> {
  const set = new Set<number>()
  if (!rangeStr.trim()) return set
  const parts = rangeStr.split(',').map((s) => s.trim())

  for (const part of parts) {
    // Pairs: "66+" or "TT" or "22+"
    const pairPlus = part.match(/^([AKQJT98765432]{1})([AKQJT98765432]{1})(\+)?$/)
    if (pairPlus && pairPlus[1] === pairPlus[2]) {
      const startRank = RANKS.indexOf(pairPlus[1])
      const endRank = pairPlus[3] ? 0 : startRank // '+' means up to AA
      for (let r = endRank; r <= startRank; r++) {
        set.add(handIndex(r, r))
      }
      continue
    }

    // Suited: "AKs", "K8s+", "Q9s+"
    const suitedMatch = part.match(/^([AKQJT98765432])([AKQJT98765432])s(\+)?$/)
    if (suitedMatch) {
      const r = RANKS.indexOf(suitedMatch[1])
      const cStart = RANKS.indexOf(suitedMatch[2])
      if (suitedMatch[3]) {
        for (let c = r + 1; c <= cStart; c++) {
          set.add(handIndex(r, c))
        }
      } else {
        set.add(handIndex(r, cStart))
      }
      continue
    }

    // Offsuit: "ATo+", "KJo", "QJo+"
    const offsuitMatch = part.match(/^([AKQJT98765432])([AKQJT98765432])o(\+)?$/)
    if (offsuitMatch) {
      const r = RANKS.indexOf(offsuitMatch[1])
      const cStart = RANKS.indexOf(offsuitMatch[2])
      if (offsuitMatch[3]) {
        for (let c = r + 1; c <= cStart; c++) {
          set.add(handIndex(c, r)) // offsuit: row > col
        }
      } else {
        set.add(handIndex(cStart, r))
      }
      continue
    }
  }

  return set
}

// PokerCoaching 6-max 100bb solver-based RFI ranges
const RFI_RANGES: Record<string, string> = {
  // UTG (LJ in their notation) ~17.6%
  UTG: '66+,A3s+,K8s+,Q9s+,J9s+,T9s,ATo+,KJo+,QJo',

  // HJ ~21.4%
  HJ: '55+,A2s+,K6s+,Q9s+,J9s+,T9s,98s,87s,76s,ATo+,KTo+,QTo+',

  // CO ~27.8%
  CO: '33+,A2s+,K3s+,Q6s+,J8s+,T7s+,97s+,87s,76s,A8o+,KTo+,QTo+,JTo',

  // BTN ~43.5%
  BTN: '33+,A2s+,K2s+,Q3s+,J4s+,T6s+,96s+,85s+,75s+,64s+,53s+,A4o+,K8o+,Q9o+,J9o+,T8o+,98o',

  // SB ~36% raise-only（不含 limp 混雜）
  SB: '22+,A2s+,K2s+,K9o+,Q8s+,QTo+,J8s+,JTo,T8s+,T9o,98s,97s,87s,76s,65s,A2o+,A9o+',
}

/** 各位置 RFI 手牌索引集合（建構一次） */
const RFI_SETS: Record<string, Set<number>> = {}
for (const [pos, range] of Object.entries(RFI_RANGES)) {
  RFI_SETS[pos] = parseRange(range)
}

/**
 * @param handIdx - 0–168
 * @param position - UTG | HJ | CO | BTN | SB
 */
export function isRFI(handIdx: number, position: string): boolean {
  return RFI_SETS[position]?.has(handIdx) ?? false
}

/**
 * @param position - 位置代碼
 * @returns Raise 佔 169 組合的百分比（一位小數）
 */
export function getRFIPercent(position: string): number {
  return Math.round(((RFI_SETS[position]?.size ?? 0) / 169) * 10) / 10
}

// ─── VS RFI（面對開池）────────────────────────────────────────────

/**
 * Hero 對 Villain 開池的回應類型。
 */
export type VsRFIAction = '3bet' | 'call' | 'fold'

export interface VsRFICell {
  threeBet: Set<number>
  call: Set<number>
}

// VS RFI ranges — based on GTO principles, simplified binary strategy
// Source basis: PokerCoaching implementable GTO + standard solver principles
// Key principles applied:
//   - IP positions (HJ/CO/BTN) play 3bet-or-fold (no cold call) — except noted mixed
//   - OOP positions (SB/BB) can call
//   - Tighter vs earlier position openers
//   - Value 3bets: always AA KK QQ + position-dependent
//   - Bluff 3bets: A5s A4s A3s (blockers + good postflop)
//   - BB defends wider (already has 1bb invested)

const VS_RFI_DEFS: { villain: string; hero: string; threeBet: string; call: string }[] = [
  // HJ vs UTG (~6%)
  { villain: 'UTG', hero: 'HJ', threeBet: 'AA,KK,QQ,AKs,AKo,A5s', call: '' },

  // CO vs UTG (~8%)
  { villain: 'UTG', hero: 'CO', threeBet: 'AA,KK,QQ,JJ,AKs,AQs,AKo,A5s,A4s', call: '' },

  // CO vs HJ (~10%)
  { villain: 'HJ', hero: 'CO', threeBet: 'AA,KK,QQ,JJ,AKs,AQs,AKo,A5s,A4s,A3s', call: '' },

  // BTN vs UTG (~10%)
  {
    villain: 'UTG',
    hero: 'BTN',
    threeBet: 'AA,KK,QQ,JJ,AKs,AQs,AKo,A5s,A4s',
    call: 'TT,99,AJs,ATs,KQs,QJs,JTs,AQo',
  },

  // BTN vs HJ (~13%)
  {
    villain: 'HJ',
    hero: 'BTN',
    threeBet: 'AA,KK,QQ,JJ,TT,AKs,AQs,AKo,AQo,A5s,A4s,A3s',
    call: '99,88,AJs,ATs,KQs,KJs,QJs,JTs,T9s,AJo,KQo',
  },

  // BTN vs CO (~15%)
  {
    villain: 'CO',
    hero: 'BTN',
    threeBet: 'AA,KK,QQ,JJ,TT,AKs,AQs,AJs,AKo,AQo,A5s,A4s,A3s,A2s',
    call: '99,88,77,ATs,A9s,KQs,KJs,KTs,QJs,JTs,T9s,98s,AJo,ATo,KQo,KJo',
  },

  // SB vs UTG (~8%)
  { villain: 'UTG', hero: 'SB', threeBet: 'AA,KK,QQ,AKs,AKo,A5s', call: 'JJ,TT,AQs,KQs' },

  // SB vs HJ (~10%)
  {
    villain: 'HJ',
    hero: 'SB',
    threeBet: 'AA,KK,QQ,JJ,AKs,AQs,AKo,A5s,A4s',
    call: 'TT,99,AJs,ATs,KQs,KJs,JTs,AQo',
  },

  // SB vs CO (~12%)
  {
    villain: 'CO',
    hero: 'SB',
    threeBet: 'AA,KK,QQ,JJ,TT,AKs,AQs,AKo,AQo,A5s,A4s,A3s',
    call: '99,88,AJs,ATs,KQs,KJs,QJs,JTs,T9s,AJo,KQo',
  },

  // SB vs BTN (~14%)
  {
    villain: 'BTN',
    hero: 'SB',
    threeBet: 'AA,KK,QQ,JJ,TT,AKs,AQs,AJs,AKo,AQo,A5s,A4s,A3s,A2s',
    call: '99,88,77,ATs,A9s,KQs,KJs,KTs,QJs,JTs,T9s,AJo,KQo',
  },

  // BB vs UTG
  {
    villain: 'UTG',
    hero: 'BB',
    threeBet: 'AA,KK,QQ,AKs,AKo,A5s,A4s',
    call: 'JJ,TT,99,88,77,66,55,44,33,22,AQs,AJs,ATs,A9s,A8s,A7s,A6s,A3s,A2s,KQs,KJs,KTs,K9s,QJs,QTs,JTs,J9s,T9s,T8s,98s,87s,76s,65s,54s,AQo,AJo,KQo',
  },

  // BB vs HJ
  {
    villain: 'HJ',
    hero: 'BB',
    threeBet: 'AA,KK,QQ,JJ,AKs,AQs,AKo,A5s,A4s,A3s',
    call: 'TT,99,88,77,66,55,44,33,22,AJs,ATs,A9s,A8s,A7s,A6s,A2s,KQs,KJs,KTs,K9s,QJs,QTs,JTs,J9s,T9s,T8s,98s,87s,76s,65s,54s,AQo,AJo,ATo,KQo,KJo',
  },

  // BB vs CO
  {
    villain: 'CO',
    hero: 'BB',
    threeBet: 'AA,KK,QQ,JJ,TT,AKs,AQs,AJs,AKo,AQo,A5s,A4s,A3s,A2s',
    call: '99,88,77,66,55,44,33,22,ATs,A9s,A8s,A7s,A6s,KQs,KJs,KTs,K9s,K8s,QJs,QTs,Q9s,JTs,J9s,J8s,T9s,T8s,98s,97s,87s,86s,76s,75s,65s,54s,AJo,ATo,A9o,KQo,KJo,QJo',
  },

  // BB vs BTN
  {
    villain: 'BTN',
    hero: 'BB',
    threeBet: 'AA,KK,QQ,JJ,TT,99,AKs,AQs,AJs,ATs,AKo,AQo,AJo,A5s,A4s,A3s,A2s,K9s,Q9s,J9s,T8s,98s,87s',
    call: '88,77,66,55,44,33,22,A9s,A8s,A7s,A6s,KQs,KJs,KTs,K8s,K7s,K6s,QJs,QTs,Q8s,JTs,J8s,T9s,T7s,97s,86s,76s,75s,65s,64s,54s,ATo,A9o,A8o,KQo,KJo,KTo,QJo,JTo',
  },

  // BB vs SB
  {
    villain: 'SB',
    hero: 'BB',
    threeBet: 'AA,KK,QQ,JJ,TT,99,AKs,AQs,AJs,ATs,AKo,AQo,AJo,ATo,A5s,A4s,A3s,K9s,Q9s,J9s',
    call: '88,77,66,55,44,33,22,A9s,A8s,A7s,A6s,A2s,KQs,KJs,KTs,K8s,K7s,QJs,QTs,Q8s,JTs,J9s,T9s,T8s,98s,87s,76s,65s,54s,A9o,A8o,A7o,KQo,KJo,QJo',
  },
]

/**
 * villain → hero → { threeBet, call }（其餘為 fold）
 */
export const VS_RFI_SETS: Record<string, Record<string, VsRFICell>> = {}

for (const row of VS_RFI_DEFS) {
  if (!VS_RFI_SETS[row.villain]) VS_RFI_SETS[row.villain] = {}
  VS_RFI_SETS[row.villain]![row.hero] = {
    threeBet: parseRange(row.threeBet),
    call: parseRange(row.call),
  }
}

/**
 * @param handIdx - 0–168
 * @param heroPos - HJ | CO | BTN | SB | BB
 * @param villainPos - UTG | HJ | CO | BTN | SB
 */
export function getVsRFIAction(
  handIdx: number,
  heroPos: string,
  villainPos: string,
): VsRFIAction {
  const cell = VS_RFI_SETS[villainPos]?.[heroPos]
  if (!cell) return 'fold'
  if (cell.threeBet.has(handIdx)) return '3bet'
  if (cell.call.has(handIdx)) return 'call'
  return 'fold'
}

/**
 * @param villainPos - 開池位置
 * @returns 與該開池可組合的 Hero 位置列表
 */
export function getValidHeroesForVillain(villain: string): string[] {
  return Object.keys(VS_RFI_SETS[villain] ?? {})
}

// ─── VS 3BET（開牌方面對 3-bet）──────────────────────────────────

export type Vs3betAction = '4bet' | 'call' | 'fold'

const VS_3BET_RANGES: Record<string, { fourbet: string; call: string }> = {
  UTG: {
    fourbet: 'AA,KK,AKs,AKo,A5s,A4s',
    call: '',
  },
  HJ: {
    fourbet: 'AA,KK,AKs,AKo,A5s,A4s',
    call: 'QQ,JJ,AQs',
  },
  CO: {
    fourbet: 'AA,KK,AKs,AKo,A5s,A4s,A3s',
    call: 'QQ,JJ,TT,AQs,AJs',
  },
  BTN: {
    fourbet: 'AA,KK,QQ,AKs,AKo,A5s,A4s,A3s',
    call: 'JJ,TT,99,AQs,AJs,KQs',
  },
  SB: {
    fourbet: 'AA,KK,AKs,AKo,A5s,A4s',
    call: '',
  },
}

/** 開牌位置 → { fourbet, call }（其餘為 fold） */
export const VS_3BET_SETS: Record<string, { fourbet: Set<number>; call: Set<number> }> = {}
for (const [pos, v] of Object.entries(VS_3BET_RANGES)) {
  VS_3BET_SETS[pos] = { fourbet: parseRange(v.fourbet), call: parseRange(v.call) }
}

/**
 * @param handIdx - 0–168
 * @param openerPos - UTG | HJ | CO | BTN | SB
 */
export function getVs3betAction(handIdx: number, openerPos: string): Vs3betAction {
  const cell = VS_3BET_SETS[openerPos]
  if (!cell) return 'fold'
  if (cell.fourbet.has(handIdx)) return '4bet'
  if (cell.call.has(handIdx)) return 'call'
  return 'fold'
}

/**
 * @param openerPos - 開牌位置
 * @returns 4-Bet 佔 169 組合的百分比（一位小數）
 */
export function getVs3betFourbetPercent(openerPos: string): number {
  const n = VS_3BET_SETS[openerPos]?.fourbet.size ?? 0
  return Math.round((n / 169) * 10) / 10
}

/** 該開牌位置是否有 call 範圍（用於停用 Call 按鈕） */
export function openerHasVs3betCallRange(openerPos: string): boolean {
  return (VS_3BET_SETS[openerPos]?.call.size ?? 0) > 0
}

// ─── VS 4BET（3-bettor 面對 4-bet / 5-bet shove 簡化）─────────────

export type Vs4betAction = 'call' | 'fold'

const VS_4BET_CALL_SET = parseRange('AA,KK,AKs,AKo')

/**
 * @param handIdx - 0–168
 */
export function getVs4betAction(handIdx: number): Vs4betAction {
  return VS_4BET_CALL_SET.has(handIdx) ? 'call' : 'fold'
}

/**
 * @returns Call 佔 169 組合的百分比（一位小數）
 */
export function getVs4betCallPercent(): number {
  return Math.round((VS_4BET_CALL_SET.size / 169) * 10) / 10
}

// ─── Push / Fold Nash（HU SB vs BB，6-max 位置係數）────────────────

const NASH_PUSH_THRESHOLDS_NO_ANTE: string[][] = [
  ['20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+'],
  ['20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '19.9', '19.3'],
  ['20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '16.3', '13.5', '12.7'],
  ['20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '18.6', '14.7', '13.5', '10.6', '8.5'],
  ['20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '11.9', '10.5', '7.7', '6.5'],
  ['20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '14.4', '6.9', '4.9', '3.7'],
  ['20+', '18.0', '13.0', '13.3', '17.5', '20+', '20+', '20+', '20+', '18.8', '10.1', '2.7', '2.5'],
  ['20+', '16.1', '10.3', '8.5', '9.0', '10.8', '14.7', '20+', '20+', '20+', '13.9', '2.5', '2.1'],
  ['20+', '15.1', '9.6', '6.5', '5.7', '5.2', '7.0', '10.7', '20+', '20+', '16.3', '0', '2.0'],
  ['20+', '14.2', '8.9', '6.0', '4.1', '3.5', '3.0', '2.6', '2.4', '20+', '20+', '0', '2.0'],
  ['20+', '13.1', '7.9', '5.4', '3.8', '2.7', '2.3', '2.1', '2.0', '2.1', '20+', '0', '1.8'],
  ['20+', '12.2', '7.5', '5.0', '3.4', '2.5', '1.9', '1.8', '1.7', '1.8', '1.6', '20+', '1.7'],
  ['20+', '11.6', '7.0', '4.6', '2.9', '2.2', '1.8', '1.6', '1.5', '1.5', '1.4', '1.4', '20+'],
]

const NASH_CALL_THRESHOLDS_NO_ANTE: string[][] = [
  ['20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+', '20+'],
  ['20+', '20+', '20+', '20+', '20+', '20+', '17.6', '15.2', '14.3', '13.2', '12.1', '11.4', '10.7'],
  ['20+', '20+', '20+', '20+', '20+', '16.1', '13.0', '10.5', '9.9', '8.9', '8.4', '7.8', '7.2'],
  ['20+', '20+', '19.5', '20+', '18.0', '13.4', '10.6', '8.8', '7.0', '6.9', '6.1', '5.8', '5.6'],
  ['20+', '20+', '15.3', '12.7', '20+', '11.5', '9.3', '7.4', '6.3', '5.2', '5.2', '4.8', '4.5'],
  ['20+', '17.1', '11.7', '9.5', '8.4', '20+', '8.2', '7.0', '5.8', '5.0', '4.3', '4.1', '3.9'],
  ['20+', '13.8', '9.7', '7.6', '6.6', '6.0', '20+', '6.5', '5.6', '4.8', '4.1', '3.6', '3.5'],
  ['20+', '12.4', '8.0', '6.4', '5.5', '5.0', '4.7', '20+', '5.4', '4.8', '4.1', '3.6', '3.3'],
  ['20+', '11.0', '7.3', '5.4', '4.6', '4.2', '4.1', '4.0', '20+', '4.9', '4.3', '3.8', '3.3'],
  ['20+', '10.2', '6.8', '5.1', '4.0', '3.7', '3.6', '3.6', '3.7', '20+', '4.6', '4.0', '3.6'],
  ['18.3', '9.1', '6.2', '4.7', '3.8', '3.3', '3.2', '3.2', '3.3', '3.5', '20+', '3.8', '3.4'],
  ['16.6', '8.7', '5.9', '4.5', '3.6', '3.1', '2.9', '2.9', '2.9', '3.1', '3.0', '20+', '3.3'],
  ['15.8', '8.1', '5.6', '4.2', '3.5', '3.0', '2.8', '2.6', '2.7', '2.8', '2.7', '2.6', '15.0'],
]

function parseNashThreshold(threshStr: string): number {
  if (threshStr === '20+') return 21
  const v = parseFloat(threshStr)
  return Number.isFinite(v) ? v : 0
}

/**
 * Nash HU 直推門檻 × 6-max 位置係數。
 * @param handIdx - 0–168
 * @param bb - 有效籌碼深度（bb）
 * @param position - UTG | HJ | CO | BTN | SB
 */
export function isPush(handIdx: number, bb: number, position: string): boolean {
  const r = Math.floor(handIdx / 13)
  const c = handIdx % 13
  const row = NASH_PUSH_THRESHOLDS_NO_ANTE[r]
  const threshStr = row?.[c]
  if (threshStr === undefined) return false
  const thresh = parseNashThreshold(threshStr)
  if (thresh === 0) return false

  const posMultiplier: Record<string, number> = {
    UTG: 0.55,
    HJ: 0.65,
    CO: 0.75,
    BTN: 0.9,
    SB: 1.0,
  }
  const mult = posMultiplier[position] ?? 1.0
  return bb <= thresh * mult
}

/**
 * BB 跟注 Nash 門檻（圖表／未來 BB 模式用）。
 */
export function isBBCall(handIdx: number, bb: number): boolean {
  const r = Math.floor(handIdx / 13)
  const c = handIdx % 13
  const row = NASH_CALL_THRESHOLDS_NO_ANTE[r]
  const threshStr = row?.[c]
  if (threshStr === undefined) return false
  const thresh = parseNashThreshold(threshStr)
  return bb <= thresh
}

/**
 * @returns 該深度與位置下直推組合佔比（一位小數）
 */
export function getPushPercentForStack(bb: number, position: string): number {
  let n = 0
  for (let i = 0; i < 169; i++) {
    if (isPush(i, bb, position)) n += 1
  }
  return Math.round((n / 169) * 10) / 10
}

// ─── BvB（大小盲）────────────────────────────────────────────────

/**
 * BB 防守 SB 開池（SB 3bb）；call 範圍對齊 GTO Wizard NL500，總防守頻率約 52–54%。
 */
const BVB_BB_VS_SB = {
  threeBet:
    'AA,KK,QQ,JJ,TT,99,AKs,AQs,AJs,ATs,AKo,AQo,AJo,A5s,A4s,A3s,A2s,K9s,Q9s,J9s,T8s,98s,87s',
  call: '88,77,66,55,44,33,22,A9s,A8s,A7s,A6s,KQs,KJs,KTs,K8s,K7s,K6s,K5s,QJs,QTs,Q8s,JTs,J8s,T9s,T7s,97s,86s,76s,75s,65s,64s,54s,A9o,A8o,A7o,KQo,KJo,QJo',
}

/** SB 面對 BB 3-bet */
const BVB_SB_VS_BB_3BET = {
  fourbet: 'AA,KK,QQ,AKs,AKo,A5s,A4s',
  call: 'JJ,AQs',
}

/** BB vs SB：3-bet / call 集合 */
export const BVB_BB_SETS = {
  threeBet: parseRange(BVB_BB_VS_SB.threeBet),
  call: parseRange(BVB_BB_VS_SB.call),
}

/** SB vs BB 3-bet：4-bet / call 集合 */
export const BVB_SB_SETS = {
  fourbet: parseRange(BVB_SB_VS_BB_3BET.fourbet),
  call: parseRange(BVB_SB_VS_BB_3BET.call),
}

export type BvBBBAction = '3bet' | 'call' | 'fold'
export type BvBSBVs3betAction = '4bet' | 'call' | 'fold'

/**
 * @param handIdx - 0–168
 */
export function getBvBBBAction(handIdx: number): BvBBBAction {
  if (BVB_BB_SETS.threeBet.has(handIdx)) return '3bet'
  if (BVB_BB_SETS.call.has(handIdx)) return 'call'
  return 'fold'
}

/**
 * @param handIdx - 0–168
 */
export function getBvBSBVs3betAction(handIdx: number): BvBSBVs3betAction {
  if (BVB_SB_SETS.fourbet.has(handIdx)) return '4bet'
  if (BVB_SB_SETS.call.has(handIdx)) return 'call'
  return 'fold'
}

/**
 * @returns BB 跟注範圍佔 169 組合的百分比（一位小數）
 */
export function getBvBBBCallPercent(): number {
  return Math.round((BVB_BB_SETS.call.size / 169) * 10) / 10
}

/**
 * @returns BB 防守總頻率（3-bet + call，非棄牌）佔 169 組合的百分比（一位小數）
 */
export function getBvBBBDefendPercent(): number {
  const n = BVB_BB_SETS.threeBet.size + BVB_BB_SETS.call.size
  return Math.round((n / 169) * 10) / 10
}

/**
 * @returns SB 4-bet 佔比（一位小數）
 */
export function getBvBSBFourbetPercent(): number {
  return Math.round((BVB_SB_SETS.fourbet.size / 169) * 10) / 10
}

// ─── Cold 4-Bet（面對開池 + 3bet，Hero 最後行動）────────────────────
// Source: GTO Wizard "Should You Ever Cold Call a 3-Bet?" (100bb cash)

const COLD_4BET_RANGES: Record<string, { fourbet: string; call: string }> = {
  BTN: {
    fourbet: 'AA,KK,QQ,AKs,AKo',
    call: 'JJ,TT,AQs,KQs,QJs,JTs',
  },
  CO: {
    fourbet: 'AA,KK,AKs,AKo',
    call: 'QQ,JJ,AQs',
  },
  HJ: {
    fourbet: 'AA,KK,AKs,AKo',
    call: '',
  },
  BB: {
    fourbet: 'AA,KK,QQ,AKs,AKo,A5s',
    call: 'JJ,TT,AQs,KQs,JTs',
  },
  SB: {
    fourbet: 'AA,KK,AKs,AKo',
    call: '',
  },
}

/** Cold 4bet / cold call 索引集合 */
export const COLD_4BET_SETS: Record<string, { fourbet: Set<number>; call: Set<number> }> = {}
for (const [pos, v] of Object.entries(COLD_4BET_RANGES)) {
  COLD_4BET_SETS[pos] = {
    fourbet: parseRange(v.fourbet),
    call: v.call.trim() ? parseRange(v.call) : new Set<number>(),
  }
}

export type Cold4betAction = '4bet' | 'call' | 'fold'

/**
 * @param handIdx - 0–168
 * @param heroPos - HJ | CO | BTN | SB | BB
 */
export function getCold4betAction(handIdx: number, heroPos: string): Cold4betAction {
  const cell = COLD_4BET_SETS[heroPos]
  if (!cell) return 'fold'
  if (cell.fourbet.has(handIdx)) return '4bet'
  if (cell.call.has(handIdx)) return 'call'
  return 'fold'
}

/**
 * @param heroPos - 位置代碼
 */
export function hasCold4betCallRange(heroPos: string): boolean {
  return (COLD_4BET_SETS[heroPos]?.call.size ?? 0) > 0
}

/**
 * 除錯用：主控台表格檢查 RFI / BvB 集合大小。
 */
export function debugRangeSize(): void {
  console.table({
    'RFI UTG': RFI_SETS['UTG']?.size,
    'RFI HJ': RFI_SETS['HJ']?.size,
    'RFI CO': RFI_SETS['CO']?.size,
    'RFI BTN': RFI_SETS['BTN']?.size,
    'RFI SB': RFI_SETS['SB']?.size,
    'BvB 3bet': BVB_BB_SETS.threeBet.size,
    'BvB call': BVB_BB_SETS.call.size,
  })
}
