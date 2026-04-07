/**
 * 解析 GGPoker / PokerStars 匯出的 .txt 手牌歷史。
 */

export interface ParsedHand {
  id: string
  site: 'GGPoker' | 'PokerStars' | 'Unknown'
  stakes: string
  heroCards: string
  heroPosition: string
  numPlayers: number
  preflopActions: string[]
  flopBoard?: string
  heroFlopAction?: string
  turnCard?: string
  heroTurnAction?: string
  riverCard?: string
  heroRiverAction?: string
  result: number
  rawText: string
  /** 內部：供統計用 */
  _meta?: HandMetaFlags
}

export interface HandMetaFlags {
  vpip: boolean
  pfr: boolean
  threeBet: boolean
  sawFlop: boolean
  foldToCbet: boolean
  /** 翻牌面對過對手下注後輪到 Hero 決策 */
  flopFacingCbet: boolean
  cbetOpp: boolean
  heroCbet: boolean
  wtsd: boolean
  wsd: boolean
}

export interface HandHistoryStats {
  totalHands: number
  site: string
  stakes: string
  vpip: number
  pfr: number
  threebet: number
  foldToCbet: number
  cbet: number
  wtsd: number
  wsd: number
  avgResult: number
  positionStats: Record<string, { hands: number; vpip: number; pfr: number }>
}

const SIXMAX_FROM_BTN = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'] as const

/**
 * @param text - 檔案開頭片段
 * @returns 辨識到的平台
 */
export function detectSite(text: string): 'GGPoker' | 'PokerStars' | 'Unknown' {
  const head = text.slice(0, 4000)
  if (/PokerStars Hand #/i.test(head)) return 'PokerStars'
  if (/Poker Hand #/i.test(head)) return 'GGPoker'
  return 'Unknown'
}

/**
 * @param text - 完整檔案內容
 * @returns 各手牌的原始文字區塊
 */
export function splitHands(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []
  const re = /(?=^(?:PokerStars Hand #|Poker Hand #))/gm
  return normalized.split(re).map((s) => s.trim()).filter(Boolean)
}

/**
 * @param stakes - 如 `$0.01/$0.02`
 * @returns 大盲美元金額（無法解析則 1）
 */
function bigBlindUsd(stakes: string): number {
  const m = stakes.match(/\/\$([\d.]+)/)
  if (!m) return 1
  const v = parseFloat(m[1]!)
  return Number.isFinite(v) && v > 0 ? v : 1
}

/**
 * @param handText - 單手文字
 * @param site - 平台
 * @returns 結構化手牌；失敗則 null
 */
export function parseSingleHand(
  handText: string,
  site: 'GGPoker' | 'PokerStars' | 'Unknown',
): ParsedHand | null {
  const lines = handText.split('\n').map((l) => l.trim())
  const first = lines[0] ?? ''
  const idMatch = first.match(/#(\d+)/)
  const id = idMatch ? idMatch[1]! : `h-${Math.random().toString(36).slice(2, 9)}`

  const stakesMatch = handText.match(/\(\$[\d.]+\/\$[\d.]+/i)
  const stakes = stakesMatch ? stakesMatch[0].replace(/^\(/, '') : 'unknown'

  const dealt = handText.match(/Dealt to ([^\s]+)\s+\[([^\]]+)\]/i)
  if (!dealt) return null
  const heroName = dealt[1]!
  const heroCards = dealt[2]!.replace(/\s+/g, ' ').trim()

  const seatRe = /^Seat (\d+): (.+?) \(\$/gim
  const seats: { num: number; name: string }[] = []
  let sm: RegExpExecArray | null
  while ((sm = seatRe.exec(handText)) !== null) {
    seats.push({ num: parseInt(sm[1]!, 10), name: sm[2]!.trim() })
  }
  const numPlayers = seats.length
  if (numPlayers < 2) return null

  const btnMatch = handText.match(/Seat #(\d+) is the button/i)
  const btnSeat = btnMatch ? parseInt(btnMatch[1]!, 10) : seats[0]!.num

  const heroSeat = seats.find((s) => s.name === heroName)?.num
  const heroPosition =
    heroSeat !== undefined
      ? detectHeroPositionFromSeats(
          seats.map((s) => s.num),
          btnSeat,
          heroSeat,
          numPlayers,
        )
      : 'Unknown'

  const holeIdx = handText.indexOf('*** HOLE CARDS ***')
  const flopIdx = handText.indexOf('*** FLOP ***')
  const turnIdx = handText.indexOf('*** TURN ***')
  const riverIdx = handText.indexOf('*** RIVER ***')
  const summaryIdx = handText.indexOf('*** SUMMARY ***')

  const preflopEnd =
    flopIdx >= 0 ? flopIdx : turnIdx >= 0 ? turnIdx : riverIdx >= 0 ? riverIdx : summaryIdx
  const preflopBlock =
    preflopEnd > 0 && holeIdx >= 0
      ? handText.slice(holeIdx, preflopEnd)
      : handText.slice(0, preflopEnd > 0 ? preflopEnd : undefined)

  const preflopActions = extractHeroStreetLines(preflopBlock, heroName)

  const flopBoard = parseBoardStreet(handText, '*** FLOP ***')
  const turnCard = parseSingleBoardCard(handText, '*** TURN ***')
  const riverCard = parseSingleBoardCard(handText, '*** RIVER ***')

  const flopBlock =
    flopIdx >= 0
      ? handText.slice(flopIdx, turnIdx >= 0 ? turnIdx : riverIdx >= 0 ? riverIdx : summaryIdx)
      : ''
  const heroFlopAction = flopBlock ? extractHeroFirstAction(flopBlock, heroName) : undefined

  const turnBlock =
    turnIdx >= 0 ? handText.slice(turnIdx, riverIdx >= 0 ? riverIdx : summaryIdx) : ''
  const heroTurnAction = turnBlock ? extractHeroFirstAction(turnBlock, heroName) : undefined

  const riverBlock = riverIdx >= 0 ? handText.slice(riverIdx, summaryIdx) : ''
  const heroRiverAction = riverBlock ? extractHeroFirstAction(riverBlock, heroName) : undefined

  const bb = bigBlindUsd(stakes)
  const result = parseHeroResultBb(handText, heroName, bb)

  const _meta = buildMetaFlags(
    handText,
    heroName,
    preflopActions,
    flopBoard,
    heroFlopAction,
    summaryIdx,
  )

  return {
    id,
    site,
    stakes,
    heroCards,
    heroPosition,
    numPlayers,
    preflopActions,
    flopBoard,
    heroFlopAction,
    turnCard,
    heroTurnAction,
    riverCard,
    heroRiverAction,
    result,
    rawText: handText,
    _meta,
  }
}

/**
 * @param occupied - 有玩家的 seat 編號
 * @param btnSeat - button seat
 * @param heroSeat - hero seat
 * @param n - 人數
 * @returns 位置標籤
 */
/**
 * @param handText - 單手全文
 * @param numPlayers - 桌上人數（用於位置標籤對應）
 */
export function detectHeroPosition(handText: string, numPlayers: number): string {
  const seatRe = /^Seat (\d+): (.+?) \(\$/gim
  const seats: { num: number; name: string }[] = []
  let sm: RegExpExecArray | null
  while ((sm = seatRe.exec(handText)) !== null) {
    seats.push({ num: parseInt(sm[1]!, 10), name: sm[2]!.trim() })
  }
  const dealt = handText.match(/Dealt to ([^\s]+)\s+\[/i)
  const heroName = dealt?.[1]
  const btnMatch = handText.match(/Seat #(\d+) is the button/i)
  const btnSeat = btnMatch ? parseInt(btnMatch[1]!, 10) : seats[0]?.num ?? 1
  const heroSeat = heroName ? seats.find((s) => s.name === heroName)?.num : undefined
  if (heroSeat === undefined) return 'Unknown'
  const n = Math.min(Math.max(2, numPlayers), seats.length || numPlayers)
  return detectHeroPositionFromSeats(
    seats.map((s) => s.num),
    btnSeat,
    heroSeat,
    n,
  )
}

/**
 * @param seatNums - 佔位 seat 列表
 * @param btnSeat - button
 * @param heroSeat - hero
 * @param n - 玩家數
 */
function detectHeroPositionFromSeats(
  seatNums: number[],
  btnSeat: number,
  heroSeat: number,
  n: number,
): string {
  const sorted = [...new Set(seatNums)].sort((a, b) => a - b)
  const btnIdx = sorted.indexOf(btnSeat)
  if (btnIdx < 0) return 'Unknown'
  const fromBtn = [...sorted.slice(btnIdx), ...sorted.slice(0, btnIdx)]
  const heroIdx = fromBtn.indexOf(heroSeat)
  if (heroIdx < 0) return 'Unknown'

  const labels = positionLabelsForTableSize(n)
  return labels[heroIdx] ?? `P${heroIdx}`
}

/**
 * @param n - 桌上人數
 * @returns 由 BTN 順時針的角色名稱
 */
function positionLabelsForTableSize(n: number): readonly string[] {
  if (n <= 1) return ['BTN']
  if (n === 2) return ['BTN', 'BB']
  if (n === 3) return ['BTN', 'SB', 'BB']
  if (n === 4) return ['BTN', 'SB', 'BB', 'UTG']
  if (n === 5) return ['BTN', 'SB', 'BB', 'UTG', 'CO']
  return SIXMAX_FROM_BTN
}

/**
 * @param block - 單一街文字
 * @param heroName - Hero 暱稱
 */
function extractHeroStreetLines(block: string, heroName: string): string[] {
  const out: string[] = []
  const prefix = new RegExp(`^${escapeRe(heroName)}:\\s*`, 'im')
  for (const line of block.split('\n')) {
    const t = line.trim()
    if (prefix.test(t)) out.push(t)
  }
  return out
}

/**
 * @param block - 街區內容
 * @param heroName - Hero 名稱
 */
function extractHeroFirstAction(block: string, heroName: string): string | undefined {
  const lines = extractHeroStreetLines(block, heroName)
  return lines[0]
}

/**
 * @param hand - 全文
 * @param marker - 街標記
 */
function parseBoardStreet(hand: string, marker: string): string | undefined {
  const idx = hand.indexOf(marker)
  if (idx < 0) return undefined
  const lineEnd = hand.indexOf('\n', idx)
  const line = lineEnd > 0 ? hand.slice(idx, lineEnd) : hand.slice(idx)
  const br = line.match(/\[([^\]]+)\]/)
  return br ? br[1]!.trim() : undefined
}

/**
 * @param hand - 全文
 * @param marker - TURN / RIVER
 */
function parseSingleBoardCard(hand: string, marker: string): string | undefined {
  const board = parseBoardStreet(hand, marker)
  if (!board) return undefined
  const parts = board.trim().split(/\s+/)
  return parts[parts.length - 1]
}

/**
 * @param s - 字串
 */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * @param handText - 全文
 * @param heroName - hero
 * @param bbUsd - 大盲美元
 * @returns 約略淨結果（bb）
 */
function parseHeroResultBb(handText: string, heroName: string, bbUsd: number): number {
  const summary = handText.includes('*** SUMMARY ***')
    ? handText.slice(handText.indexOf('*** SUMMARY ***'))
    : handText

  let netUsd = 0
  const collectedRe = new RegExp(
    `${escapeRe(heroName)} collected \\((\\$[\\d.]+)\\)`,
    'gi',
  )
  let cm: RegExpExecArray | null
  while ((cm = collectedRe.exec(summary)) !== null) {
    netUsd += parseMoney(cm[1]!)
  }

  const betLines = handText.match(new RegExp(`^${escapeRe(heroName)}:.+$`, 'gim')) ?? []
  for (const line of betLines) {
    const m = line.match(/\$(\d+\.?\d*)/g)
    if (!m) continue
    for (const x of m) {
      const v = parseFloat(x.replace('$', ''))
      if (line.toLowerCase().includes('posts')) continue
      if (/\b(raises?|bets?|calls?)\b/i.test(line)) {
        netUsd -= v
      }
    }
  }

  return Math.round((netUsd / bbUsd) * 100) / 100
}

/**
 * @param s - `$0.05`
 */
function parseMoney(s: string): number {
  const m = s.match(/[\d.]+/)
  return m ? parseFloat(m[0]!) : 0
}

/**
 * @param handText - 全文
 * @param heroName - hero
 * @param preflopActions - 翻前 hero 行
 * @param flopBoard - flop
 * @param heroFlopAction - hero flop 行
 * @param summaryIdx - SUMMARY 位置
 */
function buildMetaFlags(
  handText: string,
  heroName: string,
  preflopActions: string[],
  flopBoard: string | undefined,
  heroFlopAction: string | undefined,
  summaryIdx: number,
): HandMetaFlags {
  const preflopJoined = preflopActions.join(' ').toLowerCase()
  /** 自願投入底池（不含僅 post blind 後棄牌） */
  const vpip = /(calls|raises|bets)/i.test(preflopJoined) || /\blimps\b/i.test(preflopJoined)
  /** 翻前有加注行（含 3-bet） */
  const pfr = preflopActions.some((l) =>
    new RegExp(`^${escapeRe(heroName)}:\\s*raises\\b`, 'i').test(l.trim()),
  )

  let raisesBeforeHero = 0
  const holeIdx = handText.indexOf('*** HOLE CARDS ***')
  const flopIdx = handText.indexOf('*** FLOP ***')
  const preEnd =
    flopIdx > 0 ? flopIdx : handText.indexOf('*** SUMMARY ***')
  const pre = handText.slice(holeIdx >= 0 ? holeIdx : 0, preEnd > 0 ? preEnd : handText.length)
  for (const line of pre.split('\n')) {
    const t = line.trim()
    if (/^Dealt to /i.test(t)) continue
    if (new RegExp(`^${escapeRe(heroName)}:`, 'i').test(t)) break
    if (/:\s*raises\b/i.test(t)) raisesBeforeHero += 1
  }
  const threeBetReal = pfr && raisesBeforeHero >= 1

  const sawFlop = Boolean(flopBoard)
  const summary = summaryIdx >= 0 ? handText.slice(summaryIdx) : ''
  const heroInShowdown = new RegExp(escapeRe(heroName), 'i').test(summary)
  const wtsd =
    heroInShowdown && /(showed|mucked|\[)/i.test(summary) && !/folded before flop/i.test(summary)

  let wsd = false
  if (wtsd) {
    wsd = new RegExp(`${escapeRe(heroName)}[^\\n]*?(won|collected)`, 'i').test(summary)
  }

  let foldToCbet = false
  let flopFacingCbet = false
  let cbetOpp = false
  let heroCbet = false

  if (flopBoard && flopIdx >= 0) {
    const flopEnd = handText.indexOf('*** TURN ***', flopIdx)
    const flopPart = handText.slice(flopIdx, flopEnd > 0 ? flopEnd : handText.length)
    const flopLines = flopPart.split('\n').map((l) => l.trim())
    let facingBet = false
    for (const line of flopLines) {
      if (line.startsWith('***')) continue
      const hm = line.match(/^([^:]+):\s*(.+)$/i)
      if (!hm) continue
      const actor = hm[1]!.trim()
      const act = hm[2]!.toLowerCase()
      if (actor === heroName) {
        if (facingBet) {
          flopFacingCbet = true
          if (act.includes('fold')) foldToCbet = true
        }
        if (/bet|raise/.test(act)) heroCbet = true
        if (!facingBet && /bet|raise/.test(act)) cbetOpp = true
        continue
      }
      if (/bet|raise/.test(act)) facingBet = true
    }
    if (sawFlop && !heroFlopAction && /checks/i.test(flopPart)) cbetOpp = true
  }

  return {
    vpip,
    pfr,
    threeBet: threeBetReal,
    sawFlop,
    foldToCbet,
    flopFacingCbet,
    cbetOpp,
    heroCbet,
    wtsd,
    wsd,
  }
}

/**
 * @param hands - 已解析手牌
 * @returns 聚合統計
 */
export function calculateStats(hands: ParsedHand[]): HandHistoryStats {
  if (hands.length === 0) {
    return {
      totalHands: 0,
      site: '—',
      stakes: '—',
      vpip: 0,
      pfr: 0,
      threebet: 0,
      foldToCbet: 0,
      cbet: 0,
      wtsd: 0,
      wsd: 0,
      avgResult: 0,
      positionStats: {},
    }
  }

  const siteCounts: Record<string, number> = {}
  const stakesCounts: Record<string, number> = {}
  let vpipN = 0
  let pfrN = 0
  let tbN = 0
  let fcbN = 0
  let fcbDenom = 0
  let cbN = 0
  let cbDenom = 0
  let wtsdN = 0
  let wsdN = 0
  let wsdDenom = 0
  let sumBb = 0

  const posAgg: Record<string, { hands: number; vpip: number; pfr: number }> = {}

  for (const h of hands) {
    siteCounts[h.site] = (siteCounts[h.site] ?? 0) + 1
    stakesCounts[h.stakes] = (stakesCounts[h.stakes] ?? 0) + 1
    sumBb += h.result

    const m = h._meta
    if (m) {
      if (m.vpip) vpipN += 1
      if (m.pfr) pfrN += 1
      if (m.threeBet) tbN += 1
      if (m.flopFacingCbet) {
        fcbDenom += 1
        if (m.foldToCbet) fcbN += 1
      }
      if (m.cbetOpp) {
        cbDenom += 1
        if (m.heroCbet) cbN += 1
      }
      if (m.wtsd) {
        wtsdN += 1
        wsdDenom += 1
        if (m.wsd) wsdN += 1
      }
    }

    const pos = h.heroPosition
    if (!posAgg[pos]) posAgg[pos] = { hands: 0, vpip: 0, pfr: 0 }
    posAgg[pos].hands += 1
    if (m?.vpip) posAgg[pos].vpip += 1
    if (m?.pfr) posAgg[pos].pfr += 1
  }

  const n = hands.length
  const topSite = Object.entries(siteCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const topStakes = Object.entries(stakesCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const positionStats: Record<string, { hands: number; vpip: number; pfr: number }> = {}
  for (const [k, v] of Object.entries(posAgg)) {
    positionStats[k] = {
      hands: v.hands,
      vpip: v.hands ? Math.round((v.vpip / v.hands) * 1000) / 10 : 0,
      pfr: v.hands ? Math.round((v.pfr / v.hands) * 1000) / 10 : 0,
    }
  }

  return {
    totalHands: n,
    site: topSite,
    stakes: topStakes,
    vpip: Math.round((vpipN / n) * 1000) / 10,
    pfr: Math.round((pfrN / n) * 1000) / 10,
    threebet: Math.round((tbN / n) * 1000) / 10,
    foldToCbet: fcbDenom ? Math.round((fcbN / fcbDenom) * 1000) / 10 : 0,
    cbet: cbDenom ? Math.round((cbN / cbDenom) * 1000) / 10 : 0,
    wtsd: Math.round((wtsdN / n) * 1000) / 10,
    wsd: wsdDenom ? Math.round((wsdN / wsdDenom) * 1000) / 10 : 0,
    avgResult: Math.round((sumBb / n) * 100) / 100,
    positionStats,
  }
}

/**
 * @param text - 完整檔案
 * @returns 手牌陣列與統計
 */
export function parseHandHistory(text: string): {
  hands: ParsedHand[]
  stats: HandHistoryStats
} {
  const site = detectSite(text)
  const chunks = splitHands(text)
  const hands: ParsedHand[] = []
  for (const chunk of chunks) {
    const h = parseSingleHand(chunk, site)
    if (h) hands.push(h)
  }
  const stats = calculateStats(hands)
  return { hands, stats }
}
