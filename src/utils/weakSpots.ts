import { handName } from './ranges'

/** localStorage 弱點項目 */
export interface WeakSpot {
  mode: string
  handIdx?: number
  questionId?: string
  position: string
  wrongCount: number
  lastWrong: number
}

/** 側邊欄／統計用的模式 id */
export const WEAK_SPOT_TRACKED_MODES = [
  'rfi',
  'vsrfi',
  'bvb',
  'vs3bet',
  'vs4bet',
  'cold4bet',
  'pushfold',
  'postflop-cbet',
] as const

export type WeakSpotTrackedMode = (typeof WEAK_SPOT_TRACKED_MODES)[number]

/**
 * UI 顯示用模式中文名稱。
 */
export function weakSpotModeLabel(mode: string): string {
  const map: Record<string, string> = {
    rfi: 'RFI 訓練',
    vsrfi: 'VS RFI',
    bvb: 'BvB 訓練',
    vs3bet: 'VS 3BET',
    vs4bet: 'VS 4BET',
    cold4bet: 'Cold 4-Bet',
    pushfold: 'Push Fold',
    'postflop-cbet': '翻後 C-Bet',
  }
  return map[mode] ?? mode
}

/**
 * 手牌索引轉矩陣名稱（如 AKs）。
 */
export function weakSpotHandLabel(handIdx: number): string {
  const r = Math.floor(handIdx / 13)
  const c = handIdx % 13
  return handName(r, c)
}

/**
 * 某模式下弱點筆數。
 */
export function countWeakSpotsForMode(spots: readonly WeakSpot[], mode: string): number {
  return spots.filter((s) => s.mode === mode).length
}

/**
 * 依每日進度計算模式準確率（%）；無資料回傳 null。
 */
export function modeAccuracyPercent(
  byMode: Record<string, { total: number; correct: number }> | undefined,
  mode: string,
): number | null {
  const row = byMode?.[mode]
  if (!row || row.total <= 0) return null
  return Math.round((row.correct / row.total) * 100)
}
