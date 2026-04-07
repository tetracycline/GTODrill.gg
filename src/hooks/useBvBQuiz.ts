import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getBvBBBAction,
  getBvBSBVs3betAction,
  type BvBBBAction,
  type BvBSBVs3betAction,
} from '../utils/ranges'
import { recordBvBWrong } from '../utils/wrongBook'
import { randomHandWeighted } from '../utils/quiz'
import { pickComboForHandIndex } from '../utils/cardCombo'
import type { SuitCode } from '../utils/cardCombo'
import type { QuizIntegrationOptions } from './quizIntegration'
import type { QuizPhase, QuizStats } from './useQuiz'

export type BvBSpot = 'bb_defend' | 'sb_vs_3bet'

export interface BvBCombo {
  rank1: string
  rank2: string
  suit1: SuitCode
  suit2: SuitCode
}

/**
 * 大小盲對決：BB 防守 SB 開牌，或 SB 面對 BB 3-bet。
 */
export function useBvBQuiz(
  stats: QuizStats,
  setStats: Dispatch<SetStateAction<QuizStats>>,
  integration?: QuizIntegrationOptions,
) {
  const integrationRef = useRef(integration)
  integrationRef.current = integration
  const dealSeqRef = useRef(0)

  const [spot, setSpot] = useState<BvBSpot>('bb_defend')
  const spotRef = useRef(spot)
  spotRef.current = spot

  const [currentHandIdx, setCurrentHandIdx] = useState(0)
  const [currentCombo, setCurrentCombo] = useState<BvBCombo>(() => pickComboForHandIndex(0))
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
    let idx = randomHandWeighted()
    const posKey = spotRef.current === 'bb_defend' ? 'BB' : 'SB'
    if (int?.weakReviewOnly && int.pickWeakHand) {
      const w = int.pickWeakHand('bvb', posKey)
      if (w != null) idx = w
    } else if (dealSeqRef.current % 5 === 0 && int?.pickWeakHand) {
      const w = int.pickWeakHand('bvb', posKey)
      if (w != null) idx = w
    }
    setCurrentHandIdx(idx)
    setCurrentCombo(pickComboForHandIndex(idx))
    setPhase('question')
    setLastCorrect(null)
  }, [integration?.weakReviewOnly])

  useEffect(() => {
    dealRandom()
  }, [dealRandom, spot])

  const answer = useCallback(
    (action: BvBBBAction | BvBSBVs3betAction) => {
      if (phase !== 'question') return

      const s = spotRef.current
      const gto =
        s === 'bb_defend'
          ? getBvBBBAction(currentHandIdx)
          : getBvBSBVs3betAction(currentHandIdx)
      const correct = action === gto

      if (!correct) {
        recordBvBWrong({
          spot: s,
          handIdx: currentHandIdx,
          user: action,
          gto,
        })
      }

      setStats((st) => ({
        total: st.total + 1,
        correct: st.correct + (correct ? 1 : 0),
        streak: correct ? st.streak + 1 : 0,
      }))
      const posKey = s === 'bb_defend' ? 'BB' : 'SB'
      integrationRef.current?.onRecordResult?.('bvb', posKey, correct, {
        handIdx: currentHandIdx,
      })
      integrationRef.current?.onDailyAnswer?.('bvb', correct)
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
    spot,
    setSpot,
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
