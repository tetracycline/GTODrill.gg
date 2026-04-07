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
  /**
   * 若回傳 false，該題不計分、不寫入弱點／每日進度（例如免費額度用盡）。
   *
   * @param mode - 測驗模式 id。
   */
  allowAnswer?: (mode: string) => boolean
  /**
   * 當 {@link allowAnswer} 拒絕作答時觸發（可開啟升級提示）。
   *
   * @param mode - 測驗模式 id。
   */
  onAnswerDenied?: (mode: string) => void
  /** 僅從弱點池抽題 */
  weakReviewOnly?: boolean
  /** 依模式與位置取弱點手牌索引（preflop） */
  pickWeakHand?: (mode: string, position: string) => number | null
  /** 依模式取弱點硬編碼翻後題 id */
  pickWeakQuestionId?: (mode: string) => string | null
}
