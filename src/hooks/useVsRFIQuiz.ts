import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { VsRFIAction } from '../utils/ranges'
import { useOpponentType } from '../contexts/OpponentTypeContext'
import { getAdjustedVsRFIAction } from '../utils/exploitRanges'
import { recordVsRfiWrong } from '../utils/wrongBook'
import { randomHandWeighted } from '../utils/quiz'
import { pickComboForHandIndex } from '../utils/cardCombo'
import type { SuitCode } from '../utils/cardCombo'
import type { QuizIntegrationOptions } from './quizIntegration'
import type { QuizPhase, QuizStats } from './useQuiz'

export interface VsRFICurrentCombo {
  rank1: string
  rank2: string
  suit1: SuitCode
  suit2: SuitCode
}

const VILLAIN_IDS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const
const HERO_IDS = ['HJ', 'CO', 'BTN', 'SB', 'BB'] as const

const VALID_VILLAIN_TO_HERO: Record<string, string[]> = {
  UTG: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
  HJ: ['CO', 'BTN', 'SB', 'BB'],
  CO: ['BTN', 'SB', 'BB'],
  BTN: ['SB', 'BB'],
  SB: ['BB'],
}

export const INVALID_VS_RFI_COMBO_MESSAGE =
  '請選擇合法的對戰組合（Hero 須在 Villain 後面的位置）'

/**
 * @returns 目前選取中合法的 (Villain, Hero) 配對列表
 */
export function getValidCombos(
  villains: string[],
  heroes: string[],
): Array<{ v: string; h: string }> {
  const combos: Array<{ v: string; h: string }> = []
  for (const v of villains) {
    for (const h of heroes) {
      if (VALID_VILLAIN_TO_HERO[v]?.includes(h)) combos.push({ v, h })
    }
  }
  return combos
}

/**
 * VS RFI 測驗；Villain / Hero 各為單選，變更時依結果階段決定是否立即重發。
 */
export function useVsRFIQuiz(
  stats: QuizStats,
  setStats: Dispatch<SetStateAction<QuizStats>>,
  integration?: QuizIntegrationOptions,
) {
  const integrationRef = useRef(integration)
  integrationRef.current = integration
  const dealSeqRef = useRef(0)
  const { opponentType } = useOpponentType()

  const [villainPos, setVillainPos] = useState('UTG')
  const [heroPos, setHeroPos] = useState('BB')
  const [currentHandIdx, setCurrentHandIdx] = useState(0)
  const [currentCombo, setCurrentCombo] = useState<VsRFICurrentCombo>(() =>
    pickComboForHandIndex(0),
  )
  const [phase, setPhase] = useState<QuizPhase>('question')
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [showRange, setShowRange] = useState(false)
  const [invalidComboHint, setInvalidComboHint] = useState<string | null>(null)

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }, [])

  const dealRandom = useCallback(() => {
    const combos = getValidCombos([villainPos], [heroPos])
    if (combos.length === 0) {
      setInvalidComboHint(INVALID_VS_RFI_COMBO_MESSAGE)
      setPhase('question')
      setLastCorrect(null)
      return
    }

    setInvalidComboHint(null)
    dealSeqRef.current += 1
    const int = integrationRef.current
    let idx = randomHandWeighted()
    const posKey = `${villainPos}/${heroPos}`
    if (int?.weakReviewOnly && int.pickWeakHand) {
      const w = int.pickWeakHand('vsrfi', posKey)
      if (w != null) idx = w
    } else if (dealSeqRef.current % 5 === 0 && int?.pickWeakHand) {
      const w = int.pickWeakHand('vsrfi', posKey)
      if (w != null) idx = w
    }
    setCurrentHandIdx(idx)
    setCurrentCombo(pickComboForHandIndex(idx))
    setPhase('question')
    setLastCorrect(null)
  }, [villainPos, heroPos, integration?.weakReviewOnly])

  const prevVillainRef = useRef<string | undefined>(undefined)
  const prevHeroRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const villainChanged = prevVillainRef.current !== villainPos
    const heroChanged = prevHeroRef.current !== heroPos
    prevVillainRef.current = villainPos
    prevHeroRef.current = heroPos

    if (!villainChanged && !heroChanged) return
    if (phase === 'result') return

    dealRandom()
  }, [villainPos, heroPos, dealRandom, phase])

  const answer = useCallback(
    (action: VsRFIAction) => {
      if (invalidComboHint) return
      if (phase !== 'question') return

      const expected = getAdjustedVsRFIAction(currentHandIdx, heroPos, villainPos, opponentType)
      const correct = action === expected

      if (!correct) {
        recordVsRfiWrong({
          villainPos,
          heroPos,
          handIdx: currentHandIdx,
          user: action,
          gto: expected,
        })
      }

      setStats((s) => ({
        total: s.total + 1,
        correct: s.correct + (correct ? 1 : 0),
        streak: correct ? s.streak + 1 : 0,
      }))
      const posKey = `${villainPos}/${heroPos}`
      integrationRef.current?.onRecordResult?.('vsrfi', posKey, correct, {
        handIdx: currentHandIdx,
      })
      integrationRef.current?.onDailyAnswer?.('vsrfi', correct)
      setLastCorrect(correct)
      setPhase('result')

      clearAdvanceTimer()
      advanceTimerRef.current = setTimeout(() => {
        dealRandom()
        advanceTimerRef.current = null
      }, 1200)
    },
    [
      invalidComboHint,
      phase,
      currentHandIdx,
      heroPos,
      villainPos,
      opponentType,
      clearAdvanceTimer,
      dealRandom,
      setStats,
    ],
  )

  useEffect(() => () => clearAdvanceTimer(), [clearAdvanceTimer])

  const selectVillain = useCallback(
    (pos: string) => {
      clearAdvanceTimer()
      advanceTimerRef.current = null
      setVillainPos(pos)
      setHeroPos((prev) =>
        VALID_VILLAIN_TO_HERO[pos]?.includes(prev)
          ? prev
          : (VALID_VILLAIN_TO_HERO[pos]?.[0] ?? 'BB'),
      )
    },
    [clearAdvanceTimer],
  )

  const selectHero = useCallback(
    (pos: string) => {
      if (!VALID_VILLAIN_TO_HERO[villainPos]?.includes(pos)) return
      clearAdvanceTimer()
      advanceTimerRef.current = null
      setHeroPos(pos)
    },
    [villainPos, clearAdvanceTimer],
  )

  const resetStats = useCallback(() => {
    setStats({ total: 0, correct: 0, streak: 0 })
  }, [setStats])

  const nextHand = useCallback(() => {
    if (invalidComboHint) return
    if (phase !== 'result') return
    clearAdvanceTimer()
    dealRandom()
  }, [invalidComboHint, phase, clearAdvanceTimer, dealRandom])

  return {
    villainPos,
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
    selectVillain,
    selectHero,
    resetStats,
    villainIds: [...VILLAIN_IDS],
    heroIds: [...HERO_IDS],
    invalidComboHint,
  }
}
