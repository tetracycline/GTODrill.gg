import type { Language } from '../i18n/types'

/** AI 情境類型（與 postflopAI 對齊）。 */
export type PostflopAiScenarioType = 'flop-cbet' | 'bb-defense' | 'turn-barrel' | 'probe-bet'

/**
 * 各語系下 AI 題選項字串（須與 `correctAnswer` 完全一致）。
 */
export const SCENARIO_OPTIONS_BY_LANG: Record<
  Language,
  Record<PostflopAiScenarioType, readonly string[]>
> = {
  'zh-TW': {
    'flop-cbet': ['小注 25-33%', '大注 67-75%', 'Check'],
    'bb-defense': ['Check-Raise', 'Call', 'Fold'],
    'turn-barrel': ['繼續下注 Barrel', 'Check'],
    'probe-bet': ['Probe 下注 50%', 'Check'],
  },
  'zh-CN': {
    'flop-cbet': ['小注 25-33%', '大注 67-75%', 'Check'],
    'bb-defense': ['Check-Raise', 'Call', 'Fold'],
    'turn-barrel': ['继续下注 Barrel', 'Check'],
    'probe-bet': ['Probe 下注 50%', 'Check'],
  },
  en: {
    'flop-cbet': ['Small bet 25-33%', 'Large bet 67-75%', 'Check'],
    'bb-defense': ['Check-Raise', 'Call', 'Fold'],
    'turn-barrel': ['Continue betting (barrel)', 'Check'],
    'probe-bet': ['Probe bet 50%', 'Check'],
  },
}

/**
 * Claude 題目解析／來源顯示用短句。
 *
 * @param lang - 介面語言
 */
export function postflopAiSourceLabel(lang: Language): string {
  if (lang === 'en') return 'Claude AI estimate (GTO-based)'
  if (lang === 'zh-CN') return 'Claude AI 估算（基于 GTO 原则）'
  return 'Claude AI 估算（基於 GTO 原則）'
}

/**
 * 備用題說明與來源。
 *
 * @param lang - 介面語言
 */
export function postflopFallbackCopy(lang: Language): { explanation: string; source: string } {
  if (lang === 'en') {
    return {
      explanation: 'Could not reach Claude API. Fallback question — verify with a solver.',
      source: 'Fallback (API unavailable)',
    }
  }
  if (lang === 'zh-CN') {
    return {
      explanation: '无法连接 Claude API。此为备用题，请以 solver 为准。',
      source: '备用题（API 不可用）',
    }
  }
  return {
    explanation: '無法連線至 Claude API。此為備用題，請以 solver 為準。',
    source: '備用題（API 不可用）',
  }
}

/** 題幹中 Hero 手牌類型（英文鍵）之顯示文案。 */
const HERO_TYPE_LABELS: Record<string, Record<Language, string>> = {
  'top pair top kicker': {
    'zh-TW': '頂對頂踢腳',
    'zh-CN': '顶对顶踢脚',
    en: 'top pair top kicker',
  },
  'second pair': {
    'zh-TW': '第二對',
    'zh-CN': '第二对',
    en: 'second pair',
  },
  'flush draw + straight draw': {
    'zh-TW': '同花聽牌 + 順子聽牌',
    'zh-CN': '同花听牌 + 顺子听牌',
    en: 'flush draw + straight draw',
  },
  overpair: {
    'zh-TW': '超對',
    'zh-CN': '超对',
    en: 'overpair',
  },
  'top pair + backdoor flush': {
    'zh-TW': '頂對 + 後門同花',
    'zh-CN': '顶对 + 后门同花',
    en: 'top pair + backdoor flush',
  },
  'middle set': {
    'zh-TW': '中間 Set',
    'zh-CN': '中间 Set',
    en: 'middle set',
  },
  'gut-shot straight draw': {
    'zh-TW': '卡順聽牌',
    'zh-CN': '卡顺听牌',
    en: 'gutshot straight draw',
  },
  'open-ended straight draw': {
    'zh-TW': '兩頭順聽牌',
    'zh-CN': '两头顺听牌',
    en: 'open-ended straight draw',
  },
  'bottom set': {
    'zh-TW': '底 Set',
    'zh-CN': '底 Set',
    en: 'bottom set',
  },
  'top pair weak kicker': {
    'zh-TW': '頂對弱踢腳',
    'zh-CN': '顶对弱踢脚',
    en: 'top pair weak kicker',
  },
}

/**
 * @param typeKey - {@link HERO_HANDS} 的 `type` 欄位
 * @param lang - 介面語言
 */
export function heroHandTypeLabel(typeKey: string, lang: Language): string {
  return HERO_TYPE_LABELS[typeKey]?.[lang] ?? typeKey
}

/** 牌面質地（繁中鍵）→ 各語系 */
const BOARD_TYPE_I18N: Record<string, Record<Language, string>> = {
  '乾燥彩虹 Ace 高': {
    'zh-TW': '乾燥彩虹 Ace 高',
    'zh-CN': '干燥彩虹 Ace 高',
    en: 'Dry rainbow Ace-high',
  },
  '乾燥彩虹 King 高': {
    'zh-TW': '乾燥彩虹 King 高',
    'zh-CN': '干燥彩虹 King 高',
    en: 'Dry rainbow King-high',
  },
  '乾燥彩虹 Queen 高': {
    'zh-TW': '乾燥彩虹 Queen 高',
    'zh-CN': '干燥彩虹 Queen 高',
    en: 'Dry rainbow Queen-high',
  },
  '連張 Broadway': {
    'zh-TW': '連張 Broadway',
    'zh-CN': '连张 Broadway',
    en: 'Connected Broadway',
  },
  半濕兩色: {
    'zh-TW': '半濕兩色',
    'zh-CN': '半湿两色',
    en: 'Semi-wet two-tone',
  },
  低牌乾燥: {
    'zh-TW': '低牌乾燥',
    'zh-CN': '低牌干燥',
    en: 'Low dry',
  },
  '三張 Broadway': {
    'zh-TW': '三張 Broadway',
    'zh-CN': '三张 Broadway',
    en: 'Three Broadway cards',
  },
  '連張有 flush draw': {
    'zh-TW': '連張有 flush draw',
    'zh-CN': '连张有 flush draw',
    en: 'Connected with flush draw',
  },
  連張半濕: {
    'zh-TW': '連張半濕',
    'zh-CN': '连张半湿',
    en: 'Connected semi-wet',
  },
  '對子板 King': {
    'zh-TW': '對子板 King',
    'zh-CN': '对子板 King',
    en: 'Paired King-high board',
  },
  '對子板 Ace': {
    'zh-TW': '對子板 Ace',
    'zh-CN': '对子板 Ace',
    en: 'Paired Ace-high board',
  },
  '兩色乾燥 Ace 高': {
    'zh-TW': '兩色乾燥 Ace 高',
    'zh-CN': '两色干燥 Ace 高',
    en: 'Two-tone dry Ace-high',
  },
  低連張彩虹: {
    'zh-TW': '低連張彩虹',
    'zh-CN': '低连张彩虹',
    en: 'Low connected rainbow',
  },
  '三張 Broadway 彩虹': {
    'zh-TW': '三張 Broadway 彩虹',
    'zh-CN': '三张 Broadway 彩虹',
    en: 'Three Broadway rainbow',
  },
}

/**
 * @param zhTwType - 題目內繁中質地字串
 * @param lang - 介面語言
 */
export function boardTextureTypeLabel(zhTwType: string, lang: Language): string {
  return BOARD_TYPE_I18N[zhTwType]?.[lang] ?? zhTwType
}

/** 轉牌質地（繁中鍵） */
const TURN_TYPE_I18N: Record<string, Record<Language, string>> = {
  '高張（對 IP 有利）': {
    'zh-TW': '高張（對 IP 有利）',
    'zh-CN': '高张（对 IP 有利）',
    en: 'High card (favors IP)',
  },
  '磚（brick）': {
    'zh-TW': '磚（brick）',
    'zh-CN': '砖（brick）',
    en: 'Brick',
  },
  '連張（危險）': {
    'zh-TW': '連張（危險）',
    'zh-CN': '连张（危险）',
    en: 'Connected (dangerous)',
  },
  高張中等: {
    'zh-TW': '高張中等',
    'zh-CN': '高张中等',
    en: 'Mid high card',
  },
  低磚: {
    'zh-TW': '低磚',
    'zh-CN': '低砖',
    en: 'Low brick',
  },
  '連張有 draw': {
    'zh-TW': '連張有 draw',
    'zh-CN': '连张有 draw',
    en: 'Connected with draws',
  },
}

/**
 * @param zhTwTurnType - {@link TURN_CARDS} 的 `type`
 * @param lang - 介面語言
 */
export function turnCardTypeLabel(zhTwTurnType: string, lang: Language): string {
  return TURN_TYPE_I18N[zhTwTurnType]?.[lang] ?? zhTwTurnType
}

type SpotTriple = Record<Language, { pot: string; facing: string }>

function spotTriple(zh: { pot: string; facing: string }, cn: { pot: string; facing: string }, en: { pot: string; facing: string }): SpotTriple {
  return { 'zh-TW': zh, 'zh-CN': cn, en }
}

/** 依情境 position 字串（繁中）回傳 pot／facing 三語。 */
function spotContextTripleForPosition(position: string): SpotTriple {
  if (position.includes('多人底池')) {
    return spotTriple(
      { pot: '~8bb（三人底池）', facing: 'BTN check，BB check，輪到 Hero（CO）' },
      { pot: '~8bb（三人底池）', facing: 'BTN check，BB check，轮到 Hero（CO）' },
      {
        pot: '~8bb (3-way)',
        facing: 'BTN checks, BB checks, action on Hero (CO)',
      },
    )
  }
  if (position.includes('BB 防守') && position.includes('大注')) {
    return spotTriple(
      { pot: '5.5bb', facing: 'BTN 約 67% pot c-bet，BB 行動' },
      { pot: '5.5bb', facing: 'BTN 约 67% pot c-bet，BB 行动' },
      { pot: '5.5bb', facing: '~67% pot c-bet from BTN, BB to act' },
    )
  }
  if (position.includes('BB 防守')) {
    return spotTriple(
      { pot: '5.5bb', facing: 'BTN 約 33% pot c-bet，BB 行動' },
      { pot: '5.5bb', facing: 'BTN 约 33% pot c-bet，BB 行动' },
      { pot: '5.5bb', facing: '~33% pot c-bet from BTN, BB to act' },
    )
  }
  if (position.includes('翻牌大注後，轉牌')) {
    return spotTriple(
      { pot: '~18bb（翻牌大注後 BB call）', facing: '翻牌 Hero 大注，BB call；轉牌 BB check' },
      { pot: '~18bb（翻牌大注后 BB call）', facing: '翻牌 Hero 大注，BB call；转牌 BB check' },
      {
        pot: '~18bb (after large flop bet, BB called)',
        facing: 'Hero bet large on flop, BB called; BB checks turn',
      },
    )
  }
  if (position.includes('翻牌小注後，轉牌')) {
    return spotTriple(
      { pot: '~12bb（翻牌小注後 BB call）', facing: '翻牌 Hero 小注，BB call；轉牌 BB check' },
      { pot: '~12bb（翻牌小注后 BB call）', facing: '翻牌 Hero 小注，BB call；转牌 BB check' },
      {
        pot: '~12bb (after small flop bet, BB called)',
        facing: 'Hero bet small on flop, BB called; BB checks turn',
      },
    )
  }
  if (
    position.includes('probe') ||
    position.includes('check through') ||
    position.includes('BB probe') ||
    (position.includes('BB 先行動') && position.includes('check through'))
  ) {
    return spotTriple(
      { pot: '~5.5bb（翻牌無下注）', facing: '翻牌 BTN check、BB check；轉牌輪到 BB 先行' },
      { pot: '~5.5bb（翻牌无下注）', facing: '翻牌 BTN check、BB check；转牌轮到 BB 先行' },
      {
        pot: '~5.5bb (no flop bet)',
        facing: 'Flop checks through; BB acts first on turn',
      },
    )
  }
  if (position.includes('轉牌 bluff')) {
    return spotTriple(
      { pot: '~12bb（翻牌小注後 BB call）', facing: '翻牌 Hero 小注，BB call；轉牌 BB check' },
      { pot: '~12bb（翻牌小注后 BB call）', facing: '翻牌 Hero 小注，BB call；转牌 BB check' },
      {
        pot: '~12bb (after small flop bet, BB called)',
        facing: 'Hero bet small on flop, BB called; BB checks turn',
      },
    )
  }
  if (position.includes('3bet')) {
    return spotTriple(
      { pot: '~22bb（3bet pot）', facing: 'BTN check' },
      { pot: '~22bb（3bet pot）', facing: 'BTN check' },
      { pot: '~22bb (3-bet pot)', facing: 'BTN checks' },
    )
  }
  if (position.includes('SB vs BB')) {
    return spotTriple(
      { pot: '7bb（SB 單挑 open）', facing: 'BB check' },
      { pot: '7bb（SB 单挑 open）', facing: 'BB check' },
      { pot: '7bb (SB opened HU)', facing: 'BB checks' },
    )
  }
  return spotTriple(
    { pot: '5.5bb', facing: 'BB check' },
    { pot: '5.5bb', facing: 'BB check' },
    { pot: '5.5bb', facing: 'BB checks' },
  )
}

/**
 * @param position - 繁中 position 描述（與 postflopAI 相同邏輯分支）
 * @param lang - 介面語言
 */
export function spotContextForLang(position: string, lang: Language): { pot: string; facing: string } {
  const t = spotContextTripleForPosition(position)
  return t[lang]
}

/** AI 情境列 position 顯示（對應 {@link AI_SCENARIOS} 順序） */
export const AI_SCENARIO_POSITION_LABELS: Record<Language, readonly string[]> = {
  'zh-TW': [
    'BTN vs BB（單挑，BTN IP）',
    'CO vs BB（單挑，CO IP）',
    'UTG vs BB（單挑，UTG OOP）',
    'SB vs BB（單挑，SB OOP）',
    'BB 3bet pot vs BTN（BB OOP 100bb）',
    'BB 防守 vs BTN 小注 33%',
    'BB 防守 vs BTN 大注 67%',
    'BTN vs BB（翻牌小注後，轉牌決策）',
    'BTN vs BB（翻牌大注後，轉牌決策）',
    'BB vs BTN（翻牌 check through，轉牌 BB 先行動）',
  ],
  'zh-CN': [
    'BTN vs BB（单挑，BTN IP）',
    'CO vs BB（单挑，CO IP）',
    'UTG vs BB（单挑，UTG OOP）',
    'SB vs BB（单挑，SB OOP）',
    'BB 3bet pot vs BTN（BB OOP 100bb）',
    'BB 防守 vs BTN 小注 33%',
    'BB 防守 vs BTN 大注 67%',
    'BTN vs BB（翻牌小注后，转牌决策）',
    'BTN vs BB（翻牌大注后，转牌决策）',
    'BB vs BTN（翻牌 check through，转牌 BB 先行动）',
  ],
  en: [
    'BTN vs BB (heads-up, BTN IP)',
    'CO vs BB (heads-up, CO IP)',
    'UTG vs BB (heads-up, UTG OOP)',
    'SB vs BB (heads-up, SB OOP)',
    'BB 3-bet pot vs BTN (BB OOP 100bb)',
    'BB defending vs BTN small c-bet 33%',
    'BB defending vs BTN large c-bet 67%',
    'BTN vs BB (after small flop bet, turn decision)',
    'BTN vs BB (after large flop bet, turn decision)',
    'BB vs BTN (flop checked through, BB acts first on turn)',
  ],
}

/**
 * @param scenarioIndex - {@link AI_SCENARIOS} 陣列索引
 * @param lang - 介面語言
 */
export function aiScenarioPositionByIndex(scenarioIndex: number, lang: Language): string {
  const row = AI_SCENARIO_POSITION_LABELS[lang][scenarioIndex]
  return row ?? AI_SCENARIO_POSITION_LABELS['zh-TW'][scenarioIndex] ?? ''
}

/** 找出情境在 {@link AI_SCENARIOS} 的索引（以繁中 position 字串比對）。 */
export function indexOfAiScenarioPosition(zhTwPosition: string): number {
  const base = AI_SCENARIO_POSITION_LABELS['zh-TW']
  const i = base.findIndex((p) => p === zhTwPosition)
  return i
}

/**
 * Prompt 內要求模型輸出解析的語言說明。
 *
 * @param lang - 介面語言
 */
export function claudeExplanationLanguageDirective(lang: Language): string {
  if (lang === 'en') return 'Write "explanation" in clear English (2–3 sentences).'
  if (lang === 'zh-CN') return '用简体中文写 explanation（2–3 句）。'
  return '用繁體中文寫 explanation（2–3 句）。'
}

/**
 * 組 AI 單選題題幹（依介面語系）。
 *
 * @param scenarioType - 情境類型
 * @param scenarioZhPosition - 繁中 position（供 spot 分支比對）
 * @param scenarioDisplayPosition - 顯示用位置描述
 * @param board - flop 與質地鍵
 * @param hand - Hero 與 type 鍵
 * @param lang - 介面語言
 * @param turnCard - 轉牌（可選）
 */
export function buildAiQuestionText(
  scenarioType: PostflopAiScenarioType,
  scenarioZhPosition: string,
  scenarioDisplayPosition: string,
  board: { board: string; type: string },
  hand: { cards: string; type: string },
  lang: Language,
  turnCard?: { card: string; type: string },
): string {
  const boardStr = turnCard ? `${board.board} → ${turnCard.card}` : board.board
  const bt = boardTextureTypeLabel(board.type, lang)
  const h = heroHandTypeLabel(hand.type, lang)
  const { facing } = spotContextForLang(scenarioZhPosition, lang)

  switch (scenarioType) {
    case 'flop-cbet':
      if (lang === 'en') {
        return `${boardStr} (${bt}), holding ${hand.cards} (${h}). ${scenarioDisplayPosition}. Flop: ${facing}. What do you do?`
      }
      if (lang === 'zh-CN') {
        return `${boardStr}（${bt}），持有 ${hand.cards}（${h}）。${scenarioDisplayPosition}。Flop：${facing}。应如何行动？`
      }
      return `${boardStr}（${bt}），持有 ${hand.cards}（${h}）。${scenarioDisplayPosition}。Flop：${facing}。應如何行動？`

    case 'bb-defense': {
      const large = scenarioZhPosition.includes('大注')
      const sizing =
        lang === 'en'
          ? large
            ? 'a large ~67% pot c-bet'
            : 'a small ~33% pot c-bet'
          : large
            ? lang === 'zh-CN'
              ? '大注 67%'
              : '大注 67%'
            : lang === 'zh-CN'
              ? '小注 33%'
              : '小注 33%'
      if (lang === 'en') {
        return `${boardStr} (${bt}), BB holds ${hand.cards} (${h}). Facing ${sizing} — how do you respond?`
      }
      if (lang === 'zh-CN') {
        return `${boardStr}（${bt}），BB 持有 ${hand.cards}（${h}）。面对 ${sizing}，应如何回应？`
      }
      return `${boardStr}（${bt}），BB 持有 ${hand.cards}（${h}）。面對 ${sizing}，應如何回應？`
    }

    case 'turn-barrel':
      if (lang === 'en') {
        return `After the flop, on the turn: ${boardStr}. ${scenarioDisplayPosition}, holding ${hand.cards} (${h}). BB checks — barrel or check?`
      }
      if (lang === 'zh-CN') {
        return `翻牌后进入转牌：${boardStr}。${scenarioDisplayPosition}，持有 ${hand.cards}（${h}）。BB check，应继续下注还是 Check？`
      }
      return `翻牌後進入轉牌：${boardStr}。${scenarioDisplayPosition}，持有 ${hand.cards}（${h}）。BB check，應繼續下注還是 Check？`

    case 'probe-bet':
      if (lang === 'en') {
        return `Flop checked through. Turn: ${boardStr}. ${scenarioDisplayPosition}, BB holds ${hand.cards} (${h}). BB acts first — probe or check?`
      }
      if (lang === 'zh-CN') {
        return `翻牌双方都 check。转牌：${boardStr}。${scenarioDisplayPosition}，BB 持有 ${hand.cards}（${h}）。BB 先行动，应该 Probe 还是 Check？`
      }
      return `翻牌雙方都 check。轉牌：${boardStr}。${scenarioDisplayPosition}，BB 持有 ${hand.cards}（${h}）。BB 先行動，應該 Probe 還是 Check？`

    default:
      return `${boardStr}（${bt}）`
  }
}
