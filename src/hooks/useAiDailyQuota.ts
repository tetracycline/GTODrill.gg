import { useCallback } from 'react'

const STORAGE_KEY = 'gto-ai-coach-daily-quota'
const FREE_LIMIT = 5

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function readCount(): { date: string; count: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: todayStr(), count: 0 }
    const o = JSON.parse(raw) as { date?: string; count?: number }
    const d = typeof o.date === 'string' ? o.date : todayStr()
    const c = typeof o.count === 'number' && o.count >= 0 ? o.count : 0
    if (d !== todayStr()) return { date: todayStr(), count: 0 }
    return { date: d, count: c }
  } catch {
    return { date: todayStr(), count: 0 }
  }
}

function writeCount(date: string, count: number) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date, count }))
}

/**
 * 非 Pro 使用者 AI 教練每日可發送之使用者訊息次數（本地計數）。
 */
export function useAiDailyQuota(isUnlimited: boolean) {
  const canSend = useCallback(() => isUnlimited || readCount().count < FREE_LIMIT, [isUnlimited])

  const recordUserMessage = useCallback(() => {
    if (isUnlimited) return
    const t = todayStr()
    const cur = readCount()
    const base = cur.date === t ? cur.count : 0
    writeCount(t, base + 1)
  }, [isUnlimited])

  const getRemaining = useCallback(() => {
    if (isUnlimited) return Infinity
    const c = readCount()
    if (c.date !== todayStr()) return FREE_LIMIT
    return Math.max(0, FREE_LIMIT - c.count)
  }, [isUnlimited])

  return { canSend, recordUserMessage, getRemaining, freeLimit: FREE_LIMIT }
}
