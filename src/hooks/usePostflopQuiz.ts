import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useOpponentType } from '../contexts/OpponentTypeContext'
import { HARDCODED_QUESTIONS, type PostflopQuestion } from '../data/postflopQuestions'
import type { Language } from '../i18n/types'
import {
  generateAIQuestion,
  pickBoardBiasedTowardWet,
  pickHeroBiasedTowardMarginal,
  pickRandom,
  pickScenarioBiased,
  TURN_CARDS,
  weightedPickIndex,
} from '../utils/postflopAI'
import { localizeHardcodedPostflopQuestion } from '../utils/postflopHardcodedLocalize'
import { normalizePositionKey } from '../utils/postflopSpotKey'
import type { QuizIntegrationOptions } from './quizIntegration'
import type { QuizPhase, QuizStats } from './useQuiz'
import {
  loadPostflopWrongHardcodedIds,
  loadPostflopWrongByPosition,
  persistPostflopWrongHardcodedIds,
  persistPostflopWrongByPosition,
} from '../utils/postflopWrongIds'
import { getEffectivePostflopCorrectAnswer } from '../utils/exploitRanges'

/** 標記為 marginal 的硬編碼題，相對於非邊緣題的抽中權重 */
const MARGINAL_HARDCODED_WEIGHT = 2.65

/** 曾答錯過的硬編碼題，在 marginal 權重之後再乘以此係數 */
const WRONG_HISTORY_BOOST = 2.85
/** 曾在特定位置答錯越多，該位置題目權重越高（每次 +45%，最多 4 層） */
const POSITION_ERROR_BOOST_STEP = 0.45
const POSITION_ERROR_BOOST_CAP = 4

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
 *
 * @param lang - 介面語言（AI／硬編碼題顯示與選項隨之切換；變更時會依目前題號重載）
 */
export function usePostflopQuiz(
  stats: QuizStats,
  setStats: Dispatch<SetStateAction<QuizStats>>,
  lang: Language,
  integration?: QuizIntegrationOptions,
) {
  const integrationRef = useRef(integration)
  const { opponentType } = useOpponentType()

  useEffect(() => {
    integrationRef.current = integration
  }, [integration])

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
          setCurrentQuestion(localizeHardcodedPostflopQuestion({ ...found }, lang))
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
      const q = await generateAIQuestion(scenario, board, hand, turnCard, lang)
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
    setCurrentQuestion(localizeHardcodedPostflopQuestion(q, lang))
    setPhase('question')
    setLastCorrect(null)
    setPickedOption(null)
  }, [integration?.weakReviewOnly, lang])

  useEffect(() => {
    void loadQuestionNumber(1)
  }, [loadQuestionNumber])

  /**
   * 切換桌型時，若仍在結果頁，依新桌型重算是否答對（教學一致）。
   */
  useEffect(() => {
    if (phase !== 'result' || !currentQuestion || pickedOption === null) return
    const eff = getEffectivePostflopCorrectAnswer(currentQuestion, opponentType)
    setLastCorrect(pickedOption === eff)
  }, [opponentType, phase, currentQuestion, pickedOption])

  const goNextQuestion = useCallback(() => {
    const next = servedNumRef.current + 1
    void loadQuestionNumber(next)
  }, [loadQuestionNumber])

  const answer = useCallback(
    (option: string) => {
      if (phase !== 'question' || !currentQuestion) return

      const int = integrationRef.current
      if (int?.allowAnswer && !int.allowAnswer('postflop-cbet')) {
        int.onAnswerDenied?.('postflop-cbet')
        return
      }

      const correct =
        option === getEffectivePostflopCorrectAnswer(currentQuestion, opponentType)
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
        currentQuestion.positionRecord ?? currentQuestion.position,
        correct,
        { questionId: currentQuestion.id },
      )
      integrationRef.current?.onDailyAnswer?.('postflop-cbet', correct)

      if (currentQuestion.type === 'hardcoded') {
        const posKey = normalizePositionKey(
          currentQuestion.positionRecord ?? currentQuestion.position,
        )
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
    [phase, currentQuestion, opponentType, setStats],
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
