/**
 * 翻後硬編碼題：曾答錯的題目 id，供抽題加權（與錯題本分開儲存）。
 */
const STORAGE_KEY = 'gto-trainer-postflop-wrong-ids'

/**
 * 從 localStorage 讀取曾答錯的硬編碼翻後題 id 集合。
 *
 * @returns 題目 id 的 Set，讀取失敗時為空集合
 */
export function loadPostflopWrongHardcodedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is string => typeof x === 'string' && x.length > 0))
  } catch {
    return new Set()
  }
}

/**
 * 將曾答錯題 id 集合寫回 localStorage。
 *
 * @param ids - 要保存的題目 id
 */
export function persistPostflopWrongHardcodedIds(ids: ReadonlySet<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    /* quota 或隱私模式等略過 */
  }
}

/**
 * 翻後：依位置累積的錯誤次數（用於位置加權抽題）。
 */
const POSITION_STORAGE_KEY = 'gto-trainer-postflop-wrong-by-position'

/**
 * 位置錯誤次數表。key 為標準化後的位置鍵值。
 */
export type PostflopWrongByPosition = Record<string, number>

/**
 * 讀取位置錯誤次數。
 *
 * @returns 位置錯誤次數映射，失敗時回傳空物件
 */
export function loadPostflopWrongByPosition(): PostflopWrongByPosition {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw) as unknown
    if (!obj || typeof obj !== 'object') return {}
    const out: PostflopWrongByPosition = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) continue
      out[k] = Math.floor(v)
    }
    return out
  } catch {
    return {}
  }
}

/**
 * 保存位置錯誤次數。
 *
 * @param map - 位置錯誤次數映射
 */
export function persistPostflopWrongByPosition(map: PostflopWrongByPosition): void {
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* quota 或隱私模式等略過 */
  }
}
