import { handIndex } from './ranges'

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
