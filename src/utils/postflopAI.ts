import type { PostflopQuestion } from '../data/postflopQuestions'
import type { Language } from '../i18n/types'
import type { SuitCode } from './cardCombo'
import {
  aiScenarioPositionByIndex,
  boardTextureTypeLabel,
  buildAiQuestionText,
  claudeExplanationLanguageDirective,
  indexOfAiScenarioPosition,
  postflopAiSourceLabel,
  postflopFallbackCopy,
  SCENARIO_OPTIONS_BY_LANG,
  spotContextForLang,
  turnCardTypeLabel,
} from './postflopLocale'

/**
 * AI 題情境類型：對應不同選項集合與 prompt 原則。
 */
export type AiScenarioType =
  | 'flop-cbet' // IP raiser faces check → bet sizing decision
  | 'bb-defense' // BB faces c-bet → check-raise/call/fold
  | 'turn-barrel' // IP raiser on turn → continue/check
  | 'probe-bet' // OOP after flop checks through → probe/check

/** 各情境允許的標準答案字串（繁中；與 Claude JSON 預設一致）。 */
export const SCENARIO_OPTIONS: Record<AiScenarioType, readonly string[]> =
  SCENARIO_OPTIONS_BY_LANG['zh-TW']

/**
 * 加權情境列（主要抽題來源）；{@link POSITIONS_FOR_AI} 保留舊版相容。
 */
export const AI_SCENARIOS = [
  // Flop c-bet (most common, highest weight)
  { type: 'flop-cbet' as const, position: 'BTN vs BB（單挑，BTN IP）', weight: 3 },
  { type: 'flop-cbet' as const, position: 'CO vs BB（單挑，CO IP）', weight: 2 },
  { type: 'flop-cbet' as const, position: 'UTG vs BB（單挑，UTG OOP）', weight: 2 },
  { type: 'flop-cbet' as const, position: 'SB vs BB（單挑，SB OOP）', weight: 1.5 },
  { type: 'flop-cbet' as const, position: 'BB 3bet pot vs BTN（BB OOP 100bb）', weight: 2 },

  // BB defense
  { type: 'bb-defense' as const, position: 'BB 防守 vs BTN 小注 33%', weight: 2 },
  { type: 'bb-defense' as const, position: 'BB 防守 vs BTN 大注 67%', weight: 1.5 },

  // Turn barrel
  { type: 'turn-barrel' as const, position: 'BTN vs BB（翻牌小注後，轉牌決策）', weight: 2 },
  { type: 'turn-barrel' as const, position: 'BTN vs BB（翻牌大注後，轉牌決策）', weight: 1.5 },

  // Probe bet
  { type: 'probe-bet' as const, position: 'BB vs BTN（翻牌 check through，轉牌 BB 先行動）', weight: 1 },
] as const

export type AiScenarioRow = (typeof AI_SCENARIOS)[number]

/**
 * 轉牌情境用：單張轉牌與質地標籤。
 */
export const TURN_CARDS = [
  { card: 'K♠', type: '高張（對 IP 有利）', favorable: 'ip' },
  { card: '2♣', type: '磚（brick）', favorable: 'neutral' },
  { card: '9♠', type: '連張（危險）', favorable: 'oop' },
  { card: 'T♦', type: '高張中等', favorable: 'ip' },
  { card: '5♥', type: '低磚', favorable: 'neutral' },
  { card: '8♣', type: '連張有 draw', favorable: 'oop' },
] as const

export type TurnCardPick = (typeof TURN_CARDS)[number]

/**
 * AI 題隨機情境（舊版／向後相容；新題請優先使用 {@link AI_SCENARIOS}）。
 * JSON 輸出仍須三選一：小注 25-33%／大注 67-75%／Check（依情境對應見 prompt 說明）。
 */
export const POSITIONS_FOR_AI = [
  'BTN vs BB（單挑，BTN IP）',
  'CO vs BB（單挑，CO IP）',
  'UTG vs BB（單挑，UTG OOP）',
  'SB vs BB（單挑，SB OOP）',
  'BB 3bet pot vs BTN（BB OOP 100bb）',
  '翻牌後 check through，轉牌 probe（BB probe）',
  'BB 防守 vs BTN c-bet（Check-Raise vs Call vs Fold）',
  'BTN vs BB（轉牌 bluff 選擇：bet vs check）',
  '多人底池（CO vs BTN vs BB）',
] as const

export type AiTrainingPosition = (typeof POSITIONS_FOR_AI)[number]

/**
 * 依位置字串回傳 pot、facing（繁中；供舊程式或除錯）。
 */
export function spotContextForPosition(position: string): { pot: string; facing: string } {
  return spotContextForLang(position, 'zh-TW')
}

/** 牌面質地與範例 flop（供 AI 或備用題隨機） */
export const BOARD_TEXTURES = [
  { board: 'A♥7♦2♣', type: '乾燥彩虹 Ace 高', wetness: 'dry' },
  { board: 'K♠8♦3♥', type: '乾燥彩虹 King 高', wetness: 'dry' },
  { board: 'Q♦J♥9♠', type: '連張 Broadway', wetness: 'wet' },
  { board: 'T♥8♥6♦', type: '半濕兩色', wetness: 'semi-wet' },
  { board: '7♠5♦2♥', type: '低牌乾燥', wetness: 'dry' },
  { board: 'A♠K♦Q♥', type: '三張 Broadway', wetness: 'dry' },
  { board: 'J♠T♠9♥', type: '連張有 flush draw', wetness: 'wet' },
  { board: '9♥8♥7♦', type: '連張半濕', wetness: 'semi-wet' },
  { board: 'K♥K♦3♣', type: '對子板 King', wetness: 'dry' },
  { board: 'A♦A♥7♠', type: '對子板 Ace', wetness: 'dry' },
  { board: 'Q♥8♦3♣', type: '乾燥彩虹 Queen 高', wetness: 'dry' },
  { board: 'A♦K♣Q♥', type: '三張 Broadway 彩虹', wetness: 'dry' },
  { board: 'J♠T♠8♥', type: '連張有 flush draw', wetness: 'wet' },
  { board: '6♥5♦4♣', type: '低連張彩虹', wetness: 'wet' },
  { board: 'K♦K♥7♠', type: '對子板 King', wetness: 'dry' },
  { board: 'A♠5♠2♥', type: '兩色乾燥 Ace 高', wetness: 'semi-wet' },
] as const

export type BoardTexture = (typeof BOARD_TEXTURES)[number]

/** Hero 手牌範例（供 AI 或備用題）；marginal 較常出現以加強邊緣決策練習 */
export const HERO_HANDS = [
  { cards: 'A♠K♦', type: 'top pair top kicker', marginal: false },
  { cards: 'K♣Q♣', type: 'second pair', marginal: true },
  { cards: 'J♠T♠', type: 'flush draw + straight draw', marginal: true },
  { cards: '9♦9♥', type: 'overpair', marginal: false },
  { cards: 'A♥5♥', type: 'top pair + backdoor flush', marginal: true },
  { cards: '7♠7♦', type: 'middle set', marginal: false },
  { cards: 'Q♥J♦', type: 'gut-shot straight draw', marginal: true },
  { cards: 'T♣9♣', type: 'open-ended straight draw', marginal: true },
  { cards: '6♠6♥', type: 'bottom set', marginal: false },
  { cards: 'A♣3♣', type: 'top pair weak kicker', marginal: true },
] as const

export type HeroHandPick = (typeof HERO_HANDS)[number]

/** 邊緣手牌加權（相對於非邊緣） */
const HERO_MARGINAL_WEIGHT = 2.5

/** 濕牌面加權：半濕／濕面較常出現 */
const BOARD_WET_WEIGHT = 2.35
const BOARD_SEMI_WEIGHT = 1.85
const BOARD_DRY_WEIGHT = 1

/**
 * 依權重隨機選一筆索引（用於加權抽樣）。
 */
export function weightedPickIndex<T>(items: readonly T[], weightFn: (item: T) => number): number {
  const weights = items.map(weightFn)
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0 || items.length === 0) return 0
  let r = Math.random() * sum
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!
    if (r <= 0) return i
  }
  return items.length - 1
}

/**
 * 抽 flop：提高半濕／濕面比例，邊緣決策較多。
 */
export function pickBoardBiasedTowardWet(): BoardTexture {
  const idx = weightedPickIndex(BOARD_TEXTURES, (b) => {
    if (b.wetness === 'wet') return BOARD_WET_WEIGHT
    if (b.wetness === 'semi-wet') return BOARD_SEMI_WEIGHT
    return BOARD_DRY_WEIGHT
  })
  return BOARD_TEXTURES[idx]!
}

/**
 * 抽 Hero：提高第二對、聽牌、弱踢腳頂對等邊緣牌比例。
 */
export function pickHeroBiasedTowardMarginal(): HeroHandPick {
  const idx = weightedPickIndex(HERO_HANDS, (h) => (h.marginal ? HERO_MARGINAL_WEIGHT : 1))
  return HERO_HANDS[idx]!
}

/**
 * 依 {@link AI_SCENARIOS} 的 weight 加權抽一則情境。
 */
export function pickScenarioBiased(): AiScenarioRow {
  const idx = weightedPickIndex(AI_SCENARIOS, (s) => s.weight)
  return AI_SCENARIOS[idx]!
}

/**
 * 轉牌／probe 時顯示用 board 字串（含轉牌）。
 */
function displayBoardString(board: BoardTexture, turnCard?: TurnCardPick): string {
  return turnCard ? `${board.board} → ${turnCard.card}` : board.board
}

/**
 * boardType 附註轉牌質地（若有），依介面語系。
 *
 * @param lang - 介面語言
 */
function displayBoardType(board: BoardTexture, turnCard: TurnCardPick | undefined, lang: Language): string {
  const bt = boardTextureTypeLabel(board.type, lang)
  if (!turnCard) return bt
  const tt = turnCardTypeLabel(turnCard.type, lang)
  if (lang === 'en') return `${bt} (turn: ${tt})`
  if (lang === 'zh-CN') return `${bt}（转：${tt}）`
  return `${bt}（轉：${tt}）`
}

const PRINCIPLES_FOR_SCENARIO: Record<AiScenarioType, string> = {
  'flop-cbet': `
- Dry boards: higher c-bet frequency, prefer small sizing
- Wet/connected boards: more checks or larger bets (protection)
- Very wet/monotone: check more
- Paired boards: high frequency small c-bet, favors PFR
- OOP raiser (UTG/SB): check more (~40-50%), bet larger when betting
- IP raiser (BTN/CO): c-bet more; sizing follows board wetness
- 3bet pot OOP: larger sizes (50-75%), high freq on Ace-high dry flops`,

  'bb-defense': `
- Check-Raise: needs strong hand (two pair+, set, strong draw) on BB-favorable boards (low connected)
- Check-Raise on high card boards (A/K high): very rare, mostly Call
- Call: medium strength hands, bluff catchers, draws with pot odds
- Fold: weak hands facing large bets, no draws on unfavorable boards
- Low connected boards (753, 654): BB has range advantage → more check-raises
- High card boards (AKQ, KJ7): BTN has range advantage → mostly call or fold`,

  'turn-barrel': `
- Favorable turn card (high card that improves PFR range): barrel large
- Brick turn after small flop cbet: most common action is CHECK (GTO Wizard verified)
- Completed draw turn (flush/straight): CHECK or very small bet only
- After large flop cbet: polarized barrel (large) or check
- Medium pair on turn: small bet for thin value/protection`,

  'probe-bet': `
- After IP checks flop (no c-bet): OOP gains range advantage
- Probe with: pair, draw, blockers to IP's strong hands
- Probe sizing: 50-67% pot (not too small, not too large)
- Check when: no pair, no draw, no blockers (pure air)
- Favorable turn cards for BB (low cards, pairs): more probing`,
}

/**
 * 依 {@link AiScenarioRow} 組 Claude 提示詞（選項字串、牌面含轉牌、GTO 原則）。
 *
 * @param scenario 加權抽中的情境列
 * @param board flop 質地
 * @param hand Hero 手牌
 * @param turnCard 轉牌／probe 時可選，用於敘述 `flop → turn`
 * @param lang - 介面語言（選項與 explanation 語言須一致）
 */
function buildPrompt(
  scenario: AiScenarioRow,
  board: BoardTexture,
  hand: HeroHandPick,
  turnCard: TurnCardPick | undefined,
  lang: Language,
): string {
  const options = SCENARIO_OPTIONS_BY_LANG[lang][scenario.type]
  const allowedList = options.map((o) => `"${o}"`).join(', ')
  const { pot, facing } = spotContextForLang(scenario.position, lang)
  const scenarioIdx = indexOfAiScenarioPosition(scenario.position)
  const positionLine =
    scenarioIdx >= 0 ? aiScenarioPositionByIndex(scenarioIdx, lang) : scenario.position
  const boardTypeLine = boardTextureTypeLabel(board.type, lang)

  const boardDescription = turnCard
    ? `${board.board} → ${turnCard.card}（${turnCardTypeLabel(turnCard.type, lang)}）`
    : board.board

  const explainHint = claudeExplanationLanguageDirective(lang)

  return `You are a GTO poker coach. Generate a postflop training question.

Scenario type: ${scenario.type}
Position: ${positionLine}
Board: ${boardDescription} (${boardTypeLine})
Hero hand: ${hand.cards} (${hand.type})
Pot: ${pot}
Villain action: ${facing}

The correctAnswer field MUST be exactly one of these strings (copy character-for-character): ${allowedList}

GTO principles for this scenario type:
${PRINCIPLES_FOR_SCENARIO[scenario.type]}

For the "explanation" field: ${explainHint}

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "correctAnswer": "<one of the allowed strings above, exact match>",
  "explanation": "<your explanation text>"
}`
}

/**
 * 從 Claude 回傳字串擷取 JSON 物件。
 */
function parseClaudeJson(text: string): { correctAnswer: string; explanation: string } | null {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const o = JSON.parse(jsonMatch[0]) as { correctAnswer?: string; explanation?: string }
    if (typeof o.correctAnswer !== 'string' || typeof o.explanation !== 'string') return null
    return { correctAnswer: o.correctAnswer, explanation: o.explanation }
  } catch {
    return null
  }
}

function isValidAnswerForScenario(type: AiScenarioType, answer: string, lang: Language): boolean {
  return (SCENARIO_OPTIONS_BY_LANG[lang][type] as readonly string[]).includes(answer)
}

/**
 * API 失敗或無金鑰時的備用 AI 風格題目。
 *
 * @param turnCard 轉牌情境時傳入，題幹與 board 會一併帶入轉牌。
 * @param lang - 介面語言
 */
export function buildFallbackAIQuestion(
  scenario: AiScenarioRow,
  board: BoardTexture,
  hand: HeroHandPick,
  turnCard: TurnCardPick | undefined,
  lang: Language,
): PostflopQuestion {
  const options = SCENARIO_OPTIONS_BY_LANG[lang][scenario.type]
  const correctAnswer = options[0]!
  const { pot, facing } = spotContextForLang(scenario.position, lang)
  const scenarioIdx = indexOfAiScenarioPosition(scenario.position)
  const positionDisplay =
    scenarioIdx >= 0 ? aiScenarioPositionByIndex(scenarioIdx, lang) : scenario.position
  const fb = postflopFallbackCopy(lang)

  return {
    id: `ai-fallback-${Date.now()}`,
    type: 'ai',
    positionRecord: scenario.position,
    position: positionDisplay,
    heroCards: hand.cards,
    board: displayBoardString(board, turnCard),
    boardType: displayBoardType(board, turnCard, lang),
    pot,
    facing,
    question: buildAiQuestionText(
      scenario.type,
      scenario.position,
      positionDisplay,
      board,
      hand,
      lang,
      turnCard,
    ),
    options: [...options],
    correctAnswer,
    explanation: fb.explanation,
    source: fb.source,
  }
}

/**
 * 呼叫 Anthropic Messages API（開發時建議走 Vite `/claude-proxy` 以避免 CORS）。
 */
async function fetchClaudeMessage(prompt: string): Promise<string> {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  }

  const useProxy = import.meta.env.DEV
  const url = useProxy
    ? '/claude-proxy/v1/messages'
    : 'https://api.anthropic.com/v1/messages'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  }

  if (!useProxy && import.meta.env.VITE_ANTHROPIC_API_KEY) {
    headers['x-api-key'] = import.meta.env.VITE_ANTHROPIC_API_KEY
  }

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Claude API ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>
  }
  const text = data.content?.[0]?.text ?? ''
  return text
}

/**
 * 以 Claude 依情境產生單選題；失敗時改回傳 {@link buildFallbackAIQuestion}。
 *
 * @param turnCard `turn-barrel`／`probe-bet` 時建議傳入，以豐富牌面敘述。
 * @param lang - 介面語言
 */
export async function generateAIQuestion(
  scenario: AiScenarioRow,
  board: BoardTexture,
  hand: HeroHandPick,
  turnCard: TurnCardPick | undefined,
  lang: Language,
): Promise<PostflopQuestion> {
  const { pot, facing } = spotContextForLang(scenario.position, lang)
  const prompt = buildPrompt(scenario, board, hand, turnCard, lang)
  const options = [...SCENARIO_OPTIONS_BY_LANG[lang][scenario.type]]
  const scenarioIdx = indexOfAiScenarioPosition(scenario.position)
  const positionDisplay =
    scenarioIdx >= 0 ? aiScenarioPositionByIndex(scenarioIdx, lang) : scenario.position

  try {
    if (!import.meta.env.DEV && !import.meta.env.VITE_ANTHROPIC_API_KEY) {
      return buildFallbackAIQuestion(scenario, board, hand, turnCard, lang)
    }

    const text = await fetchClaudeMessage(prompt)
    const parsed = parseClaudeJson(text)
    if (!parsed) {
      return buildFallbackAIQuestion(scenario, board, hand, turnCard, lang)
    }

    const valid = isValidAnswerForScenario(scenario.type, parsed.correctAnswer, lang)
    if (!valid) {
      return buildFallbackAIQuestion(scenario, board, hand, turnCard, lang)
    }

    const id = `ai-${Date.now()}`
    return {
      id,
      type: 'ai',
      positionRecord: scenario.position,
      position: positionDisplay,
      heroCards: hand.cards,
      board: displayBoardString(board, turnCard),
      boardType: displayBoardType(board, turnCard, lang),
      pot,
      facing,
      question: buildAiQuestionText(
        scenario.type,
        scenario.position,
        positionDisplay,
        board,
        hand,
        lang,
        turnCard,
      ),
      options,
      correctAnswer: parsed.correctAnswer,
      explanation: parsed.explanation,
      source: postflopAiSourceLabel(lang),
    }
  } catch {
    return buildFallbackAIQuestion(scenario, board, hand, turnCard, lang)
  }
}

/**
 * 隨機挑一筆。
 */
export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

const SUIT_UNICODE: Record<string, SuitCode> = {
  '♠': 's',
  '♥': 'h',
  '♦': 'd',
  '♣': 'c',
}

/**
 * 解析如 "A♠K♦" 為兩張牌的 rank 與花色代碼。
 */
export function parseTwoCardString(s: string): { rank1: string; suit1: SuitCode; rank2: string; suit2: SuitCode } | null {
  const re = /([AKQJT2-9])([♠♥♦♣])/g
  const m1 = re.exec(s)
  const m2 = re.exec(s)
  if (!m1 || !m2) return null
  const s1 = SUIT_UNICODE[m1[2]!]
  const s2 = SUIT_UNICODE[m2[2]!]
  if (!s1 || !s2) return null
  return { rank1: m1[1]!, suit1: s1, rank2: m2[1]!, suit2: s2 }
}

/**
 * 解析 flop 字串為牌卡陣列。
 */
export function parseBoardCards(board: string): Array<{ rank: string; suit: SuitCode }> {
  const re = /([AKQJT2-9])([♠♥♦♣])/g
  const out: Array<{ rank: string; suit: SuitCode }> = []
  let m: RegExpExecArray | null
  while ((m = re.exec(board)) !== null) {
    const su = SUIT_UNICODE[m[2]!]
    if (su) out.push({ rank: m[1]!, suit: su })
  }
  return out
}
