import { useCallback, useEffect, useState } from 'react'
import type { WeakSpot } from '../utils/weakSpots'

const STORAGE_KEY = 'gto-weak-spots'
const MAX_WEAK_SPOTS = 50

function spotMatches(
  s: WeakSpot,
  mode: string,
  position: string,
  handIdx?: number,
  questionId?: string,
): boolean {
  if (s.mode !== mode || s.position !== position) return false
  if (handIdx !== undefined) return s.handIdx === handIdx
  if (questionId !== undefined) return s.questionId === questionId
  return false
}

/**
 * 弱點間隔複習：localStorage 讀寫、記錄答題、抽弱點手牌／題目。
 */
export function useWeakSpots() {
  const [spots, setSpots] = useState<WeakSpot[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as WeakSpot[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(spots))
  }, [spots])

  const recordResult = useCallback(
    (
      mode: string,
      position: string,
      correct: boolean,
      handIdx?: number,
      questionId?: string,
    ) => {
      setSpots((prev) => {
        const existing = prev.find((s) => spotMatches(s, mode, position, handIdx, questionId))

        if (correct) {
          if (!existing) return prev
          const updated = { ...existing, wrongCount: existing.wrongCount - 1 }
          if (updated.wrongCount <= 0) {
            return prev.filter((s) => s !== existing)
          }
          return prev.map((s) => (s === existing ? updated : s))
        }

        if (existing) {
          return prev.map((s) =>
            s === existing
              ? { ...s, wrongCount: s.wrongCount + 1, lastWrong: Date.now() }
              : s,
          )
        }

        const newSpot: WeakSpot = {
          mode,
          position,
          wrongCount: 1,
          lastWrong: Date.now(),
          ...(handIdx !== undefined ? { handIdx } : {}),
          ...(questionId !== undefined ? { questionId } : {}),
        }
        const next = [...prev, newSpot]
        if (next.length > MAX_WEAK_SPOTS) {
          next.sort((a, b) => b.lastWrong - a.lastWrong)
          return next.slice(0, MAX_WEAK_SPOTS)
        }
        return next
      })
    },
    [],
  )

  const getWeakSpotsForMode = useCallback(
    (mode: string): WeakSpot[] =>
      spots.filter((s) => s.mode === mode).sort((a, b) => b.wrongCount - a.wrongCount),
    [spots],
  )

  const pickWeakHandForMode = useCallback(
    (mode: string, position: string): number | null => {
      const candidates = spots.filter(
        (s) => s.mode === mode && s.position === position && s.handIdx !== undefined,
      )
      if (candidates.length === 0) return null
      const top = candidates.reduce((a, b) => (a.wrongCount > b.wrongCount ? a : b))
      return top.handIdx ?? null
    },
    [spots],
  )

  const pickWeakQuestionIdForMode = useCallback(
    (mode: string): string | null => {
      const candidates = spots.filter((s) => s.mode === mode && s.questionId !== undefined)
      if (candidates.length === 0) return null
      const top = candidates.reduce((a, b) => (a.wrongCount > b.wrongCount ? a : b))
      return top.questionId ?? null
    },
    [spots],
  )

  const clearMode = useCallback((mode: string) => {
    setSpots((prev) => prev.filter((s) => s.mode !== mode))
  }, [])

  const clearAll = useCallback(() => {
    setSpots([])
  }, [])

  return {
    spots,
    recordResult,
    getWeakSpotsForMode,
    pickWeakHandForMode,
    pickWeakQuestionIdForMode,
    clearMode,
    clearAll,
  }
}

export type { WeakSpot } from '../utils/weakSpots'
