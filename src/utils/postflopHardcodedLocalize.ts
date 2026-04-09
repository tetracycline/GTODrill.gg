import type { PostflopQuestion } from '../data/postflopQuestions'
import type { Language } from '../i18n/types'
import type { OpponentType } from '../types/opponentType'
import { boardTextureTypeLabel } from './postflopLocale'

/** 硬編碼選項：繁中 → 英文（其餘選項維持原樣）。 */
const OPTION_TW_TO_EN: Record<string, string> = {
  '小注 25-33%': 'Small bet 25-33%',
  '大注 67-75%': 'Large bet 67-75%',
  Check: 'Check',
  'Overbet 100%+': 'Overbet 100%+',
  '小注 25%': 'Small bet 25%',
  '大注 76%': 'Large bet 76%',
  '小注 24%': 'Small bet 24%',
  '大注 67%': 'Large bet 67%',
  Raise: 'Raise',
  Call: 'Call',
  Fold: 'Fold',
  '大注 67-75% bluff': 'Large bet 67-75% bluff',
  '小注 33% bluff': 'Small bet 33% bluff',
  'Check-Raise': 'Check-Raise',
  '主動小注 Donk 25-33%': 'Lead small 25-33%',
  'Check（等 BTN 下注）': 'Check (wait for BTN bet)',
  '主動下注 Donk': 'Lead (donk)',
  '3-Bet': '3-Bet',
  '3-Bet（4-Bet）': '3-Bet (4-bet)',
  'Squeeze 3bet': 'Squeeze 3-bet',
  '4bet': '4-bet',
  '3bet': '3-bet',
  '大注 bluff': 'Large bet bluff',
  '小注 value': 'Small bet value',
  '小注 bluff': 'Small bet bluff',
  '大注 value': 'Large bet value',
  'Call（bluff catch）': 'Call (bluff catch)',
  '下注 bluff': 'Bet bluff',
  '下注（value/保護）': 'Bet (value / protection)',
  'Probe 下注 50-67%': 'Probe bet 50-67%',
  'Probe 下注': 'Probe bet',
  '大注 75-100%': 'Large bet 75-100%',
  '大注 67%+': 'Large bet 67%+',
  '小注 13-20%': 'Small bet 13-20%',
  'Overbet 125%+': 'Overbet 125%+',
  '大注 75%': 'Large bet 75%',
}

/** 硬編碼 position：繁中 → 英文 */
const POSITION_TW_TO_EN: Record<string, string> = {
  'BTN vs BB（單挑）': 'BTN vs BB (heads-up)',
  'UTG vs BB（單挑，UTG OOP）': 'UTG vs BB (heads-up, UTG OOP)',
  'SB vs BB（單挑，SB OOP）': 'SB vs BB (heads-up, SB OOP)',
  'BB 3bet pot vs BTN（BB OOP）': 'BB 3-bet pot vs BTN (BB OOP)',
  'BB 防守 vs BTN c-bet': 'BB defending vs BTN c-bet',
  'BB 3bet pot vs BTN（BB OOP，BTN check）': 'BB 3-bet pot vs BTN (BB OOP, BTN checks)',
  'BTN vs BB（單挑，翻牌後）': 'BTN vs BB (heads-up, postflop)',
  'BTN vs BB（單挑，河牌）': 'BTN vs BB (heads-up, river)',
  'BB 防守 vs BTN 小注（Check-Raise 情境）': 'BB defending vs BTN small bet (check-raise spot)',
  'BB 防守 vs BTN 大注': 'BB defending vs BTN large bet',
  'BB 主動下注（Donk Bet）情境': 'BB leading (donk) spot',
  'BTN 面對 BB Check-Raise': 'BTN facing BB check-raise',
  'BB Squeeze（CO 開，BTN call，BB 行動）': 'BB squeeze (CO opens, BTN calls, BB to act)',
  'BB Squeeze（BTN 開，SB call，BB 行動）': 'BB squeeze (BTN opens, SB calls, BB to act)',
  'BTN 面對 BB Squeeze（CO 開 fold，輪到 BTN）': 'BTN facing BB squeeze (CO folded, action on BTN)',
  'SB 面對 BTN 開池': 'SB facing BTN open',
  'CO vs BTN vs BB（三人底池）': 'CO vs BTN vs BB (3-way)',
  'BTN vs BB（河牌，BTN IP）': 'BTN vs BB (river, BTN IP)',
  'BB 面對 BTN 河牌大注（Bluff Catch 決策）': 'BB facing BTN large river bet (bluff catch)',
  'BTN vs BB（轉牌 bluff 選擇）': 'BTN vs BB (turn bluff decision)',
  'BB vs BTN（翻牌 check through，轉牌 BB probe）': 'BB vs BTN (flop checked through, BB probes turn)',
  'BTN vs BB（河牌 value bet sizing）': 'BTN vs BB (river value-bet sizing)',
  '4bet pot — BTN vs BB 翻後（BTN 4bettor IP）': '4-bet pot — BTN vs BB postflop (BTN 4-bettor IP)',
  'BTN vs BB（河牌 overbet 情境）': 'BTN vs BB (river overbet spot)',
  'BB 防守 vs BTN 兩街下注': 'BB defending vs BTN two-street betting',
}

/** facing / pot 等短句：繁中 → 英文 */
const SNIPPET_TW_TO_EN: Record<string, string> = {
  'BB check': 'BB checks',
  'BTN check': 'BTN checks',
  'BTN 小注 33%（約 1.8bb）': 'BTN small bet ~33% (~1.8bb)',
  'BB check（轉牌）': 'BB checks (turn)',
  'BB check（河牌）': 'BB checks (river)',
  'BTN 大注 67%（約 3.7bb）': 'BTN large bet ~67% (~3.7bb)',
  'BTN 沒有下注（preflop raiser 先到翻牌）': 'BTN checks (PFR sees flop first)',
  'BTN 沒有下注': 'BTN checks',
  'BB check-raise 到約 5bb': 'BB check-raises to ~5bb',
  'CO 開池 2.5bb，BTN call，輪到 BB': 'CO opens 2.5bb, BTN calls, action on BB',
  'BTN 開池 2.5bb，SB call，輪到 BB': 'BTN opens 2.5bb, SB calls, action on BB',
  'BB squeeze 到約 11bb，CO fold，輪到 BTN': 'BB squeezes to ~11bb, CO folds, action on BTN',
  'BTN 開池 2.5bb，輪到 SB': 'BTN opens 2.5bb, action on SB',
  'BTN check，BB check，輪到 CO': 'BTN checks, BB checks, action on CO',
  'BTN all-in shove（約 200% pot）': 'BTN shoves all-in (~200% pot)',
  'BTN 大注 75% pot': 'BTN bets large ~75% pot',
  '轉牌 T，BB 先行動': 'Turn T, BB acts first',
  '轉牌 5，BB 先行動': 'Turn 5, BB acts first',
  'BTN 轉牌大注 67%': 'BTN large turn bet ~67%',
  '7bb（SB 3bb open）': '7bb (SB 3bb open)',
  '~12bb（翻牌小注後）': '~12bb (after small flop bet)',
  '~18bb（翻牌大注後）': '~18bb (after large flop bet)',
  '~30bb（翻轉兩街下注後）': '~30bb (after two streets)',
  '~25bb（翻牌大注，轉牌 check）': '~25bb (large flop bet, turn checked)',
  '~8bb（翻牌小注後）': '~8bb (after small flop bet)',
  '~7.5bb（CO 2.5bb + BTN call + SB fold）': '~7.5bb (CO 2.5bb + BTN call + SB fold)',
  '~7bb（BTN 2.5bb + SB call）': '~7bb (BTN 2.5bb + SB call)',
  '~15bb（BB squeeze 後）': '~15bb (after BB squeeze)',
  '~8bb（三人底池）': '~8bb (3-way)',
  '~20bb（翻牌小注 call，轉牌下注 call）': '~20bb (flop small bet called, turn bet called)',
  '~45bb（三街建底池後）': '~45bb (after three streets)',
  '~5.5bb（翻牌沒有下注）': '~5.5bb (no flop bet)',
  '~40bb（4bet pot）': '~40bb (4-bet pot)',
  '~25bb（翻牌 + 轉牌下注後）': '~25bb (after flop + turn bets)',
}

/** 題庫內複合 boardType：繁中 → 英文 */
const HARDCODED_BOARD_TYPE_EN: Record<string, string> = {
  半濕兩色板: 'Semi-wet two-tone board',
  超濕連張板: 'Very wet connected board',
  '全同花板（monotone）': 'Monotone board',
  '濕板連張有 flush draw': 'Wet connected board with flush draw',
  連張低牌板: 'Connected low board',
  半連張板: 'Semi-connected board',
  '乾燥彩虹 Ace 高，3bet pot': 'Dry rainbow Ace-high (3-bet pot)',
  '低連張板，3bet pot': 'Low connected board (3-bet pot)',
  低牌乾燥板: 'Low dry board',
  '乾燥彩虹，BB 有強 range advantage': 'Dry rainbow (BB has strong range advantage)',
  '乾燥彩虹，K 在場削弱超對': 'Dry rainbow (K on board weakens overpairs)',
  '超濕連張板，BTN range advantage': 'Very wet connected (BTN range advantage)',
  '對子板 King，BB range advantage 極大': 'Paired King-high (huge BB range advantage)',
  '乾燥彩虹 King 高，3bet pot': 'Dry rainbow King-high (3-bet pot)',
  '翻牌乾燥，轉牌 K（高張對 BTN 有利）': 'Dry flop, turn K (high card favors BTN)',
  '翻牌乾燥，轉牌磚（brick）': 'Dry flop, brick turn',
  '半濕翻牌，轉牌完成直順': 'Semi-wet flop, turn completes straights',
  '乾燥翻牌，轉牌給 IP 中對': 'Dry flop, turn gives IP mid pair',
  '乾燥 Ace 高翻牌，轉牌 9（給 BTN straight draw）': 'Dry Ace-high flop, turn 9 (BTN straight draws)',
  '三張 Broadway，轉牌 J（完成直順）': 'Three Broadway cards, turn J (straights complete)',
  '乾燥板，河牌完全無害': 'Dry board, harmless river',
  '翻牌 miss，轉牌大注 bluff，河牌磚': 'Flop miss, large turn bluff, brick river',
  '轉牌完成直順後，河牌磚': 'Straight completes on turn, brick river',
  '低牌連張，BB range advantage': 'Low connected (BB range advantage)',
  '低牌板，BB 有頂對': 'Low board (BB has top pair)',
  '乾燥 King 高板，BTN range advantage': 'Dry King-high (BTN range advantage)',
  '低牌板，BB 暗牌三條': 'Low board (BB has hidden set)',
  '乾燥 Ace-King 高板': 'Dry Ace-King high board',
  '高牌板，BTN range advantage': 'High board (BTN range advantage)',
  '低牌連張，BB 有直順': 'Low connected (BB has straight draws)',
  '低牌板，BB check-raise': 'Low board (BB check-raised)',
  '翻前 Squeeze 情境': 'Preflop squeeze spot',
  '翻前面對 Squeeze': 'Facing preflop squeeze',
  '翻前 SB 防守': 'SB preflop defense',
  '乾燥 Ace 高板，多人底池': 'Dry Ace-high (multiway)',
  '濕板連張，多人底池': 'Wet connected (multiway)',
  '翻牌小注，轉牌磚，河牌磚': 'Small flop bet, brick turn, brick river',
  '翻牌小注，轉牌磚，河牌 5': 'Small flop bet, brick turn, river 5',
  '三街下注，河牌完成 flush': 'Three streets, river completes flush',
  '翻牌小注後，轉牌磚': 'After small flop bet, brick turn',
  '翻牌 check through，轉牌給 BB 中對': 'Flop checks through, turn gives BB mid pair',
  '翻牌 check through，轉牌磚': 'Flop checks through, brick turn',
  '乾燥板，三條街 range-bet 後': 'Dry board after three-street range betting',
  '乾燥板，4bet pot（SPR 很低）': 'Dry board, 4-bet pot (very low SPR)',
  'Broadway 板，BTN 有頂部兩對': 'Broadway board (BTN has top two pair)',
  '轉牌給 BB 中了 two pair': 'Turn gives BB two pair',
  '轉牌高張，BB 沒有中': 'High turn card, BB misses',
}

/** 繁體慣用詞 → 簡體（詞組優先）。 */
const PHRASE_TRAD_TO_SIMP_RAW: [string, string][] = [
  ['應該', '应该'],
  ['擁有', '拥有'],
  ['頂對', '顶对'],
  ['頂部', '顶部'],
  ['對子', '对子'],
  ['連張', '连张'],
  ['聽牌', '听牌'],
  ['順子', '顺子'],
  ['同花', '同花'],
  ['河牌', '河牌'],
  ['轉牌', '转牌'],
  ['翻牌', '翻牌'],
  ['頻率', '频率'],
  ['獲利', '获利'],
  ['來源', '来源'],
  ['這個', '这个'],
  ['國', '国'],
  ['還是', '还是'],
  ['繼續', '继续'],
  ['質地', '质地'],
  ['問題', '问题'],
  ['須', '须'],
  ['無', '无'],
  ['為', '为'],
  ['與', '与'],
  ['實', '实'],
  ['從', '从'],
  ['務', '务'],
  ['處', '处'],
  ['純', '纯'],
  ['兩', '两'],
  ['個', '个'],
  ['極', '极'],
  ['強', '强'],
  ['約', '约'],
  ['後', '后'],
  ['輪', '轮'],
  ['對', '对'],
  ['過', '过'],
  ['說', '说'],
  ['認', '认'],
  ['識', '识'],
  ['開', '开'],
  ['場', '场'],
  ['時', '时'],
  ['經', '经'],
  ['機', '机'],
  ['錯', '错'],
  ['誤', '误'],
  ['擊', '击'],
  ['擇', '择'],
  ['據', '据'],
  ['擴', '扩'],
  ['擾', '扰'],
  ['擬', '拟'],
  ['擱', '搁'],
  ['擲', '掷'],
  ['沒有', '没有'],
  ['暗牌', '暗牌'],
  ['三條', '三条'],
  ['兩對', '两对'],
  ['單挑', '单挑'],
  ['乾燥', '干燥'],
  ['濕', '湿'],
  ['磚', '砖'],
  ['無害', '无害'],
  ['完成', '完成'],
  ['給', '给'],
  ['中了', '中了'],
  ['削弱', '削弱'],
  ['極大', '极大'],
  ['優勢', '优势'],
  ['範圍', '范围'],
  ['建議', '建议'],
  ['確認', '确认'],
  ['顯示', '显示'],
  ['載入', '载入'],
  ['選項', '选项'],
  ['點', '点'],
]

const PHRASE_TRAD_TO_SIMP: [string, string][] = [...PHRASE_TRAD_TO_SIMP_RAW].sort(
  (a, b) => b[0].length - a[0].length,
)

/**
 * 將字串做簡體化（詞組＋字元替換，非完整 OpenCC）。
 *
 * @param s - 繁中或混合字串
 */
function toSimplified(s: string): string {
  let o = s
  for (const [t, sp] of PHRASE_TRAD_TO_SIMP) {
    if (t.length > 0) o = o.split(t).join(sp)
  }
  return o
}

/**
 * 將 `opponentOverrides` 與 `options`／`correctAnswer` 同步為介面語系字串。
 *
 * @param raw - 題庫內覆寫（繁中鍵值）
 * @param lang - 介面語言
 */
function localizeOpponentOverrides(
  raw: PostflopQuestion['opponentOverrides'],
  lang: Language,
): PostflopQuestion['opponentOverrides'] | undefined {
  if (!raw) return undefined
  if (lang === 'zh-TW') return { ...raw }
  const entries = Object.entries(raw) as [OpponentType, string][]
  if (lang === 'zh-CN') {
    return Object.fromEntries(entries.map(([k, v]) => [k, toSimplified(v)])) as Record<
      OpponentType,
      string
    >
  }
  if (lang === 'en') {
    const mapOpt = (o: string) => OPTION_TW_TO_EN[o] ?? o
    return Object.fromEntries(entries.map(([k, v]) => [k, mapOpt(v)])) as Record<
      OpponentType,
      string
    >
  }
  return { ...raw }
}

/**
 * @param bt - 硬編碼題的 boardType
 * @param lang - 介面語言
 */
function localizedBoardType(bt: string, lang: Language): string {
  if (lang === 'zh-TW') return bt
  if (lang === 'zh-CN') return toSimplified(bt)
  const fromTable = boardTextureTypeLabel(bt, 'en')
  if (fromTable !== bt) return fromTable
  return HARDCODED_BOARD_TYPE_EN[bt] ?? bt
}

/**
 * 依介面語言調整硬編碼題顯示欄位；統計鍵固定自繁中 position 推算。
 *
 * @param q - 原始題目（繁中）
 * @param lang - 介面語言
 */
export function localizeHardcodedPostflopQuestion(q: PostflopQuestion, lang: Language): PostflopQuestion {
  const positionTw = q.position

  if (lang === 'zh-TW') {
    return { ...q, positionRecord: positionTw }
  }

  if (lang === 'zh-CN') {
    return {
      ...q,
      positionRecord: positionTw,
      position: toSimplified(q.position),
      boardType: localizedBoardType(q.boardType, 'zh-CN'),
      pot: toSimplified(q.pot),
      facing: toSimplified(q.facing),
      question: toSimplified(q.question),
      options: q.options.map(toSimplified),
      correctAnswer: toSimplified(q.correctAnswer),
      opponentOverrides: localizeOpponentOverrides(q.opponentOverrides, 'zh-CN'),
      explanation: toSimplified(q.explanation),
      source: toSimplified(q.source),
    }
  }

  if (lang === 'en') {
    const mapOpt = (o: string) => OPTION_TW_TO_EN[o] ?? o
    return {
      ...q,
      positionRecord: positionTw,
      position: POSITION_TW_TO_EN[q.position] ?? q.position,
      boardType: localizedBoardType(q.boardType, 'en'),
      pot: SNIPPET_TW_TO_EN[q.pot] ?? q.pot,
      facing: SNIPPET_TW_TO_EN[q.facing] ?? q.facing,
      question: q.question,
      options: q.options.map(mapOpt),
      correctAnswer: mapOpt(q.correctAnswer),
      opponentOverrides: localizeOpponentOverrides(q.opponentOverrides, 'en'),
      explanation: q.explanation,
      source: q.source,
    }
  }

  return { ...q, positionRecord: positionTw }
}

/**
 * 弱點／錯題紀錄內的 spot 字串（多為繁中）依介面語系顯示。
 *
 * @param position - localStorage 內儲存的 position
 * @param lang - 介面語言
 */
export function localizeWeakSpotPositionLabel(position: string, lang: Language): string {
  if (lang === 'zh-TW') return position
  if (lang === 'zh-CN') return toSimplified(position)
  return POSITION_TW_TO_EN[position] ?? position
}
