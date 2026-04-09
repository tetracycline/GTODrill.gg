import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAiDailyQuota } from '../../hooks/useAiDailyQuota'
import { useTranslation } from '../../i18n/LanguageContext'
import { getCoachResponse, type CoachMessage } from '../../utils/aiCoach'
import {
  formatCoachUserMessageFromFetchedUrl,
  isSingleLineHttpsUrl,
  mapHandUrlErrorToLabel,
  requestHandUrlFetch,
} from '../../utils/handUrlImportClient'
import styles from './AIChatPage.module.css'

const STORAGE_KEY = 'ai-coach-chat'
const MAX_MESSAGES = 20
const MAX_CONTEXT_MESSAGES = 10
const LONG_USER_BUBBLE = 2500

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
 * AI 教練對話頁：自然語言情境、手牌文字、HTTPS 重播連結（伺服端代抓）。
 */
export function AIChatPage({ isUnlimited = true, onFreeLimitReached }: AIChatPageProps) {
  const { t, lang } = useTranslation()
  const { canSend, recordUserMessage, getRemaining, freeLimit } = useAiDailyQuota(isUnlimited)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const createWelcomeMessage = useCallback(
    (): ChatMessage => ({
      id: 'welcome',
      role: 'assistant',
      content: t.pages.ai_chat_welcome,
      timestamp: Date.now(),
    }),
    [t.pages.ai_chat_welcome],
  )

  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage()])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const quickPrompts = useMemo(
    () => [
      { label: t.pages.ai_chat_quick_preflop_label, text: t.pages.ai_chat_quick_preflop_text },
      { label: t.pages.ai_chat_quick_hand_label, text: t.pages.ai_chat_quick_hand_text },
      { label: t.pages.ai_chat_quick_paste_label, text: t.pages.ai_chat_quick_paste_text },
      { label: t.pages.ai_chat_quick_gto_label, text: t.pages.ai_chat_quick_gto_text },
      { label: t.pages.ai_chat_quick_url_label, text: t.pages.ai_chat_quick_url_text },
      { label: t.pages.ai_chat_quick_spot_label, text: t.pages.ai_chat_quick_spot_text },
    ],
    [t],
  )

  useEffect(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav?.type === 'reload') {
      sessionStorage.removeItem(STORAGE_KEY)
      setMessages([createWelcomeMessage()])
      setHydrated(true)
      return
    }

    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setHydrated(true)
      return
    }
    try {
      const parsed = JSON.parse(raw) as ChatMessage[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed.slice(-MAX_MESSAGES))
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
    }
    setHydrated(true)
  }, [createWelcomeMessage])

  useEffect(() => {
    if (!hydrated) return
    setMessages((m) => {
      if (m.length === 1 && m[0]?.id === 'welcome') {
        return [createWelcomeMessage()]
      }
      return m
    })
  }, [lang, hydrated, createWelcomeMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const clean = messages.filter((m) => !m.isLoading).slice(-MAX_MESSAGES)
    if (hydrated) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
    }
  }, [messages, hydrated])

  /**
   * 依內容自動調整輸入框高度。
   */
  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const urlErrorLabels = useMemo(
    () => ({
      https: t.pages.ai_chat_fetch_https,
      invalid: t.pages.ai_chat_fetch_invalid,
      privateHost: t.pages.ai_chat_fetch_private,
      timeout: t.pages.ai_chat_fetch_timeout,
      failed: t.pages.ai_chat_fetch_failed,
    }),
    [t],
  )

  /**
   * 傳送訊息並呼叫 AI 教練回覆（單行 https 會先經伺服端抓取）。
   */
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    if (!canSend()) {
      onFreeLimitReached?.()
      return
    }

    const trimmed = input.trim()
    let userPayload = trimmed

    if (isSingleLineHttpsUrl(trimmed)) {
      setInput('')
      setIsLoading(true)
      const fr = await requestHandUrlFetch(trimmed)
      if (!fr.ok) {
        setIsLoading(false)
        const errText = mapHandUrlErrorToLabel(fr.error, urlErrorLabels)
        const errMsg: ChatMessage = {
          id: `assistant-fetch-err-${Date.now()}`,
          role: 'assistant',
          content: errText,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, errMsg].slice(-MAX_MESSAGES))
        return
      }
      userPayload = formatCoachUserMessageFromFetchedUrl(trimmed, fr.text, lang)
    } else {
      setInput('')
    }

    setIsLoading(true)

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userPayload,
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
      setMessages((prev) =>
        prev
          .map((m) =>
            m.isLoading ? { ...m, content: t.pages.ai_chat_unavailable, isLoading: false } : m,
          )
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.nav.ai_coach}</h1>
        <button type="button" className={styles.clearBtn} onClick={clearConversation}>
          {t.pages.ai_chat_clear}
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
              } ${message.role === 'user' && message.content.length > LONG_USER_BUBBLE ? styles.userBubbleScroll : ''}`}
            >
              {message.role === 'assistant' ? <div className={styles.avatarLine}>🤖 {t.nav.ai_coach}</div> : null}
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
          {quickPrompts.map((prompt) => (
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
            placeholder={t.pages.ai_chat_placeholder}
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
            ↵
          </button>
        </div>
        <div className={styles.metaRow}>
          <span>{t.pages.ai_chat_enter_hint}</span>
          <span>
            {!isUnlimited ? (
              <span className={styles.quotaHint}>
                {t.pages.ai_chat_quota_fmt
                  .replace('{rem}', String(getRemaining()))
                  .replace('{limit}', String(freeLimit))}
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
