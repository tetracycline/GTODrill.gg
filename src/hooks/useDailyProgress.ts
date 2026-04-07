import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'gto-daily-progress'
const DEFAULT_DAILY_TARGET = 100

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface DailyProgress {
  date: string
  total: number
  correct: number
  byMode: Record<string, { total: number; correct: number }>
}

/**
 * 今日練習量與準確率；跨日自動歸零。
 */
export function useDailyProgress() {
  const [target, setTarget] = useState(() => {
    try {
      const raw = localStorage.getItem('gto-daily-target')
      const n = raw ? parseInt(raw, 10) : DEFAULT_DAILY_TARGET
      return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_TARGET
    } catch {
      return DEFAULT_DAILY_TARGET
    }
  })

  const [progress, setProgress] = useState<DailyProgress>(() => {
    const todayStr = getTodayStr()
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { date: todayStr, total: 0, correct: 0, byMode: {} }
      const saved = JSON.parse(raw) as DailyProgress
      if (saved.date !== todayStr) {
        return { date: todayStr, total: 0, correct: 0, byMode: {} }
      }
      return saved
    } catch {
      return { date: todayStr, total: 0, correct: 0, byMode: {} }
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  useEffect(() => {
    localStorage.setItem('gto-daily-target', String(target))
  }, [target])

  /** 跨午夜或長開分頁時校正日期 */
  useEffect(() => {
    const tick = () => {
      const t = getTodayStr()
      setProgress((p) => (p.date !== t ? { date: t, total: 0, correct: 0, byMode: {} } : p))
    }
    const id = window.setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  const recordAnswer = useCallback((mode: string, correct: boolean) => {
    setProgress((prev) => {
      const today = getTodayStr()
      const base = prev.date === today ? prev : { date: today, total: 0, correct: 0, byMode: {} }
      const modeStats = base.byMode[mode] ?? { total: 0, correct: 0 }
      return {
        ...base,
        total: base.total + 1,
        correct: base.correct + (correct ? 1 : 0),
        byMode: {
          ...base.byMode,
          [mode]: {
            total: modeStats.total + 1,
            correct: modeStats.correct + (correct ? 1 : 0),
          },
        },
      }
    })
  }, [])

  const accuracy = progress.total > 0 ? Math.round((progress.correct / progress.total) * 100) : 0

  const pct = Math.min(100, Math.round((progress.total / target) * 100))

  return { progress, recordAnswer, accuracy, pct, target, setTarget }
}
