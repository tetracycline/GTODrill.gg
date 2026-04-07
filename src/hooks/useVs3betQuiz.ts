import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getVs3betAction, type Vs3betAction } from '../utils/ranges'
import { recordVs3betWrong } from '../utils/wrongBook'
import { pickComboForHandIndex } from '../utils/cardCombo'
import type { SuitCode } from '../utils/cardCombo'
import type { QuizIntegrationOptions } from './quizIntegration'
import type { QuizPhase, QuizStats } from './useQuiz'

export interface Vs3betCombo {
  rank1: string
  rank2: string
  suit1: SuitCode
  suit2: SuitCode
}

const OPENERS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const

/**
 * VS 3-Bet：開牌方應對 3-bet；開牌位置單選。
 */
export function useVs3betQuiz(
  stats: QuizStats,
  setStats: Dispatch<SetStateAction<QuizStats>>,
  integration?: QuizIntegrationOptions,
) {
  const integrationRef = useRef(integration)
  integrationRef.current = integration
  const dealSeqRef = useRef(0)

  const [openerPos, setOpenerPos] = useState('BTN')
  const [currentHandIdx, setCurrentHandIdx] = useState(0)
  const [currentCombo, setCurrentCombo] = useState<Vs3betCombo>(() => pickComboForHandIndex(0))
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
    if (int?.weakReviewOnly && int.pickWeakHand) {
      const w = int.pickWeakHand('vs3bet', openerPos)
      if (w != null) idx = w
    } else if (dealSeqRef.current % 5 === 0 && int?.pickWeakHand) {
      const w = int.pickWeakHand('vs3bet', openerPos)
      if (w != null) idx = w
    }
    setCurrentHandIdx(idx)
    setCurrentCombo(pickComboForHandIndex(idx))
    setPhase('question')
    setLastCorrect(null)
  }, [openerPos, integration?.weakReviewOnly])

  useEffect(() => {
    dealRandom()
  }, [dealRandom])

  const answer = useCallback(
    (action: Vs3betAction) => {
      if (phase !== 'question') return

      const gto = getVs3betAction(currentHandIdx, openerPos)
      const correct = action === gto

      if (!correct) {
        recordVs3betWrong({
          openerPos,
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
      integrationRef.current?.onRecordResult?.('vs3bet', openerPos, correct, {
        handIdx: currentHandIdx,
      })
      integrationRef.current?.onDailyAnswer?.('vs3bet', correct)
      setLastCorrect(correct)
      setPhase('result')

      clearAdvanceTimer()
      advanceTimerRef.current = setTimeout(() => {
        dealRandom()
        advanceTimerRef.current = null
      }, 1200)
    },
    [phase, currentHandIdx, openerPos, clearAdvanceTimer, dealRandom, setStats],
  )

  useEffect(() => () => clearAdvanceTimer(), [clearAdvanceTimer])

  const selectOpener = useCallback(
    (pos: string) => {
      clearAdvanceTimer()
      advanceTimerRef.current = null
      setOpenerPos(pos)
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
    openerPos,
    currentHandIdx,
    currentCombo,
    phase,
    lastCorrect,
    stats,
    showRange,
    setShowRange,
    answer,
    nextHand,
    selectOpener,
    resetStats,
    openerIds: [...OPENERS],
  }
}
