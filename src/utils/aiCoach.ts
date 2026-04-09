const SYSTEM_PROMPT = `You are an expert GTO poker coach specializing in 6-max No Limit Hold'em cash games.
You help players from NL2 to NL25 improve their game.

Your coaching style:
- Use clear, simple language (avoid jargon when possible)
- Give concrete, actionable advice
- Reference GTO principles but also exploitative adjustments for low stakes
- When analyzing hands, structure your answer: Preflop -> Flop -> Turn -> River
- Keep answers concise (3-5 paragraphs max unless analyzing a full hand)
- Use emojis sparingly to make responses friendly
- Always respond in the user's preferred UI language (Traditional Chinese, Simplified Chinese, or English) as indicated in the system note below—even if their question is short or mixed.

Key principles you always follow:
- Position is crucial in poker
- Bet sizing should match board texture and range advantage
- Balance value bets with bluffs
- At NL2-25, exploit passive players by value betting wider and bluffing less
- GTO is the foundation, but exploitative adjustments beat fish

When the user asks a short strategic question in natural language (e.g. "SB facing BB 3-bet what do I do?", "btn open range?", mixed Chinese/English):
- Assume 100bb effective stacks and 6-max NLHE cash unless they specify otherwise
- Name the spot clearly (positions, action sequence)
- Give: (1) default GTO-style guidance, (2) one exploitative tweak vs typical microstakes pools
- If ranges are relevant, describe them in words or categories (not charts unless asked)

When the user message includes server-fetched link content (starts with explanation of a replay/share URL and raw HTML or text):
- Extract any hand actions, stacks, blinds, and board cards you can find from the markup or text
- If the page is mostly empty shell (client-rendered), say so honestly and ask them to paste the hand history text instead
- Then analyze whatever was recoverable, same structure as a pasted hand history

When a user pastes a hand history (contains "Poker Hand #" or "*** HOLE CARDS ***"):
- Identify the key decision points
- Analyze preflop action
- Analyze each postflop street
- Give a clear verdict: what was correct, what should be improved
- End with one key takeaway`

export interface CoachMessage {
  /** 訊息角色。 */
  role: 'user' | 'assistant'
  /** 訊息內容。 */
  content: string
}

/**
 * 呼叫 AI 教練 API，取得回覆文字。
 *
 * @param messages - 對話歷史（最新 10 則會送出）。
 * @param language - 使用者語系偏好。
 * @returns AI 教練回覆內容。
 */
export async function getCoachResponse(
  messages: CoachMessage[],
  language: 'zh-TW' | 'zh-CN' | 'en' = 'en',
): Promise<string> {
  const url = import.meta.env.DEV ? '/claude-proxy/v1/messages' : '/api/claude'

  const systemWithLang =
    SYSTEM_PROMPT +
    `\n\nCurrent user language preference: ${
      language === 'zh-TW'
        ? 'Traditional Chinese (繁體中文)'
        : language === 'zh-CN'
          ? 'Simplified Chinese (简体中文)'
          : 'English'
    }. Always respond in this language.`

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemWithLang,
    messages: messages.slice(-10),
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (import.meta.env.DEV) {
    headers['anthropic-version'] = '2023-06-01'
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`API error ${res.status}`)

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>
  }
  return data.content?.[0]?.text ?? '抱歉，無法取得回應。'
}
