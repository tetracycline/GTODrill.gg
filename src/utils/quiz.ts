import type { OpponentType } from '../types/opponentType'
import { getCorrectRFIAction, handIndex } from './ranges'

/**
 * 依真實組合權重抽樣 0–168 矩陣索引：
 * 對子 6、同花 4、不同花 12（總權重 1326）。
 */
export function randomHandWeighted(): number {
  const weights: { idx: number; w: number }[] = []
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const idx = handIndex(r, c)
      if (r === c) weights.push({ idx, w: 6 })
      else if (r < c) weights.push({ idx, w: 4 })
      else weights.push({ idx, w: 12 })
    }
  }
  const total = weights.reduce((s, x) => s + x.w, 0)
  let rand = Math.random() * total
  for (const { idx, w } of weights) {
    rand -= w
    if (rand <= 0) return idx
  }
  return 0
}

const RFI_POSITION_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const

/**
 * 以「邊緣牌」為主的 RFI 抽樣：
 * - 提高與下一位置答案不同的牌（學習位置寬度差）。
 * - 提高前後位置邊界牌（raise/fold 臨界區）。
 * - 大幅降低全位置都同答案的明顯題。
 *
 * @param position - 目前練習位置
 * @param opponentType - 桌型（會反映 fish/nit 調整後答案）
 */
export function randomRfiHandBiased(position: string, opponentType: OpponentType): number {
  const posIdx = RFI_POSITION_ORDER.indexOf(position as (typeof RFI_POSITION_ORDER)[number])
  if (posIdx < 0) return randomHandWeighted()

  const prevPos = posIdx > 0 ? RFI_POSITION_ORDER[posIdx - 1] : null
  const nextPos = posIdx < RFI_POSITION_ORDER.length - 1 ? RFI_POSITION_ORDER[posIdx + 1] : null

  const weights: { idx: number; w: number }[] = []
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const idx = handIndex(r, c)
      const comboBase = r === c ? 6 : r < c ? 4 : 12
      const cur = getCorrectRFIAction(idx, position, opponentType)

      const prev = prevPos ? getCorrectRFIAction(idx, prevPos, opponentType) : null
      const next = nextPos ? getCorrectRFIAction(idx, nextPos, opponentType) : null

      const differsFromNext = next != null && next !== cur
      const boundaryWithPrev = prev != null && prev !== cur
      const boundaryWithNext = next != null && next !== cur

      let w = comboBase

      // 與下一位置差異牌：優先加權（使用者最常混淆）
      if (differsFromNext) w *= 4.5

      // 前後位置邊界牌：額外加權
      if (boundaryWithPrev || boundaryWithNext) w *= 2.5

      // 若全位置皆同答案，視為「過於明顯」題目，極低權重
      const first = getCorrectRFIAction(idx, RFI_POSITION_ORDER[0], opponentType)
      let sameAcrossAll = true
      for (let i = 1; i < RFI_POSITION_ORDER.length; i++) {
        if (getCorrectRFIAction(idx, RFI_POSITION_ORDER[i], opponentType) !== first) {
          sameAcrossAll = false
          break
        }
      }
      if (sameAcrossAll) w *= 0.05

      // 保底避免權重歸零，維持極小機率多樣性
      if (w < 0.01) w = 0.01

      weights.push({ idx, w })
    }
  }

  const total = weights.reduce((s, x) => s + x.w, 0)
  let rand = Math.random() * total
  for (const { idx, w } of weights) {
    rand -= w
    if (rand <= 0) return idx
  }
  return randomHandWeighted()
}
