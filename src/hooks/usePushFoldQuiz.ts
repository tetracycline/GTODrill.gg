import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { isPush } from '../utils/ranges'
import { recordPushFoldWrong } from '../utils/wrongBook'
import { pickComboForHandIndex } from '../utils/cardCombo'
import type { SuitCode } from '../utils/cardCombo'
import type { QuizIntegrationOptions } from './quizIntegration'
import type { QuizPhase, QuizStats } from './useQuiz'

export interface PushFoldCombo {
  rank1: string
  rank2: string
  suit1: SuitCode
  suit2: SuitCode
}

export const PUSH_FOLD_STACK_PRESETS = [5, 8, 10, 12, 15, 20] as const

const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const

/**
 * Push/Fold Nash 測驗；碼量與位置為單選，變更時重發隨機手牌。
 */
export function usePushFoldQuiz(
  stats: QuizStats,
  setStats: Dispatch<SetStateAction<QuizStats>>,
  integration?: QuizIntegrationOptions,
) {
  const integrationRef = useRef(integration)
  integrationRef.current = integration
  const dealSeqRef = useRef(0)
  const stackBbRef = useRef(10)
  const positionRef = useRef('BTN')

  const [stackBb, setStackBb] = useState(10)
  const [position, setPosition] = useState('BTN')
  const [currentHandIdx, setCurrentHandIdx] = useState(0)
  const [currentCombo, setCurrentCombo] = useState<PushFoldCombo>(() =>
    pickComboForHandIndex(0),
  )
  const [phase, setPhase] = useState<QuizPhase>('question')
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [showRange, setShowRange] = useState(false)

  stackBbRef.current = stackBb
  positionRef.current = position

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }, [])

  /**
   * 保留目前碼量／位置，僅換隨機手牌並回到題目階段。
   */
  const reshuffleHand = useCallback(() => {
    dealSeqRef.current += 1
    const int = integrationRef.current
    let idx = Math.floor(Math.random() * 169)
    const posKey = `${positionRef.current}|${stackBbRef.current}bb`
    if (int?.weakReviewOnly && int.pickWeakHand) {
      const w = int.pickWeakHand('pushfold', posKey)
      if (w != null) idx = w
    } else if (dealSeqRef.current % 5 === 0 && int?.pickWeakHand) {
      const w = int.pickWeakHand('pushfold', posKey)
      if (w != null) idx = w
    }
    setCurrentHandIdx(idx)
    setCurrentCombo(pickComboForHandIndex(idx))
    setPhase('question')
    setLastCorrect(null)
  }, [integration?.weakReviewOnly])

  const dealRandom = useCallback(() => {
    reshuffleHand()
  }, [reshuffleHand])

  useEffect(() => {
    dealRandom()
  }, [dealRandom])

  const answer = useCallback(
    (action: 'push' | 'fold') => {
      if (phase !== 'question') return

      const gtoPush = isPush(currentHandIdx, stackBb, position)
      const userPush = action === 'push'
      const correct = userPush === gtoPush

      if (!correct) {
        recordPushFoldWrong({
          position,
          stackBb,
          handIdx: currentHandIdx,
          user: action,
          gto: gtoPush ? 'push' : 'fold',
        })
      }

      setStats((s) => ({
        total: s.total + 1,
        correct: s.correct + (correct ? 1 : 0),
        streak: correct ? s.streak + 1 : 0,
      }))
      const posKey = `${position}|${stackBb}bb`
      integrationRef.current?.onRecordResult?.('pushfold', posKey, correct, {
        handIdx: currentHandIdx,
      })
      integrationRef.current?.onDailyAnswer?.('pushfold', correct)
      setLastCorrect(correct)
      setPhase('result')

      clearAdvanceTimer()
      advanceTimerRef.current = setTimeout(() => {
        dealRandom()
        advanceTimerRef.current = null
      }, 1200)
    },
    [phase, currentHandIdx, stackBb, position, clearAdvanceTimer, dealRandom, setStats],
  )

  useEffect(() => () => clearAdvanceTimer(), [clearAdvanceTimer])

  const selectStackBb = useCallback(
    (bb: number) => {
      clearAdvanceTimer()
      advanceTimerRef.current = null
      setStackBb(bb)
      reshuffleHand()
    },
    [clearAdvanceTimer, reshuffleHand],
  )

  const selectPosition = useCallback(
    (pos: string) => {
      clearAdvanceTimer()
      advanceTimerRef.current = null
      setPosition(pos)
      reshuffleHand()
    },
    [clearAdvanceTimer, reshuffleHand],
  )

  const resetStats = useCallback(() => {
    setStats({ total: 0, correct: 0, streak: 0 })
  }, [setStats])

  const nextHand = useCallback(() => {
    if (phase !== 'result') return
    clearAdvanceTimer()
    dealRandom()
  }, [phase, clearAdvanceTimer, dealRandom])

  return {
    stackBb,
    position,
    currentHandIdx,
    currentCombo,
    phase,
    lastCorrect,
    stats,
    showRange,
    setShowRange,
    answer,
    nextHand,
    selectStackBb,
    selectPosition,
    resetStats,
    stackPresets: [...PUSH_FOLD_STACK_PRESETS],
    positionIds: [...POSITIONS],
  }
}
