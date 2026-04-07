import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import type { AnalysisResult, LeakReport } from '../../utils/handHistoryAnalyzer'
import { analyzeHandHistory } from '../../utils/handHistoryAnalyzer'
import { parseHandHistory } from '../../utils/handHistoryParser'
import styles from './HandHistoryPage.module.css'

const MAX_BYTES = 5 * 1024 * 1024

type ChatRole = 'assistant' | 'user'

interface PendingImage {
  /** 本地預覽唯一 ID。 */
  id: string
  /** 原始檔案。 */
  file: File
  /** 由 URL.createObjectURL 建立的預覽網址。 */
  previewUrl: string
}

interface ChatMessage {
  /** 訊息唯一 ID。 */
  id: string
  /** 訊息角色。 */
  role: ChatRole
  /** 純文字訊息。 */
  text?: string
  /** 圖片預覽（僅顯示於目前會話）。 */
  images?: Array<{ id: string; url: string; name: string }>
  /** 若有分析結果則以卡片顯示。 */
  analysis?: AnalysisResult
}

export interface HandHistoryPageProps {
  /**
   * `embedded`：置於 {@link HandHistoryDialog} 內，隱藏頁面級標題（對話窗已顯示標題）。
   * `page`（預設）：獨立整頁。
   */
  variant?: 'page' | 'embedded'
}

/**
 * 手牌歷史檔上傳、解析與 AI／規則分析結果頁。
 */
export function HandHistoryPage({ variant = 'page' }: HandHistoryPageProps) {
  const { t, lang } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        lang === 'en'
          ? 'Paste a hand history, upload a .txt file, or send images. I will analyze it like a chat assistant.'
          : lang === 'zh-CN'
            ? '可直接贴上手牌历史、上传 .txt，或发送图片，我会用对话方式帮你分析。'
            : '可直接貼上手牌歷史、上傳 .txt，或傳送圖片，我會用對話方式幫你分析。',
    },
  ])
  const [input, setInput] = useState('')
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, busy, pendingImages])

  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    }
  }, [pendingImages])

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  /**
   * @param text - 手牌歷史原文
   */
  const runAnalysisByText = useCallback(
    async (text: string): Promise<AnalysisResult | null> => {
      let hands: ReturnType<typeof parseHandHistory>['hands']
      let stats: ReturnType<typeof parseHandHistory>['stats']
      try {
        ;({ hands, stats } = parseHandHistory(text))
      } catch {
        return null
      }
      if (hands.length === 0) return null
      try {
        return await analyzeHandHistory(stats, hands, lang)
      } catch {
        return null
      }
    },
    [lang],
  )

  /**
   * @param file - 使用者上傳的檔案（支援 .txt 與圖片）。
   */
  const handleIncomingFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_BYTES) {
        appendMessage({
          id: `err-size-${Date.now()}`,
          role: 'assistant',
          text: t.hand_history.error_file_size,
        })
        return
      }

      const lower = file.name.toLowerCase()
      const isText = lower.endsWith('.txt') || file.type.startsWith('text/')
      const isImage = file.type.startsWith('image/')

      if (isImage) {
        const previewUrl = URL.createObjectURL(file)
        setPendingImages((prev) => [
          ...prev,
          { id: `img-${Date.now()}-${Math.random()}`, file, previewUrl },
        ])
        return
      }

      if (!isText) {
        appendMessage({
          id: `err-type-${Date.now()}`,
          role: 'assistant',
          text: t.hand_history.error_parse,
        })
        return
      }

      let text = ''
      try {
        text = await file.text()
      } catch {
        appendMessage({
          id: `err-read-${Date.now()}`,
          role: 'assistant',
          text: t.hand_history.error_parse,
        })
        return
      }

      appendMessage({
        id: `user-file-${Date.now()}`,
        role: 'user',
        text: `${lang === 'en' ? 'Uploaded file' : lang === 'zh-CN' ? '已上传文件' : '已上傳檔案'}: ${file.name}`,
      })
      setBusy(true)
      const analysis = await runAnalysisByText(text)
      setBusy(false)
      if (!analysis) {
        appendMessage({
          id: `err-nohand-${Date.now()}`,
          role: 'assistant',
          text: t.hand_history.error_no_hands,
        })
        return
      }
      appendMessage({
        id: `analysis-${Date.now()}`,
        role: 'assistant',
        text: t.hand_history.results_title,
        analysis,
      })
    },
    [appendMessage, lang, runAnalysisByText, t.hand_history],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    files.forEach((file) => {
      void handleIncomingFile(file)
    })
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
      void handleIncomingFile(file)
    })
  }

  /**
   * @param leak - 單筆漏洞
   * @returns 對應訓練模式顯示名稱
   */
  const relatedTrainingLabel = (leak: LeakReport): string | undefined => {
    const m = leak.relatedMode
    if (!m) return undefined
    const map: Record<string, string> = {
      rfi: t.sidebar.rfi,
      vsrfi: t.sidebar.vs_rfi,
      vs_rfi: t.sidebar.vs_rfi,
      bvb: t.sidebar.bvb,
      vs3bet: t.sidebar.vs_3bet,
      vs4bet: t.sidebar.vs_4bet,
      cold4bet: t.sidebar.cold_4bet,
      'postflop-cbet': t.sidebar.postflop_cbet,
      pushfold: t.sidebar.push_fold,
      weakspots: t.sidebar.weak_spots,
    }
    return map[m]
  }

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((img) => img.id !== id)
    })
  }

  const sendMessage = async () => {
    const text = input.trim()
    const hasText = text.length > 0
    const hasImages = pendingImages.length > 0
    if (!hasText && !hasImages) return

    if (hasText && new TextEncoder().encode(text).length > MAX_BYTES) {
      appendMessage({
        id: `err-txt-size-${Date.now()}`,
        role: 'assistant',
        text: t.hand_history.error_file_size,
      })
      return
    }

    const imagePayload = pendingImages.map((img) => ({
      id: img.id,
      url: img.previewUrl,
      name: img.file.name,
    }))

    appendMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      text: hasText ? text : undefined,
      images: hasImages ? imagePayload : undefined,
    })

    setInput('')
    setPendingImages([])
    setBusy(true)

    const analysis = hasText ? await runAnalysisByText(text) : null
    setBusy(false)

    if (analysis) {
      appendMessage({
        id: `assistant-analysis-${Date.now()}`,
        role: 'assistant',
        text: t.hand_history.results_title,
        analysis,
      })
      return
    }

    if (hasImages && !hasText) {
      appendMessage({
        id: `assistant-img-${Date.now()}`,
        role: 'assistant',
        text:
          lang === 'en'
            ? 'Images received. Please add hand details (positions, stack sizes, actions, board) so I can analyze accurately.'
            : lang === 'zh-CN'
              ? '已收到图片。请补充手牌细节（位置、筹码深度、行动顺序、公共牌），我才能准确分析。'
              : '已收到圖片。請補充手牌細節（位置、籌碼深度、行動順序、公共牌），我才能準確分析。',
      })
      return
    }

    appendMessage({
      id: `assistant-generic-${Date.now()}`,
      role: 'assistant',
      text:
        lang === 'en'
          ? 'I can parse standard hand-history text directly. If you sent a screenshot, please include the key actions in text.'
          : lang === 'zh-CN'
            ? '我可以直接解析标准手牌历史文本。如果你传的是截图，请一并提供关键行动文字。'
            : '我可以直接解析標準手牌歷史文本。如果你傳的是截圖，請一併提供關鍵行動文字。',
    })
  }

  const embedded = variant === 'embedded'

  return (
    <div className={embedded ? styles.wrapEmbedded : styles.wrap}>
      {!embedded ? (
        <header className={styles.header}>
          <h1 className={styles.title}>{t.hand_history.title}</h1>
          <p className={styles.subtitle}>{t.hand_history.subtitle}</p>
        </header>
      ) : null}
      <div
        className={`${styles.chatShell} ${drag ? styles.drag : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <div className={styles.chatMessages}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${msg.role === 'user' ? styles.rowUser : styles.rowAssistant}`}
            >
              <div
                className={`${styles.messageBubble} ${
                  msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant
                }`}
              >
                {msg.text ? <p className={styles.messageText}>{msg.text}</p> : null}

                {msg.images && msg.images.length > 0 ? (
                  <div className={styles.messageImages}>
                    {msg.images.map((img) => (
                      <img key={img.id} src={img.url} alt={img.name} className={styles.messageImage} />
                    ))}
                  </div>
                ) : null}

                {msg.analysis ? (
                  <AnalysisCard
                    result={msg.analysis}
                    t={t}
                    relatedTrainingLabel={relatedTrainingLabel}
                  />
                ) : null}
              </div>
            </div>
          ))}
          {busy ? (
            <div className={`${styles.messageRow} ${styles.rowAssistant}`}>
              <div className={`${styles.messageBubble} ${styles.bubbleAssistant}`}>
                <div className={styles.typingDots} aria-label={t.hand_history.analyzing}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {pendingImages.length > 0 ? (
          <div className={styles.pendingImages}>
            {pendingImages.map((img) => (
              <div key={img.id} className={styles.pendingImageItem}>
                <img src={img.previewUrl} alt={img.file.name} className={styles.pendingImage} />
                <button
                  type="button"
                  className={styles.removeImageBtn}
                  onClick={() => removePendingImage(img.id)}
                  aria-label={t.pages.wrongbook_close}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.chatComposer}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={styles.chatInput}
            placeholder={t.hand_history.composer_placeholder}
            rows={5}
            aria-label={t.hand_history.composer_placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void sendMessage()
              }
            }}
          />
          <div className={styles.composerRow}>
            <p className={styles.composerHint}>{t.hand_history.composer_hint}</p>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,text/plain,image/*"
              className={styles.hiddenInput}
              multiple
              onChange={onInputChange}
            />
            <button type="button" className={styles.attachBtn} onClick={() => fileRef.current?.click()}>
              +
            </button>
            <button type="button" className={styles.sendBtn} onClick={() => void sendMessage()} disabled={busy}>
              {lang === 'en' ? 'Send' : lang === 'zh-CN' ? '发送' : '送出'}
            </button>
          </div>
        </div>
        <p className={styles.formats}>{t.hand_history.supported_formats} / PNG / JPG / WEBP</p>
      </div>
    </div>
  )
}

interface AnalysisCardProps {
  /** 已完成的分析結果。 */
  result: AnalysisResult
  /** i18n 字典。 */
  t: import('../../i18n/types').Translations
  /** 漏洞建議對應訓練模式名稱。 */
  relatedTrainingLabel: (leak: LeakReport) => string | undefined
}

/**
 * 在對話泡泡中顯示分析結果摘要。
 */
function AnalysisCard({ result, t, relatedTrainingLabel }: AnalysisCardProps) {
  return (
    <div className={styles.analysisCard}>
      <div className={styles.resultsHead}>
        <h3 className={styles.analysisTitle}>{t.hand_history.results_title}</h3>
        <span className={styles.meta}>
          {t.hand_history.hands_analyzed}: {result.stats.totalHands} | {result.stats.site} |{' '}
          {result.stats.stakes}
        </span>
      </div>

      <div className={styles.statGrid}>
        <StatCard
          label="VPIP"
          value={`${result.stats.vpip}%`}
          ok={result.stats.vpip >= 18 && result.stats.vpip <= 28}
          t={t}
        />
        <StatCard
          label="PFR"
          value={`${result.stats.pfr}%`}
          ok={result.stats.pfr >= 14 && result.stats.pfr <= 22}
          t={t}
        />
        <StatCard
          label="3bet"
          value={`${result.stats.threebet}%`}
          ok={result.stats.threebet >= 4 && result.stats.threebet <= 10}
          t={t}
        />
        <StatCard
          label="Fold to cbet"
          value={`${result.stats.foldToCbet}%`}
          ok={result.stats.foldToCbet >= 35 && result.stats.foldToCbet <= 55}
          t={t}
        />
        <StatCard
          label="Cbet"
          value={`${result.stats.cbet}%`}
          ok={result.stats.cbet >= 45 && result.stats.cbet <= 70}
          t={t}
        />
      </div>

      <div className={styles.leaksTitle}>
        {result.leaks.length > 0
          ? `${t.hand_history.leaks_found}: ${result.leaks.length}`
          : t.hand_history.no_leaks}
      </div>

      {result.leaks.slice(0, 3).map((leak, i) => (
        <div
          key={`${leak.title}-${i}`}
          className={`${styles.leak} ${
            leak.severity === 'high'
              ? styles.leakHigh
              : leak.severity === 'medium'
                ? styles.leakMed
                : styles.leakLow
          }`}
        >
          <div className={styles.leakTag}>
            [{leak.severity === 'high' ? t.hand_history.high : leak.severity === 'medium' ? t.hand_history.medium : t.hand_history.low}]{' '}
            {leak.category === 'preflop'
              ? t.hand_history.preflop_section
              : leak.category === 'postflop'
                ? t.hand_history.postflop_section
                : '—'}
          </div>
          <div className={styles.leakTitle}>{leak.title}</div>
          <div className={styles.leakDesc}>{leak.description}</div>
          <div className={styles.leakRec}>
            → {t.hand_history.practice_link}
            {relatedTrainingLabel(leak) ? `：${relatedTrainingLabel(leak)}` : ''}
          </div>
        </div>
      ))}

      {result.summary ? (
        <div className={styles.summary}>
          <strong>{t.hand_history.summary_title}: </strong>
          {result.summary}
        </div>
      ) : null}
    </div>
  )
}

function StatCard({
  label,
  value,
  ok,
  t,
}: {
  label: string
  value: string
  ok: boolean
  t: import('../../i18n/types').Translations
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statVal}>{value}</div>
      <div className={ok ? styles.statOk : styles.statWarn}>{ok ? `✓ ${t.hand_history.normal}` : '!'}</div>
    </div>
  )
}
