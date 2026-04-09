import type { VercelRequest, VercelResponse } from '@vercel/node'

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ClaudeRequestBody {
  model?: string
  max_tokens?: number
  system?: string
  messages?: ClaudeMessage[]
}

const GEMINI_FALLBACK_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
] as const

/**
 * `chat.sendMessage` 使用前的歷史訊息格式。
 */
interface GeminiHistoryMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

/**
 * 轉換前端訊息格式為 Gemini chat history。
 *
 * @param messages - 前端送來的 messages
 */
function toGeminiHistory(messages: ClaudeMessage[]): GeminiHistoryMessage[] {
  return messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

/**
 * Claude 代理路徑改為 Gemini：前端仍呼叫 `/api/claude`，回傳格式維持 `{ content: [{type,text}] }`。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'MISSING_GEMINI_API_KEY' })

  let body: ClaudeRequestBody
  try {
    body = typeof req.body === 'string' ? (JSON.parse(req.body) as ClaudeRequestBody) : req.body
  } catch {
    return res.status(400).json({ error: 'INVALID_JSON' })
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  if (messages.length === 0) {
    return res.status(400).json({ error: 'INVALID_MESSAGES' })
  }

  const normalized = messages
    .slice(-20)
    .map((m) => ({ role: m.role, content: String(m.content ?? '').slice(0, 20000) }))
  const history = toGeminiHistory(normalized)
  const lastMessage = normalized[normalized.length - 1]?.content ?? ''
  if (!lastMessage.trim()) {
    return res.status(400).json({ error: 'EMPTY_LAST_MESSAGE' })
  }

  try {
    const preferred = body.model?.trim()
    const modelCandidates = preferred
      ? [preferred, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== preferred)]
      : [...GEMINI_FALLBACK_MODELS]

    let firstErr: string | null = null
    for (const modelName of modelCandidates) {
      try {
        const mergedLastMessage =
          typeof body.system === 'string' && body.system.trim()
            ? `[SYSTEM]\n${body.system.trim().slice(0, 12000)}\n\n[USER]\n${lastMessage}`
            : lastMessage
        const payload = {
          contents: [...history, { role: 'user', parts: [{ text: mergedLastMessage }] }],
          generationConfig: {
            maxOutputTokens: Math.min(Math.max(body.max_tokens ?? 1000, 64), 4000),
          },
        }
        const upstream = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        )
        if (!upstream.ok) {
          const errText = await upstream.text().catch(() => '')
          throw new Error(`MODEL_${modelName}:${upstream.status}:${errText.slice(0, 240)}`)
        }
        const data = (await upstream.json()) as GeminiGenerateResponse
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('\n').trim() ?? ''
        if (!text) throw new Error(`MODEL_${modelName}:EMPTY_TEXT`)
        return res.status(200).json({
          content: [{ type: 'text', text }],
          model: modelName,
        })
      } catch (e) {
        if (firstErr == null) {
          firstErr = e instanceof Error ? e.message : String(e)
        }
      }
    }
    return res.status(502).json({
      error: 'UPSTREAM_FAILED',
      detail: (firstErr ?? 'UNKNOWN').slice(0, 300),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UPSTREAM_FAILED'
    return res.status(502).json({ error: 'UPSTREAM_FAILED', detail: msg.slice(0, 300) })
  }
}
