import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { HARDCODED_QUESTIONS, type PostflopQuestion } from '../data/postflopQuestions'
import {
  generateAIQuestion,
  pickBoardBiasedTowardWet,
  pickHeroBiasedTowardMarginal,
  pickRandom,
  pickScenarioBiased,
  TURN_CARDS,
  weightedPickIndex,
} from '../utils/postflopAI'
import type { QuizIntegrationOptions } from './quizIntegration'
import type { QuizPhase, QuizStats } from './useQuiz'
import {
  loadPostflopWrongHardcodedIds,
  loadPostflopWrongByPosition,
  persistPostflopWrongHardcodedIds,
  persistPostflopWrongByPosition,
} from '../utils/postflopWrongIds'

/** 標記為 marginal 的硬編碼題，相對於非邊緣題的抽中權重 */
const MARGINAL_HARDCODED_WEIGHT = 2.65

/** 曾答錯過的硬編碼題，在 marginal 權重之後再乘以此係數 */
const WRONG_HISTORY_BOOST = 2.85
/** 曾在特定位置答錯越多，該位置題目權重越高（每次 +45%，最多 4 層） */
const POSITION_ERROR_BOOST_STEP = 0.45
const POSITION_ERROR_BOOST_CAP = 4

/**
 * 將題目的 position 正規化成可統計的鍵值。
 */
function normalizePositionKey(position: string): string {
  if (position.includes('BB 防守') && position.includes('大注')) return 'bb-defense-vs-btn-large-cbet'
  if (position.includes('BB 防守')) return 'bb-defense-vs-btn-small-cbet'
  if (position.includes('翻牌大注後，轉牌')) return 'ai-turn-barrel-after-large-flop'
  if (position.includes('翻牌小注後，轉牌')) return 'ai-turn-barrel-after-small-flop'
  if (position.includes('主動下注') || position.includes('Donk')) return 'bb-donk-bet-spot'
  if (position.includes('面對 BB Squeeze')) return 'btn-facing-bb-squeeze'
  if (position.includes('BB Squeeze')) return 'bb-squeeze-spot'
  if (position.includes('SB 面對 BTN')) return 'sb-vs-btn-open'
  if (position.includes('多人底池')) return 'multiway-co-btn-bb'
  if (position.includes('BB 面對 BTN 河牌')) return 'bb-river-bluffcatch'
  if (position.includes('BTN vs BB（河牌')) return 'btn-river-ip'
  if (position.includes('BB vs BTN（翻牌 check through') || position.includes('轉牌 BB probe')) {
    return 'bb-probe-turn'
  }
  if (position.includes('轉牌 bluff')) return 'btn-turn-bluff-select'
  if (position.includes('三人底池') || position.includes('CO vs BTN vs BB')) return 'multiway-co-btn-bb'
  if (position.includes('轉牌 probe') || position.includes('BB probe')) return 'bb-probe-turn'
  if (position.includes('BTN 面對 BB')) return 'btn-facing-bb-checkraise'
  if (position.includes('3bet')) return 'bb-3bet-vs-btn-oop'
  if (position.includes('UTG vs BB')) return 'utg-vs-bb-oop'
  if (position.includes('SB vs BB')) return 'sb-vs-bb-oop'
  if (position.includes('CO vs BB')) return 'co-vs-bb-ip'
  if (position.includes('BTN vs BB')) return 'btn-vs-bb-ip'
  if (position.includes('河牌 value bet sizing')) return 'river-value-sizing'
  if (position.includes('4bet pot')) return 'fourbet-pot-flop'
  if (position.includes('河牌 overbet')) return 'river-overbet'
  if (position.includes('BB 防守 vs BTN 兩街')) return 'bb-vs-btn-two-street'
  return 'other'
}

/**
 * 從剩餘池以加權不放回抽下一題硬編碼（邊緣 spot 較高；曾錯題再加權）。
 */
function takeNextHardcodedFromPool(
  pool: PostflopQuestion[],
  wrongHardcodedIds: ReadonlySet<string>,
  wrongByPosition: Readonly<Record<string, number>>,
): PostflopQuestion {
  const w = (q: PostflopQuestion) => {
    let base = q.marginal ? MARGINAL_HARDCODED_WEIGHT : 1
    if (q.type === 'hardcoded' && wrongHardcodedIds.has(q.id)) {
      base *= WRONG_HISTORY_BOOST
    }
    const posKey = normalizePositionKey(q.position)
    const errCount = wrongByPosition[posKey] ?? 0
    const posBoost = 1 + Math.min(errCount, POSITION_ERROR_BOOST_CAP) * POSITION_ERROR_BOOST_STEP
    base *= posBoost
    return base
  }
  const idx = weightedPickIndex(pool, w)
  return pool.splice(idx, 1)[0]!
}

/**
 * 翻後 C-Bet 測驗：硬編碼題庫加權抽題（邊緣決策較常出現），每第 3 題或題庫用盡一輪時 AI 題。
 * AI 題另偏向較濕牌面與邊緣手牌。
 * 答題後須手動按「下一題」或快捷鍵才進入下一題。
 */
export function usePostflopQuiz(
  stats: QuizStats,
  setStats: Dispatch<SetStateAction<QuizStats>>,
  integration?: QuizIntegrationOptions,
) {
  const integrationRef = useRef(integration)
  integrationRef.current = integration

  const [currentQuestion, setCurrentQuestion] = useState<PostflopQuestion | null>(null)
  const [phase, setPhase] = useState<QuizPhase>('loading')
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [pickedOption, setPickedOption] = useState<string | null>(null)

  /** 本輪尚未抽過的硬編碼題；抽完再開新一輪（加權不放回） */
  const hardcodedPoolRef = useRef<PostflopQuestion[] | null>(null)
  const servedNumRef = useRef(0)
  /** 曾答錯的硬編碼題 id（持久化，答對後移除以降權重） */
  const wrongHardcodedIdsRef = useRef<Set<string>>(loadPostflopWrongHardcodedIds())
  /** 依位置累積錯誤次數（持久化，答對會逐步下降） */
  const wrongByPositionRef = useRef<Record<string, number>>(loadPostflopWrongByPosition())

  const loadQuestionNumber = useCallback(async (n: number) => {
    servedNumRef.current = n
    const int = integrationRef.current
    const tryWeak = Boolean(int?.weakReviewOnly) || (n % 5 === 0 && Boolean(int?.pickWeakQuestionId))

    if (tryWeak && int?.pickWeakQuestionId) {
      const wid = int.pickWeakQuestionId('postflop-cbet')
      if (wid) {
        const found = HARDCODED_QUESTIONS.find((q) => q.id === wid && q.type === 'hardcoded')
        if (found) {
          if (!hardcodedPoolRef.current || hardcodedPoolRef.current.length === 0) {
            hardcodedPoolRef.current = [...HARDCODED_QUESTIONS]
          }
          const pool = hardcodedPoolRef.current!
          const ix = pool.findIndex((q) => q.id === wid)
          if (ix >= 0) pool.splice(ix, 1)
          setCurrentQuestion({ ...found })
          setPhase('question')
          setLastCorrect(null)
          setPickedOption(null)
          return
        }
      }
    }

    const useAI = n % 3 === 0

    if (useAI) {
      setPhase('loading')
      setCurrentQuestion(null)
      const scenario = pickScenarioBiased()
      const board = pickBoardBiasedTowardWet()
      const hand = pickHeroBiasedTowardMarginal()
      const turnCard =
        scenario.type === 'turn-barrel' || scenario.type === 'probe-bet'
          ? pickRandom(TURN_CARDS)
          : undefined
      const q = await generateAIQuestion(scenario, board, hand, turnCard)
      setCurrentQuestion(q)
      setPhase('question')
      setLastCorrect(null)
      setPickedOption(null)
      return
    }

    if (!hardcodedPoolRef.current || hardcodedPoolRef.current.length === 0) {
      hardcodedPoolRef.current = [...HARDCODED_QUESTIONS]
    }
    const pool = hardcodedPoolRef.current!
    const q = takeNextHardcodedFromPool(
      pool,
      wrongHardcodedIdsRef.current,
      wrongByPositionRef.current,
    )
    setCurrentQuestion(q)
    setPhase('question')
    setLastCorrect(null)
    setPickedOption(null)
  }, [integration?.weakReviewOnly])

  useEffect(() => {
    void loadQuestionNumber(1)
  }, [loadQuestionNumber])

  const goNextQuestion = useCallback(() => {
    const next = servedNumRef.current + 1
    void loadQuestionNumber(next)
  }, [loadQuestionNumber])

  const answer = useCallback(
    (option: string) => {
      if (phase !== 'question' || !currentQuestion) return

      const correct = option === currentQuestion.correctAnswer
      setPickedOption(option)
      setLastCorrect(correct)
      setPhase('result')

      setStats((s) => ({
        total: s.total + 1,
        correct: s.correct + (correct ? 1 : 0),
        streak: correct ? s.streak + 1 : 0,
      }))

      integrationRef.current?.onRecordResult?.(
        'postflop-cbet',
        currentQuestion.position,
        correct,
        { questionId: currentQuestion.id },
      )
      integrationRef.current?.onDailyAnswer?.('postflop-cbet', correct)

      if (currentQuestion.type === 'hardcoded') {
        const posKey = normalizePositionKey(currentQuestion.position)
        if (correct) {
          wrongHardcodedIdsRef.current.delete(currentQuestion.id)
          const now = wrongByPositionRef.current[posKey] ?? 0
          if (now <= 1) {
            delete wrongByPositionRef.current[posKey]
          } else {
            wrongByPositionRef.current[posKey] = now - 1
          }
        } else {
          wrongHardcodedIdsRef.current.add(currentQuestion.id)
          wrongByPositionRef.current[posKey] = (wrongByPositionRef.current[posKey] ?? 0) + 1
        }
        persistPostflopWrongHardcodedIds(wrongHardcodedIdsRef.current)
        persistPostflopWrongByPosition(wrongByPositionRef.current)
      }
    },
    [phase, currentQuestion, setStats],
  )

  const nextHand = useCallback(() => {
    if (phase !== 'result') return
    goNextQuestion()
  }, [phase, goNextQuestion])

  const resetStats = useCallback(() => {
    setStats({ total: 0, correct: 0, streak: 0 })
  }, [setStats])

  return {
    currentQuestion,
    phase,
    lastCorrect,
    pickedOption,
    stats,
    answer,
    nextHand,
    resetStats,
  }
}
