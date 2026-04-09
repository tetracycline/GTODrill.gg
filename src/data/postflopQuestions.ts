import type { OpponentType } from '../types/opponentType'

/**
 * 翻後訓練題目（硬編碼 / AI 共用結構）。
 */
export interface PostflopQuestion {
  id: string
  type: 'hardcoded' | 'ai'
  position: string
  heroCards: string
  board: string
  boardType: string
  pot: string
  facing: string
  question: string
  options: string[]
  /** GTO／基準答案（繁中原文；本地化後仍為「基準」）。 */
  correctAnswer: string
  /** 特定桌型之剝削答案覆寫（鍵為桌型，值為與 `options` 一致之繁中原文）。 */
  opponentOverrides?: Partial<Record<OpponentType, string>>
  explanation: string
  source: string
  /**
   * 為 true 時為邊緣／決策較難的 spot；抽題時會提高出現比例。
   */
  marginal?: boolean
  /**
   * 繁中原始 position（題庫／情境內部鍵）；`position` 本地化顯示時仍用此欄做弱點統計。
   */
  positionRecord?: string
}

// ── HARDCODED QUESTIONS ──────────────────────────────────────────
// Source: GTO Wizard blog（verified solver data, 100bb 6-max cash NL500）+
//         Upswing "Sizing Your C-Bets" 等

export const HARDCODED_QUESTIONS: PostflopQuestion[] = [
  // ══════════════════════════════════════
  // BTN vs BB — IP RAISER（單挑）
  // ══════════════════════════════════════

  {
    id: 'hc-001',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑）',
    heroCards: 'A♠J♦',
    board: 'A♥7♦2♣',
    boardType: '乾燥彩虹 Ace 高',
    pot: '5.5bb',
    facing: 'BB check',
    question: 'A72 彩虹板，持有 AJ（頂對頂踢）。應該如何下注？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: 'Check',
    opponentOverrides: {
      fish: '小注 25-33%',
      nit: '小注 25-33%',
    },
    explanation:
      'GTO 在乾燥 Ace 高板會混用 Check 與小注；此題以 **Check** 為基準（控池、保留 range）。\n• 對 **Fish**：可改用小注拿薄價值，因對手跟注範圍太寬、棄牌不足。\n• 對 **Nit**：小注逼退邊緣對子亦有價值。\n來源：GTO Wizard "The Mechanics of C-Bet Sizing"',
    source: 'GTO Wizard: The Mechanics of C-Bet Sizing',
    marginal: false,
  },

  {
    id: 'hc-002',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑）',
    heroCards: 'K♠Q♦',
    board: 'K♥K♦5♣',
    boardType: '對子板 King 高',
    pot: '5.5bb',
    facing: 'BB check',
    question: 'KK5 彩虹對子板，持有 KQ（三條）。應該如何下注？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: '小注 25-33%',
    explanation:
      'BTN 在 KK5 彩虹板 c-bet 頻率高達 96%，使用小注。\n• 對子板對 preflop raiser 極度有利\n• BB range 幾乎沒有 King（早就 3bet 了）\n• 小注讓 BB 所有手牌繼續，最大化長期獲利\n來源：GTO Wizard "Flop Heuristics" (KK5 rainbow ~96% cbet)',
    source: 'GTO Wizard: Flop Heuristics IP C-Betting',
    marginal: false,
  },

  {
    id: 'hc-003',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑）',
    heroCards: 'K♠7♦',
    board: 'K♥7♠3♦',
    boardType: '乾燥彩虹 King 高',
    pot: '5.5bb',
    facing: 'BB check',
    question: 'K73 彩虹板，持有 K7（兩對）。BTN c-bet 頻率約 76%。應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: '小注 25-33%',
    opponentOverrides: {
      fish: '大注 67-75%',
      nit: '小注 25-33%',
    },
    explanation:
      'King 高乾燥彩虹板，BTN 有明顯 range advantage。\n• c-bet 頻率高（~76%），以小注為主\n• K7 兩對在此板很強，薄 value 下注\n• 小注讓 BB 的 Kx、pair 手牌繼續付費\n來源：GTO Wizard "Flop Heuristics" (K73 rainbow BTN cbets 76.5%)',
    source: 'GTO Wizard: Flop Heuristics (K73 rainbow = 76.5% cbet)',
    marginal: false,
  },

  {
    id: 'hc-004',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑）',
    heroCards: 'A♥K♥',
    board: 'K♥J♥7♦',
    boardType: '半濕兩色板',
    pot: '5.5bb',
    facing: 'BB check',
    question: 'KJ7 兩色板（有 flush draw），持有 AK（頂對）。應該如何下注？',
    options: ['小注 25-33%', '大注 67-75%', 'Overbet 100%+', 'Check'],
    correctAnswer: '大注 67-75%',
    explanation:
      'KJ7 兩色是半濕板，需要較大的下注：\n• Flush draw 在場，頂對需要保護\n• 大注驅趕 BB 的 draw（付出更高代價）\n• BB 的 mid-range 手牌很難 call 大注\n來源：GTO Wizard "The Mechanics of C-Bet Sizing" (KJ7tt uses 75-125% sizing)',
    source: 'GTO Wizard: The Mechanics of C-Bet Sizing (KJ7tt)',
    marginal: true,
  },

  {
    id: 'hc-005',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑）',
    heroCards: 'T♠9♠',
    board: 'Q♦J♦T♣',
    boardType: '超濕連張板',
    pot: '5.5bb',
    facing: 'BB check',
    question: 'QJT 兩色連張板，持有 T9（底對 + gutshot）。BTN c-bet 頻率約 50%。應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: 'Check',
    opponentOverrides: {
      fish: 'Check',
      nit: '小注 25-33%',
      aggro: 'Check',
    },
    explanation:
      'QJT 超濕板，BTN c-bet 只有約 50%，另一半 check。\n• BB 的 range 在此板 connect 很多（K、8、9 都有直順）\n• T9 不是強手，很多牌被 beat\n• Check 保護你的 range，避免被 check-raise\n來源：GTO Wizard "The Mechanics of C-Bet Sizing" (QJT ~50% cbet)',
    source: 'GTO Wizard: The Mechanics of C-Bet Sizing (QJT)',
    marginal: true,
  },

  {
    id: 'hc-006',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑）',
    heroCards: 'A♣9♣',
    board: 'A♠9♠3♠',
    boardType: '全同花板（monotone）',
    pot: '5.5bb',
    facing: 'BB check',
    question: 'A93 全同花板，持有 A9（兩對）。BTN c-bet 頻率只有 26.6%。應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: 'Check',
    explanation:
      'A93 全同花板，BTN c-bet 只有 26.6%（非常低）。\n• BB 的 calling range 包含很多同花牌\n• 你的兩對在全同花板不安全（flush 可能已在場）\n• 大部分情況 check，等 BB 下注再決定\n來源：GTO Wizard "Flop Heuristics" (A93 monotone = 26.6% cbet)',
    source: 'GTO Wizard: Flop Heuristics (A93 monotone = 26.6%)',
    marginal: true,
  },

  {
    id: 'hc-007',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑）',
    heroCards: 'A♠A♦',
    board: '8♠7♠6♥',
    boardType: '濕板連張有 flush draw',
    pot: '5.5bb',
    facing: 'BB check',
    question: '876 兩色連張板，持有 AA（超對）。應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: '大注 67-75%',
    explanation:
      '876 濕板，AA 需要積極保護：\n• BB 有大量 straight draw（9x, 5x, T9, 54）和 flush draw\n• AA 只有 1 pair，很容易被 draw 超越\n• 大注讓 draw 付出高代價，同時提取最大 value\n來源：Upswing "Sizing Your C-Bets" (wet boards need 66-80% sizing)',
    source: 'Upswing Poker: Sizing Your C-Bets',
    marginal: true,
  },

  // ══════════════════════════════════════
  // UTG vs BB — OOP RAISER（單挑）
  // ══════════════════════════════════════

  {
    id: 'hc-008',
    type: 'hardcoded',
    position: 'UTG vs BB（單挑，UTG OOP）',
    heroCards: 'A♦K♣',
    board: 'A♥9♦2♣',
    boardType: '乾燥彩虹 Ace 高',
    pot: '5.5bb',
    facing: 'BB check',
    question: 'A92 彩虹板，UTG 持有 AK（頂對頂踢）。UTG OOP 應該怎麼做？',
    options: ['小注 25%', '大注 67-75%', 'Check'],
    correctAnswer: '小注 25%',
    explanation:
      'UTG 在 A92 彩虹板幾乎 range-bet 小注（24% pot）。\n• UTG 有強 range advantage（只開強牌進來）\n• BB 沒有很多 Ax（有就 3bet 了）\n• 小注效率最高：風險小，BB 必須用幾乎整個 range 繼續\n來源：GTO Wizard "The Learning System" (UTG uses 24% range-bet on A92r)',
    source: 'GTO Wizard: The Learning System (UTG 24% range-bet A92r)',
    marginal: false,
  },

  {
    id: 'hc-009',
    type: 'hardcoded',
    position: 'UTG vs BB（單挑，UTG OOP）',
    heroCards: 'K♦Q♥',
    board: 'K♠Q♦7♥',
    boardType: '乾燥彩虹 King 高',
    pot: '5.5bb',
    facing: 'BB check',
    question: 'KQ7 彩虹板，UTG 持有 KQ（兩對）。UTG OOP 應該怎麼做？',
    options: ['小注 24%', '大注 76%', 'Check'],
    correctAnswer: '小注 24%',
    explanation:
      'UTG 在 KQ7 彩虹板使用小注，兩種 size 都有但以小為主。\n• UTG range 在此板有強 range advantage\n• KQ 兩對是強手，但板面靜態不需大注\n• 小注讓更多 BB 手牌繼續，長期獲利更高\n來源：GTO Wizard "Overchoice: Making Sense of Multiple Sizings" (UTG KQ7r)',
    source: 'GTO Wizard: Overchoice article (UTG KQ7r uses 24%/76% mix)',
    marginal: true,
  },

  {
    id: 'hc-010',
    type: 'hardcoded',
    position: 'UTG vs BB（單挑，UTG OOP）',
    heroCards: 'J♠T♠',
    board: '9♥8♦7♣',
    boardType: '連張低牌板',
    pot: '5.5bb',
    facing: 'BB check',
    question: '987 彩虹連張板，UTG 持有 JT（直順）。UTG OOP 應該怎麼做？',
    options: ['小注 25%', '大注 67-75%', 'Check'],
    correctAnswer: 'Check',
    explanation:
      '連張低牌板是 BB 的有利板面，UTG check 更多：\n• BB 的 range 有很多中小牌（56, 67, T9 等）\n• UTG 在連張板失去很多 range advantage\n• JT 雖然有直順，但 UTG OOP 應該 check，避免面對 check-raise\n• 連張板是 OOP raiser 最少 c-bet 的板型之一\n來源：GTO Wizard "Flop Heuristics OOP C-Betting"',
    source: 'GTO Wizard: Flop Heuristics OOP C-Betting (connected boards = check more)',
    marginal: true,
  },

  // ══════════════════════════════════════
  // SB vs BB — OOP RAISER（單挑）
  // Source: GTO Wizard "Aggregate Flop Strategy: SB C-Betting in SRP"
  // ══════════════════════════════════════

  {
    id: 'hc-011',
    type: 'hardcoded',
    position: 'SB vs BB（單挑，SB OOP）',
    heroCards: 'A♠K♦',
    board: 'A♥5♦2♣',
    boardType: '乾燥彩虹 Ace 高',
    pot: '7bb（SB 3bb open）',
    facing: 'BB check',
    question: 'A52 彩虹板，SB 持有 AK（頂對頂踢）。SB OOP 應該怎麼做？',
    options: ['小注 25-33%', '大注 67%', 'Check'],
    correctAnswer: '小注 25-33%',
    explanation:
      'SB 在 Ace 高乾燥板 c-bet 頻率比 BTN 低（check 40-50%），但 AK 是應該下注的強手。\n• SB 整體 c-bet 頻率比 BTN 低（OOP 劣勢）\n• 但 AK 在 Ace 高板有明確 value，小注提取價值\n• 使用小注，避免 BB 用 flush draw 等 raise\n來源：GTO Wizard "Aggregate Flop Strategy: SB C-Betting in SRP"',
    source: 'GTO Wizard: SB C-Betting in SRP',
    marginal: false,
  },

  {
    id: 'hc-012',
    type: 'hardcoded',
    position: 'SB vs BB（單挑，SB OOP）',
    heroCards: 'Q♠J♦',
    board: 'J♥9♦6♣',
    boardType: '半連張板',
    pot: '7bb',
    facing: 'BB check',
    question: 'J96 彩虹半連張板，SB 持有 QJ（頂對）。SB OOP 應該怎麼做？',
    options: ['小注 25-33%', '大注 67%', 'Check'],
    correctAnswer: 'Check',
    explanation:
      'SB 在連張板 c-bet 頻率很低，check 為主。\n• SB 整體 check 40-50%，連張板更多\n• BB 的 range 在低連張板 connect 很多（T8, 87, 78 等）\n• QJ 頂對在此板有被 draw 超越的風險\n• OOP 連張板 check，等 BB 下注後再決定\n來源：GTO Wizard "SB C-Betting" (connected boards SB checks most)',
    source: 'GTO Wizard: Aggregate Flop Strategy SB C-Betting',
    marginal: true,
  },

  // ══════════════════════════════════════
  // 3BET POT — OOP 3bettor（BB vs BTN）
  // Source: GTO Wizard "C-Betting OOP in 3-Bet Pots"
  // ══════════════════════════════════════

  {
    id: 'hc-013',
    type: 'hardcoded',
    position: 'BB 3bet pot vs BTN（BB OOP）',
    heroCards: 'A♦K♣',
    board: 'A♥5♦2♣',
    boardType: '乾燥彩虹 Ace 高，3bet pot',
    pot: '~22bb',
    facing: 'BTN check',
    question: '3bet pot，BB 持有 AK，A52 彩虹板。OOP 3bettor 應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: '大注 67-75%',
    explanation:
      '3bet pot 中 OOP c-bet 策略不同於單挑底池：\n• Pot 已大，需要大注保護 range advantage\n• BB 在 3bet pot 有強 range（AK 在此板是純 value）\n• BTN 在 A52 板沒有很多 Ax（開牌範圍雖廣但 Ax 比例低）\n• OOP 需要大注補償位置劣勢\n來源：GTO Wizard "C-Betting OOP in 3-Bet Pots"',
    source: 'GTO Wizard: C-Betting OOP in 3-Bet Pots (100bb)',
    marginal: false,
  },

  {
    id: 'hc-014',
    type: 'hardcoded',
    position: 'BB 3bet pot vs BTN（BB OOP）',
    heroCards: 'K♠K♦',
    board: '6♥5♦4♣',
    boardType: '低連張板，3bet pot',
    pot: '~22bb',
    facing: 'BTN check',
    question: '3bet pot，BB 持有 KK（超對），654 彩虹連張板。OOP 應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: '小注 25-33%',
    explanation:
      '3bet pot 低連張板，KK 用小注：\n• SPR（stack-to-pot ratio）在 100bb 3bet pot 約 4，不適合全壓\n• KK 在 654 板有超對但很脆弱（87, 73, 23 等有直順）\n• 小注探索，保留後手空間\n• 大注讓你在面對 raise 時很難決策\n來源：GTO Wizard "C-Betting OOP in 3-Bet Pots" (100bb high SPR = small bet)',
    source: 'GTO Wizard: C-Betting OOP in 3-Bet Pots (100bb SPR)',
    marginal: true,
  },

  // ══════════════════════════════════════
  // BB DEFENSE（BB 面對 c-bet）
  // ══════════════════════════════════════

  {
    id: 'hc-015',
    type: 'hardcoded',
    position: 'BB 防守 vs BTN c-bet',
    heroCards: '8♦7♦',
    board: '7♥5♣2♦',
    boardType: '低牌乾燥板',
    pot: '5.5bb',
    facing: 'BTN 小注 33%（約 1.8bb）',
    question: '752 彩虹板，BB 持有 87（中對 + OESD）。面對 BTN 小注應該怎麼做？',
    options: ['Raise', 'Call', 'Fold'],
    correctAnswer: 'Call',
    explanation:
      '低牌板 BB 面對小注，87 有中對和聽牌，call 為主：\n• 87 在 752 板有中對（7）+ 可能的 straight draw\n• BTN 小注 range 很廣，87 對很多手牌都有價值\n• Raise 需要更強的手牌或純 bluff（如 A3, A4）\n• Fold 太緊，你還有後手\n來源：GTO Wizard "The Mechanics of C-Bet Sizing" (BB continuation range)',
    source: 'GTO Wizard: The Mechanics of C-Bet Sizing',
    marginal: true,
  },

  {
    id: 'hc-016',
    type: 'hardcoded',
    position: 'BB 防守 vs BTN c-bet',
    heroCards: 'Q♦J♦',
    board: 'Q♥7♦2♣',
    boardType: '乾燥彩虹 Queen 高',
    pot: '5.5bb',
    facing: 'BTN 小注 33%（約 1.8bb）',
    question: 'Q72 彩虹板，BB 持有 QJ（頂對）。面對 BTN 小注應該怎麼做？',
    options: ['Raise', 'Call', 'Fold'],
    correctAnswer: 'Call',
    explanation:
      'Q72 乾燥板，BB 持有頂對面對小注，call 為主：\n• QJ 頂對不夠強到需要 raise（BTN 有很多 Qx 強手）\n• Fold 太緊，頂對有足夠 equity\n• Call 最平衡：保留 bluff catcher 功能，讓 BTN 繼續 bluff\n• Raise 會讓 BTN 的弱手都 fold，只剩強手繼續',
    source: 'GTO Wizard: BB defense strategy (top pair = mostly call)',
    marginal: true,
  },

  {
    id: 'hc-017',
    type: 'hardcoded',
    position: 'BB 3bet pot vs BTN（BB OOP，BTN check）',
    heroCards: 'A♠K♦',
    board: 'K♥Q♦2♣',
    boardType: '乾燥彩虹，BB 有強 range advantage',
    pot: '~22bb',
    facing: 'BTN check',
    question: '3bet pot，BB 持有 AK（頂對頂踢），KQ2 彩虹板。BTN check 給你，應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: '大注 67-75%',
    explanation:
      '3bet pot KQ2 彩虹板，BB 有極強的 range advantage：\n• BB 的 3bet range 包含 KK、QQ、AA、AK、AQ — 在此板都是強手\n• BTN call 的 range 很少有 K 或 Q（有就 4bet 了）\n• AK 是純 value，打大注讓 BTN 的 Jx、Tx、pocket pair 付出高代價\n• 3bet pot 中 OOP c-bet 用大注補償位置劣勢\n來源：GTO Wizard "Crush 3-Bet Pots OOP"',
    source: 'GTO Wizard: Crush 3-Bet Pots OOP in Cash Games',
    marginal: false,
  },

  {
    id: 'hc-018',
    type: 'hardcoded',
    position: 'BB 3bet pot vs BTN（BB OOP，BTN check）',
    heroCards: 'A♦Q♦',
    board: 'A♥7♦2♣',
    boardType: '乾燥彩虹 Ace 高，3bet pot',
    pot: '~22bb',
    facing: 'BTN check',
    question: '3bet pot，BB 持有 AQ（頂對頂踢），A72 彩虹板。BTN check 給你，應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: '大注 67-75%',
    explanation:
      '3bet pot Ace 高乾燥板，BB c-bet 大注：\n• BB 的 3bet range 有大量 Ax 強手（AA、AK、AQ、AJ）\n• BTN 在 A72 板幾乎沒有 Ax（有 Ax 強手通常會 4bet）\n• AQ 是強 value，打大注最大化獲利\n• 雖然板面乾燥，但 3bet pot 中 OOP 用大注是正確的（不同於單挑底池用小注）\n來源：GTO Wizard "C-Betting OOP in 3-Bet Pots"',
    source: 'GTO Wizard: C-Betting OOP in 3-Bet Pots',
    marginal: false,
  },

  {
    id: 'hc-019',
    type: 'hardcoded',
    position: 'BB 3bet pot vs BTN（BB OOP，BTN check）',
    heroCards: 'Q♠Q♦',
    board: 'K♥5♦2♣',
    boardType: '乾燥彩虹，K 在場削弱超對',
    pot: '~22bb',
    facing: 'BTN check',
    question: '3bet pot，BB 持有 QQ（超對），K52 彩虹板。BTN check 給你，應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: '小注 25-33%',
    explanation:
      'K 在場讓 QQ 的優勢大幅削弱：\n• BTN 的 calling range 有大量 Kx 手牌（KQ、KJ、KT、K9s 等）\n• QQ 在此板只有超對，但很多 BTN 手牌已經 beat 你\n• 打大注面對 raise 你非常難受（不能 fold QQ，但可能已輸）\n• 小注控制底池，保留後手空間\n• 3bet pot 中 OOP 遇到不利板面，縮小下注或 check\n來源：GTO Wizard "C-Betting OOP in 3-Bet Pots" (100bb high SPR)',
    source: 'GTO Wizard: C-Betting OOP in 3-Bet Pots',
    marginal: true,
  },

  {
    id: 'hc-020',
    type: 'hardcoded',
    position: 'BB 3bet pot vs BTN（BB OOP，BTN check）',
    heroCards: 'A♣K♣',
    board: 'J♠T♠8♥',
    boardType: '超濕連張板，BTN range advantage',
    pot: '~22bb',
    facing: 'BTN check',
    question: '3bet pot，BB 持有 AK（no pair），JT8 兩色連張板。BTN check 給你，應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: 'Check',
    explanation:
      'JT8 連張板是 3bet pot 中 BB 最難 c-bet 的板型之一：\n• BTN 的 calling range 有大量 Qx、9x、7x 在此板 connect 很多\n• BB 的 3bet range 在此板沒有明顯優勢（AK 在 JT8 只有兩張高牌）\n• 打任何尺度都面臨被 check-raise 的風險，而你沒有強手應對\n• Check 保護你的 range，等 BTN 下注再決定\n• GTO Wizard：連張板是 OOP 3bettor 最少 c-bet 的板型\n來源：GTO Wizard "C-Betting OOP in 3-Bet Pots"',
    source: 'GTO Wizard: C-Betting OOP in 3-Bet Pots',
    marginal: true,
  },

  {
    id: 'hc-021',
    type: 'hardcoded',
    position: 'BB 3bet pot vs BTN（BB OOP，BTN check）',
    heroCards: 'A♥5♥',
    board: 'K♥K♦3♣',
    boardType: '對子板 King，BB range advantage 極大',
    pot: '~22bb',
    facing: 'BTN check',
    question: '3bet pot，BB 持有 A5（Ace high + backdoor flush），KK3 彩虹板。BTN check 給你，應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: '大注 67-75%',
    explanation:
      'KK3 板 BB 有壓倒性的 range advantage，A5 作為 bluff 大注：\n• BB 的 3bet range 有 KK、AA、AK，在此板都是極強手\n• BTN 幾乎沒有 K（有 K 通常會 4bet preflop）\n• BB 用強 range 的優勢打大注，A5 混在這個 range 裡是正確的 bluff\n• BTN 很難 call 大注，因為他在 KK3 板幾乎沒有強手\n• Backdoor flush draw 給 A5 一點後手價值\n來源：GTO Wizard "C-Betting OOP in 3-Bet Pots"',
    source: 'GTO Wizard: C-Betting OOP in 3-Bet Pots',
    marginal: true,
  },

  {
    id: 'hc-022',
    type: 'hardcoded',
    position: 'BB 3bet pot vs BTN（BB OOP，BTN check）',
    heroCards: 'K♠Q♠',
    board: 'K♦7♥2♣',
    boardType: '乾燥彩虹 King 高，3bet pot',
    pot: '~22bb',
    facing: 'BTN check',
    question: '3bet pot，BB 持有 KQ（頂對好踢腳），K72 彩虹板。BTN check 給你，應該怎麼做？',
    options: ['小注 25-33%', '大注 67-75%', 'Check'],
    correctAnswer: '大注 67-75%',
    explanation:
      'K72 乾燥板，BB 有頂對且 range advantage 大：\n• BB 3bet range 有 KK、AK、KQ 在此板都是強手\n• BTN 的 calling range 很少有 Kx（KQ、KJ 通常 4bet 或 fold preflop）\n• KQ 是強 value hand，大注提取最大 EV\n• 板面乾燥靜態，但 3bet pot 仍用大注（OOP 補償位置劣勢）\n來源：GTO Wizard "Crush 3-Bet Pots OOP"',
    source: 'GTO Wizard: Crush 3-Bet Pots OOP in Cash Games',
    marginal: false,
  },

  // ══════════════════════════════════════
  // TURN DECISIONS — BTN vs BB（IP raiser barrels turn）
  // Source: GTO Wizard "Principles of Turn Strategy",
  //         "The Art of Value Bluffing From the Button",
  //         "Betting Draws in Position: The Real Rules"
  // ══════════════════════════════════════

  {
    id: 'hc-t001',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑，翻牌後）',
    heroCards: 'A♠J♦',
    board: 'A♥7♦2♣ → K♠',
    boardType: '翻牌乾燥，轉牌 K（高張對 BTN 有利）',
    pot: '~12bb（翻牌小注後）',
    facing: 'BB check（轉牌）',
    question:
      '翻牌：A72 彩虹，BTN 小注 33%，BB call。\n轉牌：K♠（對 BTN 有利的高張）。\nBB check，BTN 持有 AJ（頂對），應該怎麼做？',
    options: ['大注 67-75%', '小注 33%', 'Check'],
    correctAnswer: '大注 67-75%',
    explanation:
      'K 轉牌對 BTN 極度有利：\n• BTN 的 range 有大量 Kx（KQ、KJ、KT 等），BB 幾乎沒有\n• 轉牌讓 BTN 的 range advantage 更大\n• 此時用大注，BB 的中等牌（7x、2x、pocket pair）很難繼續\n• AJ 有頂對，加上 K 轉牌讓你的 range 更強，是理想的大注 value\n來源：GTO Wizard "Principles of Turn Strategy"（高張轉牌對 IP raiser 有利 → 大注）',
    source: 'GTO Wizard: Principles of Turn Strategy',
    marginal: false,
  },

  {
    id: 'hc-t002',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑，翻牌後）',
    heroCards: 'K♠Q♦',
    board: 'K♥8♦4♣ → 2♠',
    boardType: '翻牌乾燥，轉牌磚（brick）',
    pot: '~12bb',
    facing: 'BB check（轉牌）',
    question:
      '翻牌：K84 彩虹，BTN 小注 33%，BB call。\n轉牌：2♠（完全的磚，不改變任何情況）。\nBB check，BTN 持有 KQ（頂對好踢），應該怎麼做？',
    options: ['大注 67-75%', '小注 33%', 'Check'],
    correctAnswer: 'Check',
    explanation:
      '磚轉牌後，IP raiser 的轉牌策略改變：\n• GTO Wizard 明確指出：小注翻牌 c-bet 後，磚轉牌的最常見動作是 Check\n• 翻牌已經用小注「探索」了，轉牌 check 讓 BB 繼續 bluff\n• KQ 頂對已經有 showdown value，不需要繼續建底池\n• Check 也保護你的 range（讓 BB 不知道你是強還是弱）\n來源：GTO Wizard "Principles of Turn Strategy"（33% 翻牌後，多數磚轉牌 = check）',
    source: 'GTO Wizard: Principles of Turn Strategy (33% flop cbet → check on brick turns)',
    marginal: true,
  },

  {
    id: 'hc-t003',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑，翻牌後）',
    heroCards: 'A♥K♥',
    board: 'K♥J♥7♦ → T♠',
    boardType: '半濕翻牌，轉牌完成直順',
    pot: '~18bb（翻牌大注後）',
    facing: 'BB check（轉牌）',
    question:
      '翻牌：KJ7 兩色，BTN 大注 67%，BB call。\n轉牌：T♠（完成 AQ、Q9、98 等直順）。\nBB check，BTN 持有 AK（頂對頂踢），應該怎麼做？',
    options: ['大注 67-75%', '小注 33%', 'Check'],
    correctAnswer: 'Check',
    explanation:
      '轉牌完成直順，AK 變成 bluff catcher：\n• T 讓 AQ、Q9、89 全都成了直順\n• BB 的 calling range 有大量這類手牌\n• AK 在此轉牌勝率大幅下降，繼續下注是送錢\n• Check 控制底池，如果 BB 下注再決定 call/fold\n• 大注翻牌後，危險轉牌 = check（踩剎車）\n來源：GTO Wizard "Principles of Turn Strategy"（完成直順/同花的轉牌 → check more）',
    source: 'GTO Wizard: Principles of Turn Strategy',
    marginal: true,
  },

  {
    id: 'hc-t004',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑，翻牌後）',
    heroCards: 'Q♠J♠',
    board: 'A♥9♦4♣ → Q♣',
    boardType: '乾燥翻牌，轉牌給 IP 中對',
    pot: '~12bb',
    facing: 'BB check（轉牌）',
    question:
      '翻牌：A94 彩虹，BTN 小注 33%，BB call。\n轉牌：Q♣（BTN 中了第二對）。\nBB check，BTN 持有 QJ（中對），應該怎麼做？',
    options: ['大注 67-75%', '小注 33%', 'Check'],
    correctAnswer: '小注 33%',
    explanation:
      'Q 轉牌給了你中對，但 A 還在場：\n• QJ 有中對，是薄 value 手牌\n• 但 BB 的 range 有大量 Ax（已經 beat 你）\n• 小注是最平衡的選擇：從 BB 的弱牌收錢，同時控制底池\n• 不用大注，因為 BB 的 Ax 不會 fold，你只是在輸更多\n• 轉牌小注 = 薄 value + 保留 showdown\n來源：GTO Wizard "Art of Value Bluffing" (small barrel with medium pairs on non-threatening turns)',
    source: 'GTO Wizard: The Art of Value Bluffing From the Button',
    marginal: true,
  },

  {
    id: 'hc-t005',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑，翻牌後）',
    heroCards: 'J♠T♦',
    board: 'A♥7♦2♣ → 9♠',
    boardType: '乾燥 Ace 高翻牌，轉牌 9（給 BTN straight draw）',
    pot: '~12bb',
    facing: 'BB check（轉牌）',
    question:
      '翻牌：A72 彩虹，BTN 小注 33%，BB call。\n轉牌：9♠（JT 現在有 OESD 聽牌）。\nBB check，BTN 持有 JT（沒有對子，但有 OESD），應該怎麼做？',
    options: ['大注 67-75%', '小注 33%', 'Check'],
    correctAnswer: 'Check',
    explanation:
      'JT 在 A72-9 板只有 OESD，沒有 showdown value：\n• GTO Wizard 數據：磚/乾燥轉牌後，draw 大約有 56% 的時間會 check（不是繼續 barrel）\n• JT 沒有對子，如果 BB call 你拿什麼去 showdown？\n• 翻牌小注後，Draw 在轉牌 check 更多，等免費看河牌\n• 如果你 barrel，BB 用 Ax 跟，你沒有 equity advantage\n• 重要觀念：draw 不是自動 barrel，要看整體 range 和 equity\n來源：GTO Wizard "Betting Draws in Position" (~56% of draws check on brick turns)',
    source: 'GTO Wizard: Betting Draws in Position (56% of draws check turn)',
    marginal: true,
  },

  {
    id: 'hc-t006',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑，翻牌後）',
    heroCards: 'K♦Q♣',
    board: 'A♠K♦Q♥ → J♠',
    boardType: '三張 Broadway，轉牌 J（完成直順）',
    pot: '~18bb（翻牌大注後）',
    facing: 'BB check（轉牌）',
    question:
      '翻牌：AKQ 彩虹，BTN 大注 67%，BB call。\n轉牌：J♠（任何 T 都成頂直順）。\nBB check，BTN 持有 KQ（兩對），應該怎麼做？',
    options: ['大注 67-75%', '小注 33%', 'Check'],
    correctAnswer: 'Check',
    explanation:
      'AKQ-J 板，任何 T 成頂直順，KQ 兩對很脆弱：\n• BB 的 calling range 有大量 JT、T9、KT、QT（全部聽直順）\n• KQ 雖然有兩對，但在這個板只能當 bluff catcher\n• 繼續下注面對 check-raise 你無法決策\n• Check 控制底池，等 BB 行動再決定\n• 原則：轉牌讓很多 draw 完成 → 減少下注頻率\n來源：GTO Wizard "Principles of Turn Strategy"（危險轉牌 = check more）',
    source: 'GTO Wizard: Principles of Turn Strategy',
    marginal: true,
  },

  // ══════════════════════════════════════
  // RIVER DECISIONS — BTN vs BB
  // ══════════════════════════════════════

  {
    id: 'hc-r001',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑，河牌）',
    heroCards: 'A♠J♦',
    board: 'A♥7♦2♣ → K♠ → 5♥',
    boardType: '乾燥板，河牌完全無害',
    pot: '~30bb（翻轉兩街下注後）',
    facing: 'BB check（河牌）',
    question:
      '翻牌小注，轉牌大注，BB 兩次跟注。\n河牌：5♥（無害的磚）。\nBB check，BTN 持有 AJ（頂對），應該怎麼做？',
    options: ['大注 67-75%', '小注 33%', 'Check'],
    correctAnswer: '大注 67-75%',
    explanation:
      '三街建底池的最後一街，用大注提取最大 value：\n• AJ 在 A7 2-K-5 板是強 value hand\n• BB 兩次跟注說明他有中等強度的手牌（Ax、Kx、pocket pair）\n• 河牌是磚，BTN 的 range advantage 沒有改變\n• 三街建底池的邏輯：翻牌小 → 轉牌中 → 河牌大（幾何成長）\n• 大注讓 BB 的 Kx、Ax 弱踢腳付出最高代價\n來源：GTO Wizard "Principles of GTO"（geometric sizing across streets）',
    source: 'GTO Wizard: Principles of GTO (geometric bet sizing)',
    marginal: false,
  },

  {
    id: 'hc-r002',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑，河牌）',
    heroCards: 'J♠9♦',
    board: 'Q♦6♥5♠ → K♠ → 2♣',
    boardType: '翻牌 miss，轉牌大注 bluff，河牌磚',
    pot: '~30bb',
    facing: 'BB check（河牌）',
    question:
      '翻牌 bluff 小注，轉牌大注繼續 bluff，BB 兩次跟注。\n河牌：2♣（磚）。\nBB check，BTN 持有 J9（什麼都沒中），應該怎麼做？',
    options: ['大注 67-75% bluff', '小注 33% bluff', 'Check'],
    correctAnswer: 'Check',
    explanation:
      '三街連續 bluff 失敗，河牌放棄：\n• BB 兩次跟注說明他有 call-down 的手牌（不太可能被 bluff 下去）\n• J9 完全沒有 showdown value，河牌 bluff 只是燒錢\n• 重要原則：對手兩次跟注後，你的 bluff 成功率大幅下降\n• Check behind 偶爾還能贏（如果 BB 也是空氣）\n• 三街連續 bluff 需要對手能 fold，BB 跟注兩次表示他不打算 fold\n來源：GTO Wizard "Principles of GTO"（bluff frequency on river）',
    source: 'GTO Wizard: Principles of GTO',
    marginal: true,
  },

  {
    id: 'hc-r003',
    type: 'hardcoded',
    position: 'BTN vs BB（單挑，河牌）',
    heroCards: 'A♦Q♦',
    board: 'K♥J♦7♣ → T♠ → 2♥',
    boardType: '轉牌完成直順後，河牌磚',
    pot: '~25bb（翻牌大注，轉牌 check）',
    facing: 'BB check（河牌）',
    question:
      '翻牌大注 67%，BB call。轉牌 T（完成直順），BTN check。\n河牌：2♥（磚）。BB check，BTN 持有 AQ（頂對踢腳），應該怎麼做？',
    options: ['大注 67-75%', '小注 33%', 'Check'],
    correctAnswer: '小注 33%',
    explanation:
      '轉牌 check 後，河牌薄 value 小注：\n• 轉牌 check 讓你的 range 包含很多中等手牌（AQ、AJ、KQ 等）\n• 河牌 2 是磚，AQ 頂對在此板仍有 showdown value\n• 小注讓 BB 的弱 pair 和 bluff catcher 繼續付錢\n• 大注太激進：BB 在 K-J-7-T-2 板跟注兩街，只會用強手繼續\n• 轉牌 check 後的河牌 = 使用小注或 check（不用大注）\n來源：GTO Wizard "Principles of Turn Strategy" + "Principles of GTO"',
    source: 'GTO Wizard: Principles of Turn/River Strategy',
    marginal: true,
  },

  // ══════════════════════════════════════
  // BB DEFENSE vs BTN C-BET（Check-Raise vs Call vs Fold）
  // Source: GTO Wizard "Defending vs BB Check-Raise on Paired Flops"
  //         "Flop Heuristics for Defending the Blinds"
  // ══════════════════════════════════════

  {
    id: 'hc-cr001',
    type: 'hardcoded',
    position: 'BB 防守 vs BTN 小注（Check-Raise 情境）',
    heroCards: '7♠6♠',
    board: '7♥5♣2♦',
    boardType: '低牌連張，BB range advantage',
    pot: '5.5bb',
    facing: 'BTN 小注 33%（約 1.8bb）',
    question: '752 彩虹低牌板，BB 持有 76s（頂對 + OESD + flush draw）。面對 BTN 33% 小注，應該怎麼做？',
    options: ['Check-Raise', 'Call', 'Fold'],
    correctAnswer: 'Check-Raise',
    explanation:
      '76s 在 752 板是 check-raise 的理想手牌：\n• 有頂對（7）+ 開放式直順聽牌（4 或 8 成直順）+ 同花聽牌\n• 低牌板是 BB 的 range advantage 板面，有大量 5x、6x、7x 手牌\n• GTO Wizard：BB 在低牌連張板 check-raise 頻率明顯高於一般板面\n• 76s 有足夠的 equity 即使被 re-raise 也不用太擔心\n• 強手 + draw 組合 = 最佳 check-raise 候選\n來源：GTO Wizard "Flop Heuristics for Defending the Blinds"',
    source: 'GTO Wizard: Flop Heuristics for Defending the Blinds',
    marginal: true,
  },

  {
    id: 'hc-cr002',
    type: 'hardcoded',
    position: 'BB 防守 vs BTN 小注（Check-Raise 情境）',
    heroCards: '9♦8♦',
    board: '9♥7♣2♠',
    boardType: '低牌板，BB 有頂對',
    pot: '5.5bb',
    facing: 'BTN 小注 33%（約 1.8bb）',
    question: '972 彩虹板，BB 持有 98（頂對 + gutshot）。面對 BTN 33% 小注，應該怎麼做？',
    options: ['Check-Raise', 'Call', 'Fold'],
    correctAnswer: 'Call',
    explanation:
      '98 在 972 板選擇 Call 而不是 Check-Raise：\n• 98 有頂對但 kicker 弱，board 不是最有利的低牌板\n• Check-Raise 需要更強的手牌或更好的 draw（76 有 OESD，98 只有 gutshot）\n• Call 最平衡：保留 showdown value，讓 BTN 繼續 bluff\n• 在此板 check-raise 太激進，BTN 有大量 Tx、Jx 手牌在此有強 equity\n• 原則：頂對 weak kicker + 弱 draw = Call，不是 Check-Raise\n來源：GTO Wizard "Defending the Blinds" (check-raise needs strong hand + strong draw)',
    source: 'GTO Wizard: Flop Heuristics for Defending the Blinds',
    marginal: true,
  },

  {
    id: 'hc-cr003',
    type: 'hardcoded',
    position: 'BB 防守 vs BTN 小注（Check-Raise 情境）',
    heroCards: 'K♣Q♣',
    board: 'K♥7♦2♣',
    boardType: '乾燥 King 高板，BTN range advantage',
    pot: '5.5bb',
    facing: 'BTN 小注 33%（約 1.8bb）',
    question: 'K72 彩虹板，BB 持有 KQ（頂對好踢腳）。面對 BTN 33% 小注，應該怎麼做？',
    options: ['Check-Raise', 'Call', 'Fold'],
    correctAnswer: 'Call',
    explanation:
      'K72 乾燥板是 BTN 的有利板面，BB 選擇 Call：\n• BTN 在 K 高乾燥板有強 range advantage（很多 Kx）\n• BB 的 KQ 雖然是頂對，但 check-raise 會 fold 掉 BTN 的弱牌，只留下強牌\n• Call 讓 BTN 繼續 bluff，你用 KQ 來 bluff-catch\n• GTO Wizard：BB 在 K/A 高乾燥板 check-raise 頻率很低\n• 原則：BTN range advantage 的板面 = BB check-raise 少，call 多\n來源：GTO Wizard "Flop Heuristics" (BB check-raises less on high card boards)',
    source: 'GTO Wizard: Flop Heuristics for Defending the Blinds',
    marginal: true,
  },

  {
    id: 'hc-cr004',
    type: 'hardcoded',
    position: 'BB 防守 vs BTN 小注（Check-Raise 情境）',
    heroCards: '5♥5♦',
    board: '5♠7♣2♦',
    boardType: '低牌板，BB 暗牌三條',
    pot: '5.5bb',
    facing: 'BTN 小注 33%（約 1.8bb）',
    question: '572 彩虹板，BB 持有 55（底部三條！）。面對 BTN 33% 小注，應該怎麼做？',
    options: ['Check-Raise', 'Call', 'Fold'],
    correctAnswer: 'Check-Raise',
    explanation:
      '55 在 572 板是底部三條，是 check-raise 的強 value 手牌：\n• 三條是超強手牌，在低牌板對 BTN 的 range 有壓倒性優勢\n• Check-raise 讓 BTN 的 Ax、Kx、pocket pair 付出更高代價\n• 也平衡了你的 check-raise range（有強牌才能有 bluff）\n• 低牌板是 BB 少數可以主動進攻的板面\n• 不要慢打（slowplay）三條，因為 BTN 的 bluff 在低牌板不多\n來源：GTO Wizard "Defending vs BB Check-Raise on Paired Flops" + "Attacking Paired Flops"',
    source: 'GTO Wizard: Attacking Paired Flops from the BB',
    marginal: false,
  },

  // ══════════════════════════════════════
  // BB FACING C-BET — FOLD 情境
  // ══════════════════════════════════════

  {
    id: 'hc-cr005',
    type: 'hardcoded',
    position: 'BB 防守 vs BTN 大注',
    heroCards: 'T♦9♦',
    board: 'A♥K♦7♣',
    boardType: '乾燥 Ace-King 高板',
    pot: '5.5bb',
    facing: 'BTN 大注 67%（約 3.7bb）',
    question: 'AK7 彩虹板，BB 持有 T9（什麼都沒中）。面對 BTN 大注 67%，應該怎麼做？',
    options: ['Check-Raise', 'Call', 'Fold'],
    correctAnswer: 'Fold',
    explanation:
      'AK7 板面對大注，T9 直接 fold：\n• T9 在 AK7 板沒有任何 pair 或 draw\n• BTN 大注代表強手（Ax、Kx、overpair）\n• T9 對這個 range 勝率不到 25%，Call 是虧損的\n• GTO Wizard：BB 對高牌大注的 fold 頻率很高\n• 即使有 backdoor draw，面對大注也不夠好到 call\n來源：GTO Wizard "Flop Heuristics Defending the Blinds"（high card board + large bet = fold more）',
    source: 'GTO Wizard: Flop Heuristics for Defending the Blinds',
    marginal: true,
  },

  // ══════════════════════════════════════
  // DONK BET（BB 主動下注）
  // Source: GTO Wizard "All you need to know about our solutions"
  // ══════════════════════════════════════

  {
    id: 'hc-d001',
    type: 'hardcoded',
    position: 'BB 主動下注（Donk Bet）情境',
    heroCards: '6♠5♠',
    board: '7♥5♦3♣',
    boardType: '低牌連張，BB range advantage',
    pot: '5.5bb',
    facing: 'BTN 沒有下注（preflop raiser 先到翻牌）',
    question: '753 彩虹低牌板，BB 持有 65（中對 + OESD）。BB 應該主動下注（donk）還是 check？',
    options: ['主動小注 Donk 25-33%', 'Check（等 BTN 下注）'],
    correctAnswer: 'Check（等 BTN 下注）',
    explanation:
      '即使在 BB 有利的低牌板，仍然 check 為主：\n• GTO Wizard 明確：BB 在低牌板偶爾 donk（約 25% 頻率），但主要還是 check\n• 65 有中對 + draw，是 check-raise 的好手牌，不是 donk 的手牌\n• Check 讓 BTN c-bet，你再 check-raise，比 donk 更有效\n• Donk bet 會讓你的 range 失去平衡，BTN 很容易 read\n• 原則：低牌板優先 check-raise，不是 donk\n來源：GTO Wizard "All you need to know about our solutions" (donk is rare, ~25% on low boards)',
    source: 'GTO Wizard: All you need to know about our solutions',
    marginal: true,
  },

  {
    id: 'hc-d002',
    type: 'hardcoded',
    position: 'BB 主動下注（Donk Bet）情境',
    heroCards: 'A♣Q♦',
    board: 'A♥K♦9♣',
    boardType: '高牌板，BTN range advantage',
    pot: '5.5bb',
    facing: 'BTN 沒有下注',
    question: 'AK9 彩虹高牌板，BB 持有 AQ（頂對好踢腳）。BB 應該主動下注（donk）還是 check？',
    options: ['主動下注 Donk', 'Check（等 BTN 下注）'],
    correctAnswer: 'Check（等 BTN 下注）',
    explanation:
      '高牌板 BB 幾乎永遠 check：\n• GTO Wizard 明確：BB 在高牌板（Ace/King 高）donk 頻率接近 0%\n• AK9 是 BTN 的有利板面，BB donk 會讓你的 range 失去保護\n• AQ 頂對：check 讓 BTN c-bet，你再 call/raise，比 donk 更好\n• Donk 只適合 BB 有 range advantage 的低牌板（753、654 等）\n• 原則：高牌板 BB 永遠 check，等 preflop raiser 行動\n來源：GTO Wizard "All you need to know" (BB checks 100% on high card boards)',
    source: 'GTO Wizard: All you need to know about our solutions',
    marginal: false,
  },

  {
    id: 'hc-d003',
    type: 'hardcoded',
    position: 'BB 主動下注（Donk Bet）情境',
    heroCards: '8♥7♥',
    board: '6♠5♦4♣',
    boardType: '低牌連張，BB 有直順',
    pot: '5.5bb',
    facing: 'BTN 沒有下注',
    question: '654 彩虹連張板，BB 持有 87（頂部直順！）。BB 應該主動下注（donk）還是 check？',
    options: ['主動小注 Donk 25-33%', 'Check（等 BTN 下注）'],
    correctAnswer: 'Check（等 BTN 下注）',
    explanation:
      '即使有頂部直順，仍然 check 更好：\n• 87 已經成了最強的直順（87 在 654 是頂部直順）\n• Check 讓 BTN c-bet，你可以 check-raise 或 call，保留更多主動性\n• Donk 讓 BTN 的弱牌全部 fold，你只能贏小底池\n• Check-raise 可以讓 BTN 付出更多代價，同時迷惑對手\n• GTO Wizard：即使在低牌連張板，強手也主要用 check-raise，不是 donk\n來源：GTO Wizard "All you need to know" + "Attacking Paired Flops from BB"',
    source: 'GTO Wizard: All you need to know about our solutions',
    marginal: true,
  },

  // ══════════════════════════════════════
  // BTN 面對 BB CHECK-RAISE 的應對
  // Source: GTO Wizard "Defending vs BB Check-Raise on Paired Flops"
  // ══════════════════════════════════════

  {
    id: 'hc-cr006',
    type: 'hardcoded',
    position: 'BTN 面對 BB Check-Raise',
    heroCards: 'A♠J♦',
    board: '7♥5♣2♦',
    boardType: '低牌板，BB check-raise',
    pot: '~8bb（翻牌小注後）',
    facing: 'BB check-raise 到約 5bb',
    question:
      '752 彩虹板，BTN 小注 33%，BB check-raise 到 5bb。BTN 持有 AJ（沒中，只有兩張高牌）。應該怎麼做？',
    options: ['3-Bet', 'Call', 'Fold'],
    correctAnswer: 'Fold',
    explanation:
      'AJ 在 752 板面對 check-raise，直接 fold：\n• AJ 在低牌板沒有 pair 也沒有 draw\n• BB 的 check-raise range 在此板有強 value（76s、55、77、低牌兩對）\n• AJ 對這個 range 勝率不到 30%\n• 即使有 backdoor draw，賠率也不夠好到 call\n• 原則：低牌板面對 check-raise，沒有連接性的高牌直接 fold\n來源：GTO Wizard "Defending vs BB Check-Raise"',
    source: 'GTO Wizard: Defending vs BB Check-Raise on Paired Flops',
    marginal: true,
  },

  {
    id: 'hc-cr007',
    type: 'hardcoded',
    position: 'BTN 面對 BB Check-Raise',
    heroCards: 'K♠K♦',
    board: '7♥5♣2♦',
    boardType: '低牌板，BB check-raise',
    pot: '~8bb',
    facing: 'BB check-raise 到約 5bb',
    question:
      '752 彩虹板，BTN 小注 33%，BB check-raise 到 5bb。BTN 持有 KK（超對）。應該怎麼做？',
    options: ['3-Bet（4-Bet）', 'Call', 'Fold'],
    correctAnswer: 'Call',
    explanation:
      'KK 面對低牌板 check-raise，選擇 Call：\n• KK 是超對，有很強的 equity（約 70%+）\n• 但低牌板是 BB 的有利板面，check-raise range 有大量強手\n• 3-bet 太冒進：BB 的 check-raise 包含 sets 和兩對，你可能被 re-raise 到尷尬位置\n• Call 保留你的 range balance 和位置優勢\n• 原則：超對面對低牌板 check-raise = Call，等後街再決定\n來源：GTO Wizard "Defending vs BB Check-Raise"（overpairs prefer call vs low board check-raises）',
    source: 'GTO Wizard: Defending vs BB Check-Raise on Paired Flops',
    marginal: true,
  },

  // ══════════════════════════════════════
  // SQUEEZE PLAY 擠壓（翻前多人底池）
  // Source: GTO Wizard "How To Construct a Squeezing Range"
  //         "Responding to BB Squeezes"
  //         "Playing In Position Against Two Callers"
  // ══════════════════════════════════════

  {
    id: 'hc-sq001',
    type: 'hardcoded',
    position: 'BB Squeeze（CO 開，BTN call，BB 行動）',
    heroCards: 'A♠K♦',
    board: '',
    boardType: '翻前 Squeeze 情境',
    pot: '~7.5bb（CO 2.5bb + BTN call + SB fold）',
    facing: 'CO 開池 2.5bb，BTN call，輪到 BB',
    question: 'CO 開池，BTN call，BB 持有 AK。BB 應該怎麼做？',
    options: ['Squeeze 3bet', 'Call', 'Fold'],
    correctAnswer: 'Squeeze 3bet',
    explanation:
      'AK 在 CO 開、BTN call 的情況下是標準 squeeze：\n• Squeeze 有雙重目的：用強牌建底池 + 把 BTN（capped range）擠出去\n• BTN call 的 range 是 capped（有強牌早就 3bet 了），很容易被 squeeze 擠走\n• CO 開的 range 也要面對 BTN 可能的 cold call，他也很難繼續\n• AK 是純 value squeeze，即使兩人都 call 也有優勢\n• GTO Wizard：BB 在有 caller 的情況下 squeeze 頻率更高\n來源：GTO Wizard "How To Construct a Squeezing Range"',
    source: 'GTO Wizard: How To Construct a Squeezing Range',
    marginal: false,
  },

  {
    id: 'hc-sq002',
    type: 'hardcoded',
    position: 'BB Squeeze（BTN 開，SB call，BB 行動）',
    heroCards: 'J♠T♠',
    board: '',
    boardType: '翻前 Squeeze 情境',
    pot: '~7bb（BTN 2.5bb + SB call）',
    facing: 'BTN 開池 2.5bb，SB call，輪到 BB',
    question: 'BTN 開池，SB call，BB 持有 JTs。BB 應該怎麼做？',
    options: ['Squeeze 3bet', 'Call', 'Fold'],
    correctAnswer: 'Squeeze 3bet',
    explanation:
      'JTs 在 BTN 開、SB call 的情況下是好的 squeeze bluff：\n• SB call 讓底池更大，squeeze 獲利空間更高\n• JTs 有 playability（flush draw、straight draw），被 call 後不是純空氣\n• SB 的 calling range 是 capped，很容易被擠出去\n• GTO Wizard：suited connectors 是理想的 squeeze bluff 候選（有 blockers + playability）\n• Call 反而不好：多人底池 OOP 很難實現 equity\n來源：GTO Wizard "How To Construct a Squeezing Range"',
    source: 'GTO Wizard: How To Construct a Squeezing Range',
    marginal: true,
  },

  {
    id: 'hc-sq003',
    type: 'hardcoded',
    position: 'BB Squeeze（CO 開，BTN call，BB 行動）',
    heroCards: '7♦6♦',
    board: '',
    boardType: '翻前 Squeeze 情境',
    pot: '~7.5bb',
    facing: 'CO 開池 2.5bb，BTN call，輪到 BB',
    question: 'CO 開池，BTN call，BB 持有 76s。BB 應該怎麼做？',
    options: ['Squeeze 3bet', 'Call', 'Fold'],
    correctAnswer: 'Call',
    explanation:
      '76s 在此情況選擇 Call 而不是 Squeeze：\n• 76s 是 call 的手牌：多人底池有隱含賠率（implied odds）\n• Squeeze 後如果被 call，76s 在 3bet pot 裡很難打\n• GTO Wizard：BB squeeze range 是 linear（強牌），不是像 BvB 那樣的極化 range\n• 76s 在 squeeze range 的底部，call 多人底池看翻牌更有價值\n• 如果要 squeeze bluff，用 A5s、A4s（有 blocker）比 76s 更好\n來源：GTO Wizard "Playing In Position Against Two Callers"',
    source: 'GTO Wizard: Playing In Position Against Two Callers',
    marginal: true,
  },

  {
    id: 'hc-sq004',
    type: 'hardcoded',
    position: 'BTN 面對 BB Squeeze（CO 開 fold，輪到 BTN）',
    heroCards: 'Q♠J♠',
    board: '',
    boardType: '翻前面對 Squeeze',
    pot: '~15bb（BB squeeze 後）',
    facing: 'BB squeeze 到約 11bb，CO fold，輪到 BTN',
    question: 'CO 開池，BTN call，BB squeeze 到 11bb，CO fold。BTN 持有 QJs，應該怎麼做？',
    options: ['4bet', 'Call', 'Fold'],
    correctAnswer: 'Call',
    explanation:
      'QJs 面對 BB squeeze，選擇 Call：\n• QJs 夠強可以繼續（不是 fold），但不夠強到 4bet\n• BB squeeze range 很強，4bet bluff QJs 太冒進\n• Call 後有位置優勢（BTN IP），QJs 多人底池有 playability\n• GTO Wizard：BTN call BB squeeze 的 range 包含 suited broadways 和 medium pairs\n• 如果 CO 也 call，就是多人底池，QJs 的 set mining 和 draw 價值更高\n來源：GTO Wizard "Responding to BB Squeezes"',
    source: 'GTO Wizard: Responding to BB Squeezes',
    marginal: true,
  },

  // ══════════════════════════════════════
  // SB 翻前策略（SB 面對 BTN 開池）
  // Source: GTO Wizard "Crush 3-Bet Pots OOP in Cash Games"
  // ══════════════════════════════════════

  {
    id: 'hc-sb001',
    type: 'hardcoded',
    position: 'SB 面對 BTN 開池',
    heroCards: 'T♥9♥',
    board: '',
    boardType: '翻前 SB 防守',
    pot: '~3bb',
    facing: 'BTN 開池 2.5bb，輪到 SB',
    question: 'BTN 開池 2.5bb，SB 持有 T9s。SB 應該怎麼做？',
    options: ['3bet', 'Call', 'Fold'],
    correctAnswer: '3bet',
    explanation:
      'SB 面對 BTN 開池，T9s 選擇 3bet：\n• GTO Wizard 明確：SB 幾乎不 call（barely calls anything），主要 3bet 或 fold\n• 原因：call 後 BB 可能 squeeze，讓你 OOP 在三人底池裡\n• T9s 有足夠的 playability 作為 3bet bluff（flush draw、straight draw）\n• SB 的 3bet range 在對抗廣 BTN range 時可以相當寬\n• Call T9s 是常見錯誤：OOP 多人底池 equity 實現率很低\n來源：GTO Wizard "Crush 3-Bet Pots OOP" (SB barely calls, almost exclusively 3-bet or fold)',
    source: 'GTO Wizard: Crush 3-Bet Pots OOP in Cash Games',
    marginal: true,
  },

  {
    id: 'hc-sb002',
    type: 'hardcoded',
    position: 'SB 面對 BTN 開池',
    heroCards: '8♠7♠',
    board: '',
    boardType: '翻前 SB 防守',
    pot: '~3bb',
    facing: 'BTN 開池 2.5bb，輪到 SB',
    question: 'BTN 開池 2.5bb，SB 持有 87s。SB 應該怎麼做？',
    options: ['3bet', 'Call', 'Fold'],
    correctAnswer: 'Fold',
    explanation:
      'SB 面對 BTN 開池，87s 選擇 Fold：\n• SB 幾乎不 call，主要 3bet 或 fold\n• 87s 雖然是好牌，但作為 SB 3bet bluff 稍弱（比 T9s 差）\n• 3bet 後如果被 call 或 4bet，87s 面對 BTN 的 4bet 很難\n• BTN 開池 range 廣，但 87s OOP 3bet 的 fold equity 有限\n• 邊緣情況：87s 可以 3bet（混合策略），但 fold 也是合理選擇\n• 如果要 3bet SB，優先選有 blocker 的手牌（A5s、K5s）\n來源：GTO Wizard "Crush 3-Bet Pots OOP"（SB strategy: 3bet or fold, 87s is borderline fold）',
    source: 'GTO Wizard: Crush 3-Bet Pots OOP in Cash Games',
    marginal: true,
  },

  // ══════════════════════════════════════
  // 多人底池翻後（CO 開，BTN call，BB call）
  // Source: GTO Wizard "Playing In Position Against Two Callers"
  // ══════════════════════════════════════

  {
    id: 'hc-mw001',
    type: 'hardcoded',
    position: 'CO vs BTN vs BB（三人底池）',
    heroCards: 'A♣K♣',
    board: 'A♥7♦2♣',
    boardType: '乾燥 Ace 高板，多人底池',
    pot: '~8bb（三人底池）',
    facing: 'BTN check，BB check，輪到 CO',
    question:
      'CO 開池，BTN 和 BB 都 call，三人底池。翻牌 A72 彩虹，兩人都 check 給 CO。CO 持有 AK，應該怎麼做？',
    options: ['大注 67%', '小注 33%', 'Check'],
    correctAnswer: '小注 33%',
    explanation:
      '多人底池 c-bet 頻率下降，使用小注：\n• GTO Wizard：CO 在多人底池 c-bet 頻率比單挑少 11%\n• 多人底池每個對手都可能有強牌，大注風險太高\n• AK 有頂對，值得薄 value 下注，但要控制底池大小\n• 小注讓弱手（Ax 低踢腳、pocket pair）繼續付錢\n• 多人底池的 c-bet 原則：頻率降低 + size 縮小\n來源：GTO Wizard "Playing In Position Against Two Callers" (LJ cbets 11% less multiway)',
    source: 'GTO Wizard: Playing In Position Against Two Callers',
    marginal: true,
  },

  {
    id: 'hc-mw002',
    type: 'hardcoded',
    position: 'CO vs BTN vs BB（三人底池）',
    heroCards: 'K♦Q♦',
    board: 'J♠T♥8♣',
    boardType: '濕板連張，多人底池',
    pot: '~8bb',
    facing: 'BTN check，BB check，輪到 CO',
    question:
      'CO 開池，BTN 和 BB 都 call，三人底池。翻牌 JT8 彩虹連張，兩人都 check 給 CO。CO 持有 KQ（OESD），應該怎麼做？',
    options: ['大注 67%', '小注 33%', 'Check'],
    correctAnswer: 'Check',
    explanation:
      '多人底池濕板，CO 應該 check：\n• JT8 連張板在多人底池對 CO 不利（BTN 和 BB 都有大量中牌）\n• 多人底池 c-bet 本來就少，連張板更應該 check\n• KQ 雖然有 OESD（聽牌），但在多人底池打 bluff 成功率很低\n• 兩個對手都可能有強手，下注後被 call 或 raise 的風險很高\n• Check 保留 free card 看轉牌的機會\n來源：GTO Wizard "Playing In Position Against Two Callers"（connected boards = more checking）',
    source: 'GTO Wizard: Playing In Position Against Two Callers',
    marginal: true,
  },

  // ══════════════════════════════════════
  // RIVER PLAY — 更多情境
  // Source: GTO Wizard "Principles of River Play"
  //         "From Gutshots to Airballs: Choosing Your Bluffs"
  //         "The Art of Bluff Catching"
  // ══════════════════════════════════════

  {
    id: 'hc-rv001',
    type: 'hardcoded',
    position: 'BTN vs BB（河牌，BTN IP）',
    heroCards: 'K♣2♣',
    board: 'A♠9♣7♥ → 2♠ → 5♦',
    boardType: '翻牌小注，轉牌磚，河牌磚',
    pot: '~20bb（翻牌小注 call，轉牌下注 call）',
    facing: 'BB check（河牌）',
    question:
      '翻牌 A97 彩虹，BTN 小注。轉牌 2（BTN 中了底對），繼續下注。河牌 5（磚）。\nBB check，BTN 持有 K2（底對），應該怎麼做？',
    options: ['大注 bluff', '小注 value', 'Check'],
    correctAnswer: '大注 bluff',
    explanation:
      'GTO Wizard 明確：K2 在 A97-2-5 板是純 bluff bet（大注）：\n• K2 的底對（2 pair）在此板沒有 showdown value（A 高板，BB 有大量 Ax）\n• K 有 blocker 效果（阻擋 BB 的 Kx bluff catcher）\n• 三街建底池後，K2 作為 bluff 的 fold equity 很高\n• GTO Wizard 文章明確列出：K♣2♣ 在此情境是「純 bet」\n• 原則：沒有 showdown value + 有 blocker = 理想 river bluff\n來源：GTO Wizard "From Gutshots to Airballs" (K♣2♣ = pure bet on A97-2 turn)',
    source: 'GTO Wizard: From Gutshots to Airballs: Choosing Your Bluffs',
    marginal: true,
  },

  {
    id: 'hc-rv002',
    type: 'hardcoded',
    position: 'BTN vs BB（河牌，BTN IP）',
    heroCards: 'J♣T♣',
    board: 'A♠9♣7♥ → 2♠ → 5♦',
    boardType: '翻牌小注，轉牌磚，河牌磚',
    pot: '~20bb',
    facing: 'BB check（河牌）',
    question:
      '翻牌 A97，BTN 小注。轉牌 2，BTN 繼續下注。河牌 5（磚）。\nBB check，BTN 持有 JT（完全沒中，只有 backdoor draw 未實現），應該怎麼做？',
    options: ['大注 bluff', '小注 bluff', 'Check'],
    correctAnswer: 'Check',
    explanation:
      'GTO Wizard 明確：JT 在此情境是「純 check」：\n• JT 沒有 blocker 效果（不阻擋 BB 的 strong hands）\n• JT 有 showdown value（偶爾能贏小底池）\n• Bluff 沒有意義：JT 在 A97-2-5 板 fold equity 不高\n• GTO Wizard 文章列出：J♣T♣ = pure check\n• 關鍵原則：有 showdown value = check；沒有 blocker = check\n來源：GTO Wizard "From Gutshots to Airballs" (J♣T♣ = pure check on A97-2 turn)',
    source: 'GTO Wizard: From Gutshots to Airballs: Choosing Your Bluffs',
    marginal: true,
  },

  {
    id: 'hc-rv003',
    type: 'hardcoded',
    position: 'BTN vs BB（河牌，BTN IP）',
    heroCards: '5♠4♠',
    board: 'A♠9♣7♥ → 2♠ → 5♦',
    boardType: '翻牌小注，轉牌磚，河牌 5',
    pot: '~20bb',
    facing: 'BB check（河牌）',
    question:
      '翻牌 A97，BTN 小注。轉牌 2。河牌 5，BTN 中了底部兩對（54）。\nBB check，BTN 持有 54s，應該怎麼做？',
    options: ['大注 value', '小注 value', 'Check'],
    correctAnswer: '大注 value',
    explanation:
      '54s 在此河牌中了兩對，選大注 value：\n• 54 在 A97-2-5 板有底部兩對（5 和 4），是強手\n• GTO Wizard 文章明確：5♠4♠ 在此情境是「高頻 bet」（pure bet）\n• 兩對在 A 高板是 strong value，大注讓 BB 的 Ax、pair 付費\n• 河牌改善了你的手牌，從 draw 變成兩對，積極下注\n• 原則：河牌讓你從弱牌變強牌 → 轉換為 value bet\n來源：GTO Wizard "From Gutshots to Airballs" (5♠4♠ = pure bet on this river)',
    source: 'GTO Wizard: From Gutshots to Airballs: Choosing Your Bluffs',
    marginal: true,
  },

  {
    id: 'hc-rv004',
    type: 'hardcoded',
    position: 'BB 面對 BTN 河牌大注（Bluff Catch 決策）',
    heroCards: 'K♠8♦',
    board: 'A♥T♦6♥ → 4♠ → 2♥',
    boardType: '三街下注，河牌完成 flush',
    pot: '~45bb（三街建底池後）',
    facing: 'BTN all-in shove（約 200% pot）',
    question:
      '翻牌大注，轉牌大注，河牌 2♥（完成 flush）。BTN all-in shove 200% pot。BB 持有 K8（second pair，沒有 flush）。應該怎麼做？',
    options: ['Call（bluff catch）', 'Fold'],
    correctAnswer: 'Fold',
    explanation:
      'K8 面對三街 all-in，應該 fold：\n• GTO Wizard 在此情境：K8 是 fold（不是 bluff catcher）\n• 河牌完成 flush，BB 沒有 flush，勝率大幅下降\n• 200% pot 的 all-in 要求約 33% 勝率才能 call，K8 在此板不到 25%\n• GTO Wizard 文章明確：BB call 是以強手為主（two pair+），K8 在此是 fold\n• 原則：面對三街 all-in + 完成 flush 的板面，沒有強手應該 fold\n來源：GTO Wizard "The Art of Bluff Catching" (BB folds K8 vs river shove on flush board)',
    source: 'GTO Wizard: The Art of Bluff Catching',
    marginal: true,
  },

  {
    id: 'hc-rv005',
    type: 'hardcoded',
    position: 'BB 面對 BTN 河牌大注（Bluff Catch 決策）',
    heroCards: 'A♦9♣',
    board: 'A♥T♦6♥ → 4♠ → 2♥',
    boardType: '三街下注，河牌完成 flush',
    pot: '~45bb',
    facing: 'BTN 大注 75% pot',
    question:
      '翻牌大注，轉牌大注，河牌 2♥（完成 flush）。BTN 下注 75% pot。BB 持有 A9（頂對，但沒有 flush）。應該怎麼做？',
    options: ['Call', 'Fold'],
    correctAnswer: 'Call',
    explanation:
      'A9 頂對面對 75% pot，是 bluff catcher：\n• A9 有頂對，勝率約 35-40%（考慮 BTN 的 bluff 頻率）\n• 面對 75% pot，需要約 43% 勝率...但 BTN 的 bluff 頻率讓 call 有利可圖\n• BTN 三街連續下注的 range 包含大量 bluff（miss draw、air）\n• A9 是 GTO 明確的 call 範圍，是理想的 bluff catcher\n• 原則：有 showdown value（頂對）+ 合理的賠率 = call bluff catcher\n來源：GTO Wizard "The Art of Bluff Catching"（top pair = bluff catcher on river）',
    source: 'GTO Wizard: The Art of Bluff Catching',
    marginal: true,
  },

  // ══════════════════════════════════════
  // TURN BLUFF 選擇
  // Source: GTO Wizard "From Gutshots to Airballs"
  // 明確數據：K2（airball）= pure bet；JT（has showdown）= pure check
  // ══════════════════════════════════════

  {
    id: 'hc-tb001',
    type: 'hardcoded',
    position: 'BTN vs BB（轉牌 bluff 選擇）',
    heroCards: '6♥5♥',
    board: 'A♠9♣7♥ → 2♠',
    boardType: '翻牌小注後，轉牌磚',
    pot: '~12bb',
    facing: 'BB check（轉牌）',
    question:
      '翻牌 A97 彩虹，BTN 小注，BB call。轉牌 2（磚）。\nBB check，BTN 持有 65（gutshot + 弱 equity）。應該怎麼做？',
    options: ['下注 bluff', 'Check'],
    correctAnswer: 'Check',
    explanation:
      'GTO Wizard 明確：65 在此情境是「純 check」：\n• 65 有 gutshot（聽 8 或 3 成直順），但 equity 不高\n• 更重要：65 有 showdown value（偶爾能贏小底池）\n• Bluff 反而會損失：如果 BB call，你的 equity 不夠高\n• GTO Wizard 文章：6♥5♥ 在 A97-2 轉牌 = pure check\n• 原則：有 showdown value 的 draw = check，讓免費看河牌\n來源：GTO Wizard "From Gutshots to Airballs" (6♥5♥ = pure check on A97-2)',
    source: 'GTO Wizard: From Gutshots to Airballs: Choosing Your Bluffs',
    marginal: true,
  },

  {
    id: 'hc-tb002',
    type: 'hardcoded',
    position: 'BTN vs BB（轉牌 bluff 選擇）',
    heroCards: 'A♥4♥',
    board: 'A♠9♣7♥ → 2♠',
    boardType: '翻牌小注後，轉牌磚',
    pot: '~12bb',
    facing: 'BB check（轉牌）',
    question:
      '翻牌 A97 彩虹，BTN 小注，BB call。轉牌 2（磚）。\nBB check，BTN 持有 A4（頂對 weak kicker + backdoor nut flush draw）。應該怎麼做？',
    options: ['下注（value/保護）', 'Check'],
    correctAnswer: '下注（value/保護）',
    explanation:
      'GTO Wizard 明確：A4 在此情境是「純 bet」：\n• A4 有頂對，是 value bet 候選\n• Backdoor nut flush draw 給你額外的 equity\n• A 的 blocker 效果讓你的 bet range 更平衡\n• BB 的 range 有大量 9x、7x 可以 call 並被你 beat\n• GTO Wizard 文章：A♥4♥ 在 A97-2 轉牌 = pure bet\n來源：GTO Wizard "From Gutshots to Airballs" (A♥4♥ = pure bet on A97-2)',
    source: 'GTO Wizard: From Gutshots to Airballs: Choosing Your Bluffs',
    marginal: true,
  },

  // ══════════════════════════════════════
  // PROBE BET（BB 在轉牌主動下注）
  // Source: GTO Wizard "Principles of River Play"
  // ══════════════════════════════════════

  {
    id: 'hc-pb001',
    type: 'hardcoded',
    position: 'BB vs BTN（翻牌 check through，轉牌 BB probe）',
    heroCards: 'T♥9♥',
    board: 'A♥7♦2♣ → T♠',
    boardType: '翻牌 check through，轉牌給 BB 中對',
    pot: '~5.5bb（翻牌沒有下注）',
    facing: '轉牌 T，BB 先行動',
    question:
      '翻牌 A72 彩虹，BTN check（沒有 c-bet），BB 也 check。轉牌 T，BB 先行動。BB 持有 T9（中對），應該怎麼做？',
    options: ['Probe 下注 50-67%', 'Check'],
    correctAnswer: 'Probe 下注 50-67%',
    explanation:
      '翻牌 check through 後，BB 在轉牌積極 probe：\n• BTN 翻牌沒有 c-bet，說明他的 range 比較弱（沒有強牌 c-bet）\n• 轉牌 T 對 BB 很好：BB 的 range 有大量 Tx 手牌\n• T9 中對在此板是強手，應該主動建底池\n• BTN check 後，BB 的 range advantage 增加，probe bet 有利\n• 原則：IP 放棄 c-bet 後 = OOP 可以 probe bet，特別是有利的轉牌\n來源：GTO Wizard "Principles of River Play" + probe bet theory',
    source: 'GTO Wizard: Principles of Turn Strategy (probe betting)',
    marginal: true,
  },

  {
    id: 'hc-pb002',
    type: 'hardcoded',
    position: 'BB vs BTN（翻牌 check through，轉牌 BB probe）',
    heroCards: 'Q♦J♦',
    board: 'A♥7♦2♣ → 5♠',
    boardType: '翻牌 check through，轉牌磚',
    pot: '~5.5bb',
    facing: '轉牌 5，BB 先行動',
    question:
      '翻牌 A72 彩虹，BTN check（沒有 c-bet），BB 也 check。轉牌 5（磚），BB 先行動。BB 持有 QJ（沒中）。應該怎麼做？',
    options: ['Probe 下注', 'Check'],
    correctAnswer: 'Check',
    explanation:
      'QJ 在 A72-5 磚轉牌選擇 check：\n• QJ 在 A 高板沒有 pair，是純空氣\n• 雖然 BTN 沒有 c-bet，但 probe bluff 需要更好的 semi-bluff 手牌\n• QJ 沒有 draw，probe bluff 面對 call 後沒有後手\n• 適合 probe 的手牌：有中對、有 draw、有 blocker 效果的牌\n• QJ 等免費看河牌，偶爾能配對贏底池\n來源：GTO Wizard "Probe Betting" article（probe needs equity or blockers）',
    source: 'GTO Wizard: Probe Betting Strategy',
    marginal: true,
  },

  // ══════════════════════════════════════
  // River sizing
  // Source: GTO Wizard "Principles of River Play" + solutions notes
  // ══════════════════════════════════════

  {
    id: 'hc-rs001',
    type: 'hardcoded',
    position: 'BTN vs BB（河牌 value bet sizing）',
    heroCards: 'A♠K♦',
    board: 'A♥7♦2♣ → 5♠ → 9♣',
    boardType: '乾燥板，三條街 range-bet 後',
    pot: '~35bb',
    facing: 'BB check（河牌）',
    question:
      '翻牌小注，轉牌小注（BB 兩次 call）。河牌 9（磚）。BB check。BTN 持有 AK（頂對）。應該如何下注？',
    options: ['大注 75-100%', '小注 33%', 'Check'],
    correctAnswer: '大注 75-100%',
    explanation:
      '三街建底池的終點，用大注提取最大 value：\n• BB 兩次跟注說明他有 showdown 的手牌（Ax、pocket pair、7x）\n• 河牌磚，board 沒有改變，AK 的優勢完整保留\n• 大注讓 BB 的 Ax 弱踢腳和 pocket pair 面臨困難決策\n• 幾何下注原則：翻牌小 → 轉牌小 → 河牌大，讓 BB 無法輕易 fold\n來源：GTO Wizard "Principles of River Play" (geometric sizing)',
    source: 'GTO Wizard: Principles of River Play',
    marginal: true,
  },

  {
    id: 'hc-rs002',
    type: 'hardcoded',
    position: '4bet pot — BTN vs BB 翻後（BTN 4bettor IP）',
    heroCards: 'A♠A♦',
    board: 'K♥7♦2♣',
    boardType: '乾燥板，4bet pot（SPR 很低）',
    pot: '~40bb（4bet pot）',
    facing: 'BB check',
    question: '4bet pot，BB call，翻牌 K72 彩虹。BB check。BTN 持有 AA（超對）。應該如何下注？',
    options: ['大注 67%+', '小注 13-20%', 'Check'],
    correctAnswer: '小注 13-20%',
    explanation:
      '4bet pot 翻後用極小注：\n• GTO Wizard 明確：4bet pot 最常用的 c-bet size 是 13% pot（極小）\n• 原因：SPR 極低（約 1.5-2），雙方都很難 fold，小注讓 BB 繼續付費\n• AA 在 K72 板有強 value，但 BB 的 range 包含 KK、KQ 等強手\n• 小注探索，如果 BB raise 你可以決定是否全壓\n• 4bet pot 原則：乾燥板用極小注，濕板才考慮較大\n來源：GTO Wizard "All you need to know about our solutions" (4bet pot: 13% most used)',
    source: 'GTO Wizard: All you need to know about our solutions',
    marginal: true,
  },

  {
    id: 'hc-rs003',
    type: 'hardcoded',
    position: 'BTN vs BB（河牌 overbet 情境）',
    heroCards: 'A♠K♠',
    board: 'A♣K♦Q♥ → J♦ → 2♣',
    boardType: 'Broadway 板，BTN 有頂部兩對',
    pot: '~30bb',
    facing: 'BB check（河牌）',
    question:
      '翻牌大注，轉牌大注（BB 兩次跟注）。河牌 2（磚）。BB check。BTN 持有 AK（頂部兩對）。應該怎麼做？',
    options: ['Overbet 125%+', '大注 75%', '小注 33%'],
    correctAnswer: 'Overbet 125%+',
    explanation:
      'AK 在 AKQJ2 板可以 overbet：\n• BTN 在此板有 nuts advantage（AA、KK、AK 在此板都是頂部）\n• BB 的 range 在兩次跟注後主要是 bluff catcher（Qx、Jx、中等牌）\n• Overbet 強迫 BB 的 bluff catcher 做困難決策：他需要 33% 勝率才能 call\n• AK 在 AKQJ2 板幾乎不被 beat（只輸給直順 T9）\n• GTO Wizard：nuts advantage 的 river = overbet 是最優策略\n來源：GTO Wizard "Principles of River Play" (nuts advantage → overbet)',
    source: 'GTO Wizard: Principles of River Play',
    marginal: true,
  },

  {
    id: 'hc-tb003',
    type: 'hardcoded',
    position: 'BB 防守 vs BTN 兩街下注',
    heroCards: 'K♠9♦',
    board: 'A♥9♦3♣ → K♣',
    boardType: '轉牌給 BB 中了 two pair',
    pot: '~25bb（翻牌 + 轉牌下注後）',
    facing: 'BTN 轉牌大注 67%',
    question:
      '翻牌 A93，BTN 小注，BB call。轉牌 K，BB 中了兩對（K9）。BTN 大注 67%。BB 應該怎麼做？',
    options: ['Check-Raise', 'Call', 'Fold'],
    correctAnswer: 'Check-Raise',
    explanation:
      'K9 轉牌中了兩對，是 check-raise 的強手：\n• 轉牌 K 給了 BB 強手（兩對），應該積極進攻\n• BTN 的大注在此板代表強 Ax 或 bluff，你的 K9 在 A93-K 板 beat 很多手牌\n• Check-raise 讓 BTN 的 Ax 做困難決策（call 還是 fold？）\n• 不 raise 就是讓 BTN 免費繼續 bluff 到河牌\n• 原則：轉牌中了強手（two pair+）面對大注 = check-raise\n來源：GTO Wizard turn check-raise principles',
    source: 'GTO Wizard: Turn Check-Raise Heuristics',
    marginal: true,
  },

  {
    id: 'hc-tb004',
    type: 'hardcoded',
    position: 'BB 防守 vs BTN 兩街下注',
    heroCards: 'Q♦J♦',
    board: 'A♥9♦3♣ → K♣',
    boardType: '轉牌高張，BB 沒有中',
    pot: '~25bb',
    facing: 'BTN 轉牌大注 67%',
    question:
      '翻牌 A93，BTN 小注，BB call。轉牌 K（BTN 有利的高張）。BTN 大注 67%。BB 持有 QJ（沒中）。應該怎麼做？',
    options: ['Check-Raise', 'Call', 'Fold'],
    correctAnswer: 'Fold',
    explanation:
      'QJ 在 A93-K 板沒有 pair 也沒有 draw，面對大注直接 fold：\n• 轉牌 K 對 BTN 極度有利（他的 range 有大量 Kx）\n• QJ 在此板勝率不到 20%，面對大注賠率完全不夠\n• 即使有 backdoor straight draw，也不足以 call 大注\n• BTN 兩街大注代表強 range，不是 bluff 的好時機\n• 原則：沒有 pair 沒有 draw 面對兩街大注 = fold\n來源：GTO Wizard "Principles of Turn Strategy"',
    source: 'GTO Wizard: Principles of Turn Strategy',
    marginal: true,
  },
]
