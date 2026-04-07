import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getVs4betAction, type Vs4betAction } from '../utils/ranges'
import { recordVs4betWrong } from '../utils/wrongBook'
import { pickComboForHandIndex } from '../utils/cardCombo'
import type { SuitCode } from '../utils/cardCombo'
import type { QuizIntegrationOptions } from './quizIntegration'
import type { QuizPhase, QuizStats } from './useQuiz'

export interface Vs4betCombo {
  rank1: string
  rank2: string
  suit1: SuitCode
  suit2: SuitCode
}

/**
 * VS 4BET：3-bettor 面對 4-bet 簡化跟注/棄牌。
 */
export function useVs4betQuiz(
  stats: QuizStats,
  setStats: Dispatch<SetStateAction<QuizStats>>,
  integration?: QuizIntegrationOptions,
) {
  const integrationRef = useRef(integration)
  integrationRef.current = integration
  const dealSeqRef = useRef(0)

  const [currentHandIdx, setCurrentHandIdx] = useState(0)
  const [currentCombo, setCurrentCombo] = useState<Vs4betCombo>(() => pickComboForHandIndex(0))
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

  const dealRandom = useCallback(() => {
    dealSeqRef.current += 1
    const int = integrationRef.current
    let idx = Math.floor(Math.random() * 169)
    const posKey = 'default'
    if (int?.weakReviewOnly && int.pickWeakHand) {
      const w = int.pickWeakHand('vs4bet', posKey)
      if (w != null) idx = w
    } else if (dealSeqRef.current % 5 === 0 && int?.pickWeakHand) {
      const w = int.pickWeakHand('vs4bet', posKey)
      if (w != null) idx = w
    }
    setCurrentHandIdx(idx)
    setCurrentCombo(pickComboForHandIndex(idx))
    setPhase('question')
    setLastCorrect(null)
  }, [integration?.weakReviewOnly])

  useEffect(() => {
    dealRandom()
  }, [dealRandom])

  const answer = useCallback(
    (action: Vs4betAction) => {
      if (phase !== 'question') return

      const gto = getVs4betAction(currentHandIdx)
      const correct = action === gto

      if (!correct) {
        recordVs4betWrong({
          handIdx: currentHandIdx,
          user: action,
          gto,
        })
      }

      setStats((s) => ({
        total: s.total + 1,
        correct: s.correct + (correct ? 1 : 0),
        streak: correct ? s.streak + 1 : 0,
      }))
      integrationRef.current?.onRecordResult?.('vs4bet', 'default', correct, {
        handIdx: currentHandIdx,
      })
      integrationRef.current?.onDailyAnswer?.('vs4bet', correct)
      setLastCorrect(correct)
      setPhase('result')

      clearAdvanceTimer()
      advanceTimerRef.current = setTimeout(() => {
        dealRandom()
        advanceTimerRef.current = null
      }, 1200)
    },
    [phase, currentHandIdx, clearAdvanceTimer, dealRandom, setStats],
  )

  useEffect(() => () => clearAdvanceTimer(), [clearAdvanceTimer])

  const resetStats = useCallback(() => {
    setStats({ total: 0, correct: 0, streak: 0 })
  }, [setStats])

  const nextHand = useCallback(() => {
    if (phase !== 'result') return
    clearAdvanceTimer()
    dealRandom()
  }, [phase, clearAdvanceTimer, dealRandom])

  return {
    currentHandIdx,
    currentCombo,
    phase,
    lastCorrect,
    stats,
    showRange,
    setShowRange,
    answer,
    nextHand,
    resetStats,
  }
}
