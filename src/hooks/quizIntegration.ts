/**
 * 跨測驗整合：弱點記錄與每日進度回呼（可選）。
 */
export type QuizRecordMeta = {
  handIdx?: number
  questionId?: string
}

export type QuizIntegrationOptions = {
  /**
   * 答錯時寫入弱點；答對時遞減或移除。
   */
  onRecordResult?: (
    mode: string,
    position: string,
    correct: boolean,
    meta?: QuizRecordMeta,
  ) => void
  /** 每答一題更新今日練習量 */
  onDailyAnswer?: (mode: string, correct: boolean) => void
  /** 僅從弱點池抽題 */
  weakReviewOnly?: boolean
  /** 依模式與位置取弱點手牌索引（preflop） */
  pickWeakHand?: (mode: string, position: string) => number | null
  /** 依模式取弱點硬編碼翻後題 id */
  pickWeakQuestionId?: (mode: string) => string | null
}
