/** 需 Pro（或管理員）才可使用的訓練模式 id。 */
const PRO_ONLY_MODE_IDS = [
  'bvb',
  'vs3bet',
  'vs4bet',
  'cold4bet',
  'weakspots',
  'hand-history',
  'ai-coach',
] as const

const PRO_ONLY_SET = new Set<string>(PRO_ONLY_MODE_IDS)

/** 免費／訪客每日翻後 C-Bet 可作答題數上限。 */
export const FREE_POSTFLOP_ANSWERS_PER_DAY = 10

/**
 * 是否為僅 Pro 解鎖之模式。
 *
 * @param mode - 訓練模式 id。
 */
export function isProOnlyMode(mode: string): boolean {
  return PRO_ONLY_SET.has(mode)
}
