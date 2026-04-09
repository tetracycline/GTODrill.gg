/**
 * 將題目的 position 正規化成可統計的鍵值（與語系無關；以繁中題庫字串為準）。
 */
export function normalizePositionKey(position: string): string {
  if (position.includes('BB 防守') && position.includes('大注')) return 'bb-defense-vs-btn-large-cbet'
  if (position.includes('BB 防守')) return 'bb-defense-vs-btn-small-cbet'
  if (position.includes('翻牌大注後，轉牌')) return 'ai-turn-barrel-after-large-flop'
  if (position.includes('翻牌小注後，轉牌')) return 'ai-turn-barrel-after-small-flop'
  if (position.includes('主動下注') || position.includes('Donk')) return 'bb-donk-bet-spot'
  if (position.includes('面對 BB Squeeze')) return 'btn-facing-bb-squeeze'
  if (position.includes('BB Squeeze')) return 'bb-squeeze-spot'
  if (position.includes('SB 面對 BTN')) return 'sb-vs-btn-open'
  if (position.includes('多人底池')) return 'multiway-co-btn-bb'
  if (position.includes('BB 面對 BTN 河牌')) return 'bb-river-bluffcatch'
  if (position.includes('BTN vs BB（河牌')) return 'btn-river-ip'
  if (position.includes('BB vs BTN（翻牌 check through') || position.includes('轉牌 BB probe')) {
    return 'bb-probe-turn'
  }
  if (position.includes('轉牌 bluff')) return 'btn-turn-bluff-select'
  if (position.includes('三人底池') || position.includes('CO vs BTN vs BB')) return 'multiway-co-btn-bb'
  if (position.includes('轉牌 probe') || position.includes('BB probe')) return 'bb-probe-turn'
  if (position.includes('BTN 面對 BB')) return 'btn-facing-bb-checkraise'
  if (position.includes('3bet')) return 'bb-3bet-vs-btn-oop'
  if (position.includes('UTG vs BB')) return 'utg-vs-bb-oop'
  if (position.includes('SB vs BB')) return 'sb-vs-bb-oop'
  if (position.includes('CO vs BB')) return 'co-vs-bb-ip'
  if (position.includes('BTN vs BB')) return 'btn-vs-bb-ip'
  if (position.includes('河牌 value bet sizing')) return 'river-value-sizing'
  if (position.includes('4bet pot')) return 'fourbet-pot-flop'
  if (position.includes('河牌 overbet')) return 'river-overbet'
  if (position.includes('BB 防守 vs BTN 兩街')) return 'bb-vs-btn-two-street'
  return 'other'
}
