import { useEffect, useMemo, useRef, useState } from 'react'
import { useAiDailyQuota } from '../../hooks/useAiDailyQuota'
import { useTranslation } from '../../i18n/LanguageContext'
import { getCoachResponse, type CoachMessage } from '../../utils/aiCoach'
import styles from './AIChatPage.module.css'

const STORAGE_KEY = 'ai-coach-chat'
const MAX_MESSAGES = 20
const MAX_CONTEXT_MESSAGES = 10

const QUICK_PROMPTS = {
  'zh-TW': [
    { label: '翻前範圍?', text: '幫我解釋 BTN vs BB 的翻前基本策略' },
    { label: '這手牌怎麼打?', text: '幫我分析這手牌：' },
    { label: '貼手牌分析', text: '我貼一手牌給你，請依照翻前、翻牌、轉牌、河牌分析：\n' },
    { label: '什麼是GTO?', text: '什麼是 GTO 策略？對低級別有用嗎？' },
  ],
  'zh-CN': [
    { label: '翻前范围?', text: '帮我解释 BTN vs BB 的翻前基本策略' },
    { label: '这手牌怎么打?', text: '帮我分析这手牌：' },
    { label: '贴手牌分析', text: '我贴一手牌给你，请按翻前、翻牌、转牌、河牌分析：\n' },
    { label: '什么是GTO?', text: '什么是 GTO 策略？对低级别有用吗？' },
  ],
  en: [
    { label: 'Preflop range?', text: 'Explain the basic BTN vs BB preflop strategy for 100bb cash games.' },
    { label: 'How to play this hand?', text: 'Please analyze this hand:' },
    { label: 'Paste hand history', text: 'Analyze this hand history street by street:\n' },
    { label: 'What is GTO?', text: 'What is GTO strategy, and how useful is it at NL2-NL25?' },
  ],
} as const

interface ChatMessage {
  /** 訊息 ID。 */
  id: string
  /** 訊息來源角色。 */
  role: 'user' | 'assistant'
  /** 訊息內容。 */
  content: string
  /** UNIX 時間戳（毫秒）。 */
  timestamp: number
  /** 是否為暫時 loading 訊息。 */
  isLoading?: boolean
}

export interface AIChatPageProps {
  /** Pro／管理員為 true 時不限制每日則數。 */
  isUnlimited?: boolean
  /** 免費額度用盡時回呼（例如開啟升級彈窗）。 */
  onFreeLimitReached?: () => void
}

/**
 * AI 教練對話頁：自由提問、手牌文字分析、快捷提問。
 */
export function AIChatPage({ isUnlimited = true, onFreeLimitReached }: AIChatPageProps) {
  const { lang } = useTranslation()
  const { canSend, recordUserMessage, getRemaining, freeLimit } = useAiDailyQuota(isUnlimited)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const welcomeContent = useMemo(
    () =>
      lang === 'en'
        ? 'Hi! I am your GTO poker coach. Ask me any poker question or paste a hand history for analysis.'
        : lang === 'zh-CN'
          ? '你好！我是你的 GTO 扑克教练。你可以问我任何问题，或粘贴手牌记录让我分析。'
          : '你好！我是你的 GTO 撲克教練。你可以問我任何問題，或貼上手牌記錄讓我分析。',
    [lang],
  )

  const createWelcomeMessage = (): ChatMessage => ({
    id: 'welcome',
    role: 'assistant',
    content: welcomeContent,
    timestamp: Date.now(),
  })

  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav?.type === 'reload') {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }

    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as ChatMessage[]
      if (!Array.isArray(parsed) || parsed.length === 0) return
      setMessages(parsed.slice(-MAX_MESSAGES))
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const clean = messages.filter((m) => !m.isLoading).slice(-MAX_MESSAGES)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
  }, [messages])

  /**
   * 依內容自動調整輸入框高度。
   */
  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  /**
   * 傳送訊息並呼叫 AI 教練回覆。
   */
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    if (!canSend()) {
      onFreeLimitReached?.()
      return
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isLoading: true,
    }

    const nextMessages = [...messages, userMsg, loadingMsg]
    setMessages(nextMessages.slice(-MAX_MESSAGES))
    setInput('')
    setIsLoading(true)
    recordUserMessage()
    requestAnimationFrame(autoResize)

    try {
      const history: CoachMessage[] = nextMessages
        .filter((m) => !m.isLoading)
        .slice(-MAX_CONTEXT_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }))

      const response = await getCoachResponse(history, lang)

      setMessages((prev) =>
        prev
          .map((m) => (m.isLoading ? { ...m, content: response, isLoading: false } : m))
          .slice(-MAX_MESSAGES),
      )
    } catch {
      const fallback =
        lang === 'en'
          ? 'Sorry, AI coach is temporarily unavailable. Please try again later.'
          : lang === 'zh-CN'
            ? '抱歉，AI 教练暂时无法回应，请稍后再试。'
            : '抱歉，AI 教練暫時無法回應，請稍後再試。'
      setMessages((prev) =>
        prev
          .map((m) => (m.isLoading ? { ...m, content: fallback, isLoading: false } : m))
          .slice(-MAX_MESSAGES),
      )
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 清除整段對話並重置到歡迎訊息。
   */
  const clearConversation = () => {
    const welcome = createWelcomeMessage()
    setMessages([welcome])
    sessionStorage.removeItem(STORAGE_KEY)
  }

  const placeholder =
    lang === 'en'
      ? 'Ask any poker question, or paste a hand history...'
      : lang === 'zh-CN'
        ? '问任何扑克问题，或粘贴手牌记录...'
        : '問任何撲克問題，或貼上手牌記錄...'

  const clearLabel = lang === 'en' ? 'Clear' : lang === 'zh-CN' ? '清除对话' : '清除對話'
  const sendLabel = lang === 'en' ? '↵' : '↵'

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI 教練</h1>
        <button type="button" className={styles.clearBtn} onClick={clearConversation}>
          {clearLabel}
        </button>
      </header>

      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.messageRow} ${
              message.role === 'user' ? styles.userRow : styles.assistantRow
            }`}
          >
            <div
              className={`${styles.bubble} ${
                message.role === 'user' ? styles.userBubble : styles.assistantBubble
              }`}
            >
              {message.role === 'assistant' ? <div className={styles.avatarLine}>🤖 AI Coach</div> : null}
              {message.isLoading ? (
                <div className={styles.loadingDots} aria-label="loading">
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <RenderedContent content={message.content} />
              )}
              <div className={styles.timestamp}>{new Date(message.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <div className={styles.quickPrompts}>
          {QUICK_PROMPTS[lang].map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              className={styles.chip}
              onClick={() => {
                setInput(prompt.text)
                requestAnimationFrame(() => {
                  textareaRef.current?.focus()
                  autoResize()
                })
              }}
            >
              {prompt.label}
            </button>
          ))}
        </div>

        <div className={styles.sendRow}>
          <textarea
            ref={textareaRef}
            value={input}
            className={styles.textarea}
            placeholder={placeholder}
            onChange={(e) => {
              setInput(e.target.value)
              requestAnimationFrame(autoResize)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void sendMessage()
              }
            }}
          />
          <button
            type="button"
            className={styles.sendBtn}
            disabled={isLoading || !input.trim()}
            onClick={() => void sendMessage()}
          >
            {sendLabel}
          </button>
        </div>
        <div className={styles.metaRow}>
          <span>{lang === 'en' ? 'Enter to send, Shift+Enter newline' : 'Enter 送出，Shift+Enter 換行'}</span>
          <span>
            {!isUnlimited ? (
              <span className={styles.quotaHint}>
                {lang === 'en'
                  ? `${getRemaining()} / ${freeLimit} free today`
                  : lang === 'zh-CN'
                    ? `今日免費 ${getRemaining()} / ${freeLimit} 則`
                    : `今日免費 ${getRemaining()} / ${freeLimit} 則`}
              </span>
            ) : null}
            {input.length > 500 ? `${input.length}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

interface RenderedContentProps {
  /** 原始文字內容。 */
  content: string
}

/**
 * 簡易 Markdown 顯示：支援粗體、換行、編號清單。
 */
function RenderedContent({ content }: RenderedContentProps) {
  const lines = content.split('\n')
  const numbered = lines.every((line) => /^\s*\d+\.\s+/.test(line))

  if (numbered) {
    return (
      <ol className={styles.numberedList}>
        {lines.map((line) => (
          <li key={line}>{renderInline(line.replace(/^\s*\d+\.\s+/, ''))}</li>
        ))}
      </ol>
    )
  }

  return <p className={styles.content}>{lines.map((line, idx) => renderLine(line, idx))}</p>
}

/**
 * 轉換單行內容並在多行間插入換行。
 *
 * @param line - 單行文字。
 * @param idx - 行索引。
 * @returns React 節點。
 */
function renderLine(line: string, idx: number) {
  return (
    <span key={`${line}-${idx}`}>
      {renderInline(line)}
      <br />
    </span>
  )
}

/**
 * 解析 `**bold**` 為 `<strong>`。
 *
 * @param text - 要顯示的文字。
 * @returns React 節點陣列。
 */
function renderInline(text: string) {
  const parts = text.split(/(\*\*.+?\*\*)/g)
  return parts.map((part, idx) => {
    const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4
    if (!isBold) return <span key={`${part}-${idx}`}>{part}</span>
    return <strong key={`${part}-${idx}`}>{part.slice(2, -2)}</strong>
  })
}
