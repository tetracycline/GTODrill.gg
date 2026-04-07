import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { pickComboForHandIndex } from '../utils/cardCombo'
import type { SuitCode } from '../utils/cardCombo'
import { getCold4betAction, type Cold4betAction } from '../utils/ranges'
import type { QuizIntegrationOptions } from './quizIntegration'
import type { QuizPhase, QuizStats } from './useQuiz'

export interface Cold4betCombo {
  rank1: string
  rank2: string
  suit1: SuitCode
  suit2: SuitCode
}

const HERO_POSITIONS = ['HJ', 'CO', 'BTN', 'SB', 'BB'] as const

/**
 * Cold 4-Bet：面對開池 + 3bet，Hero 最後行動（4bet / call / fold）。
 */
export function useCold4betQuiz(
  stats: QuizStats,
  setStats: Dispatch<SetStateAction<QuizStats>>,
  integration?: QuizIntegrationOptions,
) {
  const [heroPos, setHeroPos] = useState('BTN')
  const [currentHandIdx, setCurrentHandIdx] = useState(0)
  const [currentCombo, setCurrentCombo] = useState<Cold4betCombo>(() => pickComboForHandIndex(0))
  const [phase, setPhase] = useState<QuizPhase>('question')
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [showRange, setShowRange] = useState(false)

  const integrationRef = useRef(integration)
  integrationRef.current = integration
  const dealSeqRef = useRef(0)

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
      const w = int.pickWeakHand('cold4bet', heroPos)
      if (w != null) idx = w
    } else if (dealSeqRef.current % 5 === 0 && int?.pickWeakHand) {
      const w = int.pickWeakHand('cold4bet', heroPos)
      if (w != null) idx = w
    }
    setCurrentHandIdx(idx)
    setCurrentCombo(pickComboForHandIndex(idx))
    setPhase('question')
    setLastCorrect(null)
  }, [heroPos, integration?.weakReviewOnly])

  useEffect(() => {
    dealRandom()
  }, [dealRandom])

  const answer = useCallback(
    (action: Cold4betAction) => {
      if (phase !== 'question') return

      const gto = getCold4betAction(currentHandIdx, heroPos)
      const correct = action === gto

      setStats((s) => ({
        total: s.total + 1,
        correct: s.correct + (correct ? 1 : 0),
        streak: correct ? s.streak + 1 : 0,
      }))
      integrationRef.current?.onRecordResult?.('cold4bet', heroPos, correct, {
        handIdx: currentHandIdx,
      })
      integrationRef.current?.onDailyAnswer?.('cold4bet', correct)

      setLastCorrect(correct)
      setPhase('result')

      clearAdvanceTimer()
      advanceTimerRef.current = setTimeout(() => {
        dealRandom()
        advanceTimerRef.current = null
      }, 1200)
    },
    [phase, currentHandIdx, heroPos, clearAdvanceTimer, dealRandom, setStats],
  )

  useEffect(() => () => clearAdvanceTimer(), [clearAdvanceTimer])

  const selectHeroPos = useCallback(
    (pos: string) => {
      clearAdvanceTimer()
      advanceTimerRef.current = null
      setHeroPos(pos)
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
    heroPos,
    currentHandIdx,
    currentCombo,
    phase,
    lastCorrect,
    stats,
    showRange,
    setShowRange,
    answer,
    nextHand,
    selectHeroPos,
    resetStats,
    heroIds: [...HERO_POSITIONS],
  }
}
