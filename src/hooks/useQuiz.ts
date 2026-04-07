import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { isRFI } from '../utils/ranges'
import type { QuizIntegrationOptions } from './quizIntegration'
import { recordRfiWrong } from '../utils/wrongBook'
import { pickComboForHandIndex } from '../utils/cardCombo'
import type { SuitCode } from '../utils/cardCombo'

export type QuizPhase = 'question' | 'result' | 'loading'

export interface QuizStats {
  total: number
  correct: number
  streak: number
}

export interface CurrentCombo {
  rank1: string
  rank2: string
  suit1: SuitCode
  suit2: SuitCode
}

const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const

/**
 * RFI 測驗；練習位置為單選，變更時重發隨機手牌。
 */
export function useQuiz(
  stats: QuizStats,
  setStats: Dispatch<SetStateAction<QuizStats>>,
  integration?: QuizIntegrationOptions,
) {
  const integrationRef = useRef(integration)
  integrationRef.current = integration
  const dealSeqRef = useRef(0)

  const [currentPosition, setCurrentPosition] = useState('BTN')
  const [currentHandIdx, setCurrentHandIdx] = useState(0)
  const [currentCombo, setCurrentCombo] = useState<CurrentCombo>(() =>
    pickComboForHandIndex(0),
  )
  const [phase, setPhase] = useState<QuizPhase>('question')
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [showRange, setShowRange] = useState(false)

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }, [])

  /**
   * 保留目前練習位置，僅換隨機手牌。
   */
  const dealRandom = useCallback(() => {
    dealSeqRef.current += 1
    const int = integrationRef.current
    let idx = Math.floor(Math.random() * 169)
    if (int?.weakReviewOnly && int.pickWeakHand) {
      const w = int.pickWeakHand('rfi', currentPosition)
      if (w != null) idx = w
    } else if (dealSeqRef.current % 5 === 0 && int?.pickWeakHand) {
      const w = int.pickWeakHand('rfi', currentPosition)
      if (w != null) idx = w
    }
    setCurrentHandIdx(idx)
    setCurrentCombo(pickComboForHandIndex(idx))
    setPhase('question')
    setLastCorrect(null)
  }, [currentPosition, integration?.weakReviewOnly])

  useEffect(() => {
    dealRandom()
  }, [dealRandom])

  const answer = useCallback(
    (action: 'raise' | 'fold') => {
      if (phase !== 'question') return

      const gtoRaise = isRFI(currentHandIdx, currentPosition)
      const userRaise = action === 'raise'
      const correct = userRaise === gtoRaise

      if (!correct) {
        recordRfiWrong({
          position: currentPosition,
          handIdx: currentHandIdx,
          user: action,
          gto: gtoRaise ? 'raise' : 'fold',
        })
      }

      setStats((s) => ({
        total: s.total + 1,
        correct: s.correct + (correct ? 1 : 0),
        streak: correct ? s.streak + 1 : 0,
      }))
      integrationRef.current?.onRecordResult?.('rfi', currentPosition, correct, {
        handIdx: currentHandIdx,
      })
      integrationRef.current?.onDailyAnswer?.('rfi', correct)
      setLastCorrect(correct)
      setPhase('result')

      clearAdvanceTimer()
      advanceTimerRef.current = setTimeout(() => {
        dealRandom()
        advanceTimerRef.current = null
      }, 1200)
    },
    [phase, currentHandIdx, currentPosition, clearAdvanceTimer, dealRandom, setStats],
  )

  useEffect(() => () => clearAdvanceTimer(), [clearAdvanceTimer])

  const selectPosition = useCallback(
    (pos: string) => {
      clearAdvanceTimer()
      advanceTimerRef.current = null
      setCurrentPosition(pos)
      const idx = Math.floor(Math.random() * 169)
      setCurrentHandIdx(idx)
      setCurrentCombo(pickComboForHandIndex(idx))
      setPhase('question')
      setLastCorrect(null)
    },
    [clearAdvanceTimer],
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
    currentPosition,
    currentHandIdx,
    currentCombo,
    phase,
    lastCorrect,
    stats,
    showRange,
    setShowRange,
    answer,
    nextHand,
    selectPosition,
    resetStats,
    allPositionIds: [...POSITIONS],
  }
}
