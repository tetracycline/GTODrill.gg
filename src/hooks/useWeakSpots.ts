import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
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
 * 遠端列轉為本地 {@link WeakSpot}。
 */
function rowToSpot(r: {
  mode: string
  position: string
  hand_idx: number | null
  question_id: string | null
  wrong_count: number | null
  last_wrong_at: string
}): WeakSpot {
  return {
    mode: r.mode,
    position: r.position,
    wrongCount: r.wrong_count ?? 1,
    lastWrong: new Date(r.last_wrong_at).getTime(),
    ...(r.hand_idx != null ? { handIdx: r.hand_idx } : {}),
    ...(r.question_id ? { questionId: r.question_id } : {}),
  }
}

/**
 * 合併本地與雲端弱點（取較高錯誤次數；同分取較新時間）。
 */
function mergeWeakSpots(local: WeakSpot[], remote: WeakSpot[]): WeakSpot[] {
  const key = (s: WeakSpot) =>
    s.questionId != null ? `q:${s.mode}:${s.questionId}` : `h:${s.mode}:${s.position}:${String(s.handIdx)}`
  const map = new Map<string, WeakSpot>()
  for (const s of local) map.set(key(s), { ...s })
  for (const s of remote) {
    const k = key(s)
    const cur = map.get(k)
    if (
      !cur ||
      s.wrongCount > cur.wrongCount ||
      (s.wrongCount === cur.wrongCount && s.lastWrong > cur.lastWrong)
    ) {
      map.set(k, s)
    }
  }
  const arr = [...map.values()].sort((a, b) => b.lastWrong - a.lastWrong)
  return arr.slice(0, MAX_WEAK_SPOTS)
}

type WeakRemoteOp =
  | { kind: 'none' }
  | { kind: 'delete_question'; questionId: string }
  | { kind: 'delete_hand'; handIdx: number }
  | {
      kind: 'upsert'
      wrong_count: number
      handIdx: number | undefined
      questionId: string | undefined
    }

/**
 * 純函式：計算下一筆弱點列表與應同步至遠端的操作。
 */
function applyWeakSpotRecord(
  prev: WeakSpot[],
  mode: string,
  position: string,
  correct: boolean,
  handIdx: number | undefined,
  questionId: string | undefined,
  hasRemoteUser: boolean,
): { next: WeakSpot[]; weakOp: WeakRemoteOp } {
  const existing = prev.find((s) => spotMatches(s, mode, position, handIdx, questionId))

  if (correct) {
    if (!existing) return { next: prev, weakOp: { kind: 'none' } }
    const updated = { ...existing, wrongCount: existing.wrongCount - 1 }
    if (updated.wrongCount <= 0) {
      let weakOp: WeakRemoteOp = { kind: 'none' }
      if (hasRemoteUser) {
        if (questionId !== undefined && questionId !== '') {
          weakOp = { kind: 'delete_question', questionId }
        } else if (handIdx !== undefined) {
          weakOp = { kind: 'delete_hand', handIdx }
        }
      }
      return { next: prev.filter((s) => s !== existing), weakOp }
    }
    if (hasRemoteUser) {
      return {
        next: prev.map((s) => (s === existing ? updated : s)),
        weakOp: {
          kind: 'upsert',
          wrong_count: updated.wrongCount,
          handIdx,
          questionId,
        },
      }
    }
    return { next: prev.map((s) => (s === existing ? updated : s)), weakOp: { kind: 'none' } }
  }

  if (existing) {
    const nextCount = existing.wrongCount + 1
    const weakOp: WeakRemoteOp = hasRemoteUser
      ? { kind: 'upsert', wrong_count: nextCount, handIdx, questionId }
      : { kind: 'none' }
    return {
      next: prev.map((s) =>
        s === existing ? { ...s, wrongCount: nextCount, lastWrong: Date.now() } : s,
      ),
      weakOp,
    }
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
  const trimmed =
    next.length > MAX_WEAK_SPOTS
      ? [...next].sort((a, b) => b.lastWrong - a.lastWrong).slice(0, MAX_WEAK_SPOTS)
      : next

  const weakOp: WeakRemoteOp = hasRemoteUser
    ? { kind: 'upsert', wrong_count: 1, handIdx, questionId }
    : { kind: 'none' }

  return { next: trimmed, weakOp }
}

/**
 * 將弱點變更同步至 `weak_spots`。
 */
async function syncWeakSpotRemote(
  userId: string,
  mode: string,
  position: string,
  handIdx: number | undefined,
  questionId: string | undefined,
  op: WeakRemoteOp,
) {
  if (!supabase || op.kind === 'none') return

  const isQuestion = questionId !== undefined && questionId !== ''

  if (op.kind === 'delete_question') {
    await supabase
      .from('weak_spots')
      .delete()
      .eq('user_id', userId)
      .eq('mode', mode)
      .eq('question_id', op.questionId)
    return
  }

  if (op.kind === 'delete_hand') {
    await supabase
      .from('weak_spots')
      .delete()
      .eq('user_id', userId)
      .eq('mode', mode)
      .eq('position', position)
      .eq('hand_idx', op.handIdx)
    return
  }

  const row = {
    user_id: userId,
    mode,
    position,
    hand_idx: handIdx ?? null,
    question_id: questionId ?? null,
    wrong_count: op.wrong_count,
    last_wrong_at: new Date().toISOString(),
  }

  if (isQuestion) {
    await supabase.from('weak_spots').upsert(row, { onConflict: 'user_id,mode,question_id' })
  } else if (handIdx !== undefined) {
    await supabase.from('weak_spots').upsert(row, { onConflict: 'user_id,mode,position,hand_idx' })
  }
}

/**
 * 寫入答題紀錄至 `quiz_results`。
 */
async function insertQuizResult(
  userId: string,
  mode: string,
  position: string,
  correct: boolean,
  handIdx?: number,
  questionId?: string,
) {
  if (!supabase) return
  await supabase.from('quiz_results').insert({
    user_id: userId,
    mode,
    position,
    hand_idx: handIdx ?? null,
    question_id: questionId ?? null,
    correct,
  })
}

/**
 * 弱點間隔複習：localStorage 快取；登入時與 Supabase 合併並即時同步。
 */
export function useWeakSpots() {
  const { user } = useAuth()
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

  useEffect(() => {
    if (!supabase || !user?.id) return
    let cancelled = false
    void (async () => {
      const { data, error } = await supabase.from('weak_spots').select('*').eq('user_id', user.id)
      if (cancelled || error) return
      const remote = (data ?? []).map((r) =>
        rowToSpot(r as Parameters<typeof rowToSpot>[0]),
      )
      setSpots((local) => mergeWeakSpots(local, remote))
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const recordResult = useCallback(
    (
      mode: string,
      position: string,
      correct: boolean,
      handIdx?: number,
      questionId?: string,
    ) => {
      let weakOp: WeakRemoteOp = { kind: 'none' }
      setSpots((prev) => {
        const { next, weakOp: op } = applyWeakSpotRecord(
          prev,
          mode,
          position,
          correct,
          handIdx,
          questionId,
          Boolean(user?.id),
        )
        weakOp = op
        return next
      })
      if (user?.id && supabase) {
        void insertQuizResult(user.id, mode, position, correct, handIdx, questionId)
        void syncWeakSpotRemote(user.id, mode, position, handIdx, questionId, weakOp)
      }
    },
    [user],
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

  const clearMode = useCallback(
    (mode: string) => {
      setSpots((prev) => prev.filter((s) => s.mode !== mode))
      if (user?.id && supabase) {
        void supabase.from('weak_spots').delete().eq('user_id', user.id).eq('mode', mode)
      }
    },
    [user],
  )

  const clearAll = useCallback(() => {
    setSpots([])
    if (user?.id && supabase) {
      void supabase.from('weak_spots').delete().eq('user_id', user.id)
    }
  }, [user])

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
