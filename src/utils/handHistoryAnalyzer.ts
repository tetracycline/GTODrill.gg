import type { HandHistoryStats, ParsedHand } from './handHistoryParser'
import type { Language } from '../i18n/types'

export interface LeakReport {
  severity: 'high' | 'medium' | 'low'
  category: 'preflop' | 'postflop' | 'general'
  title: string
  description: string
  recommendation: string
  relatedMode?: string
}

export interface AnalysisResult {
  stats: HandHistoryStats
  leaks: LeakReport[]
  strengths: string[]
  summary: string
}

/** NL2–NL25 現金桌粗略參考區間 */
const BENCHMARKS = {
  vpip: { min: 18, max: 28 },
  pfr: { min: 14, max: 22 },
  pfr_vpip_gap: { max: 8 },
  threebet: { min: 4, max: 10 },
  foldToCbet: { min: 35, max: 55 },
  cbet: { min: 45, max: 70 },
  wtsd: { min: 22, max: 32 },
  wsd: { min: 48, max: 58 },
} as const

/**
 * @param stats - 聚合統計
 * @param language - 輸出語言
 * @returns 規則型漏洞列表
 */
export function detectRuleBasedLeaks(
  stats: HandHistoryStats,
  language: Language,
): LeakReport[] {
  const leaks: LeakReport[] = []
  const L = copyForLang(language)

  if (stats.totalHands < 5) return leaks

  if (stats.vpip > BENCHMARKS.vpip.max) {
    leaks.push({
      severity: 'medium',
      category: 'preflop',
      title: L.vpipHighTitle,
      description: L.vpipHighDesc(stats.vpip),
      recommendation: L.vpipHighRec,
      relatedMode: 'rfi',
    })
  } else if (stats.vpip < BENCHMARKS.vpip.min && stats.vpip > 0) {
    leaks.push({
      severity: 'low',
      category: 'preflop',
      title: L.vpipLowTitle,
      description: L.vpipLowDesc(stats.vpip),
      recommendation: L.vpipLowRec,
      relatedMode: 'rfi',
    })
  }

  if (stats.pfr > BENCHMARKS.pfr.max) {
    leaks.push({
      severity: 'medium',
      category: 'preflop',
      title: L.pfrHighTitle,
      description: L.pfrHighDesc(stats.pfr),
      recommendation: L.pfrHighRec,
      relatedMode: 'vs3bet',
    })
  } else if (stats.pfr < BENCHMARKS.pfr.min) {
    leaks.push({
      severity: 'medium',
      category: 'preflop',
      title: L.pfrLowTitle,
      description: L.pfrLowDesc(stats.pfr),
      recommendation: L.pfrLowRec,
      relatedMode: 'rfi',
    })
  }

  const gap = stats.vpip - stats.pfr
  if (gap > BENCHMARKS.pfr_vpip_gap.max && stats.vpip > 5) {
    leaks.push({
      severity: 'low',
      category: 'preflop',
      title: L.gapTitle,
      description: L.gapDesc(gap),
      recommendation: L.gapRec,
      relatedMode: 'rfi',
    })
  }

  if (stats.threebet > BENCHMARKS.threebet.max) {
    leaks.push({
      severity: 'low',
      category: 'preflop',
      title: L.threebetHighTitle,
      description: L.threebetHighDesc(stats.threebet),
      recommendation: L.threebetHighRec,
      relatedMode: 'vs3bet',
    })
  } else if (stats.threebet < BENCHMARKS.threebet.min && stats.totalHands > 30) {
    leaks.push({
      severity: 'medium',
      category: 'preflop',
      title: L.threebetLowTitle,
      description: L.threebetLowDesc(stats.threebet),
      recommendation: L.threebetLowRec,
      relatedMode: 'vs3bet',
    })
  }

  if (stats.foldToCbet > BENCHMARKS.foldToCbet.max && stats.foldToCbet > 0) {
    leaks.push({
      severity: 'high',
      category: 'postflop',
      title: L.ftcbHighTitle,
      description: L.ftcbHighDesc(stats.foldToCbet),
      recommendation: L.ftcbHighRec,
      relatedMode: 'postflop-cbet',
    })
  } else if (stats.foldToCbet < BENCHMARKS.foldToCbet.min && stats.foldToCbet >= 0) {
    leaks.push({
      severity: 'medium',
      category: 'postflop',
      title: L.ftcbLowTitle,
      description: L.ftcbLowDesc(stats.foldToCbet),
      recommendation: L.ftcbLowRec,
      relatedMode: 'postflop-cbet',
    })
  }

  if (stats.cbet < BENCHMARKS.cbet.min && stats.cbet > 0) {
    leaks.push({
      severity: 'medium',
      category: 'postflop',
      title: L.cbetLowTitle,
      description: L.cbetLowDesc(stats.cbet),
      recommendation: L.cbetLowRec,
      relatedMode: 'postflop-cbet',
    })
  } else if (stats.cbet > BENCHMARKS.cbet.max) {
    leaks.push({
      severity: 'low',
      category: 'postflop',
      title: L.cbetHighTitle,
      description: L.cbetHighDesc(stats.cbet),
      recommendation: L.cbetHighRec,
      relatedMode: 'postflop-cbet',
    })
  }

  if (stats.wtsd > BENCHMARKS.wtsd.max) {
    leaks.push({
      severity: 'low',
      category: 'general',
      title: L.wtsdHighTitle,
      description: L.wtsdHighDesc(stats.wtsd),
      recommendation: L.wtsdHighRec,
      relatedMode: 'weakspots',
    })
  }

  if (stats.wsd < BENCHMARKS.wsd.min && stats.wtsd > 15) {
    leaks.push({
      severity: 'medium',
      category: 'general',
      title: L.wsdLowTitle,
      description: L.wsdLowDesc(stats.wsd),
      recommendation: L.wsdLowRec,
      relatedMode: 'weakspots',
    })
  }

  if (stats.avgResult < -2) {
    leaks.push({
      severity: 'high',
      category: 'general',
      title: L.bbTitle,
      description: L.bbDesc(stats.avgResult),
      recommendation: L.bbRec,
      relatedMode: 'weakspots',
    })
  }

  return leaks.sort((a, b) => {
    const o = { high: 0, medium: 1, low: 2 }
    return o[a.severity] - o[b.severity]
  })
}

interface LeakStrings {
  vpipHighTitle: string
  vpipHighDesc: (n: number) => string
  vpipHighRec: string
  vpipLowTitle: string
  vpipLowDesc: (n: number) => string
  vpipLowRec: string
  pfrHighTitle: string
  pfrHighDesc: (n: number) => string
  pfrHighRec: string
  pfrLowTitle: string
  pfrLowDesc: (n: number) => string
  pfrLowRec: string
  gapTitle: string
  gapDesc: (n: number) => string
  gapRec: string
  threebetHighTitle: string
  threebetHighDesc: (n: number) => string
  threebetHighRec: string
  threebetLowTitle: string
  threebetLowDesc: (n: number) => string
  threebetLowRec: string
  ftcbHighTitle: string
  ftcbHighDesc: (n: number) => string
  ftcbHighRec: string
  ftcbLowTitle: string
  ftcbLowDesc: (n: number) => string
  ftcbLowRec: string
  cbetLowTitle: string
  cbetLowDesc: (n: number) => string
  cbetLowRec: string
  cbetHighTitle: string
  cbetHighDesc: (n: number) => string
  cbetHighRec: string
  wtsdHighTitle: string
  wtsdHighDesc: (n: number) => string
  wtsdHighRec: string
  wsdLowTitle: string
  wsdLowDesc: (n: number) => string
  wsdLowRec: string
  bbTitle: string
  bbDesc: (n: number) => string
  bbRec: string
}

/**
 * @param language - 介面語言
 */
function copyForLang(language: Language): LeakStrings {
  if (language === 'en') {
    return {
      vpipHighTitle: 'VPIP on the high side',
      vpipHighDesc: (n) =>
        `VPIP is ${n}%, above a typical solid range (~${BENCHMARKS.vpip.min}–${BENCHMARKS.vpip.max}%).`,
      vpipHighRec: 'Tighten opens and cold calls; drill RFI charts.',
      vpipLowTitle: 'VPIP very low',
      vpipLowDesc: (n) => `VPIP is ${n}%, which may be too nitty for max EV.`,
      vpipLowRec: 'Review steal and blind-defense spots.',
      pfrHighTitle: 'PFR high',
      pfrHighDesc: (n) => `PFR ${n}% — aggression may be too wide preflop.`,
      pfrHighRec: 'Practice vs 3-bet and 4-bet decisions.',
      pfrLowTitle: 'PFR low (too passive)',
      pfrLowDesc: (n) => `PFR ${n}% — you may limp/call too often.`,
      pfrLowRec: 'Prefer open-raising over limping; RFI training.',
      gapTitle: 'Large VPIP − PFR gap',
      gapDesc: (n) =>
        `Gap is ${n.toFixed(1)} pp — many hands enter pots without raising.`,
      gapRec: 'Convert more limps/calls into raises where appropriate.',
      threebetHighTitle: '3-bet frequency high',
      threebetHighDesc: (n) => `3-bet ${n}% — check if bluff 3-bets are balanced.`,
      threebetHighRec: 'Drill VS 3-bet / cold 4-bet spots.',
      threebetLowTitle: '3-bet frequency low',
      threebetLowDesc: (n) =>
        `3-bet ${n}% — you may fold too much vs opens or miss value 3-bets.`,
      threebetLowRec: 'Add more polarized 3-bets in good positions.',
      ftcbHighTitle: 'High fold to c-bet',
      ftcbHighDesc: (n) =>
        `Fold to c-bet ~${n}%, higher than a common target (~${BENCHMARKS.foldToCbet.min}–${BENCHMARKS.foldToCbet.max}%).`,
      ftcbHighRec: 'Practice postflop c-bet defense and floats.',
      ftcbLowTitle: 'Very low fold to c-bet',
      ftcbLowDesc: (n) =>
        `Fold to c-bet ~${n}% — you may defend too wide without a plan.`,
      ftcbLowRec: 'Study board textures and check-raise bluffs.',
      cbetLowTitle: 'C-bet frequency low',
      cbetLowDesc: (n) =>
        `C-bet ~${n}% — IP you might check back too often.`,
      cbetLowRec: 'Postflop c-bet sizing and range review.',
      cbetHighTitle: 'C-bet frequency very high',
      cbetHighDesc: (n) =>
        `C-bet ~${n}% — barreling/air may be too frequent.`,
      cbetHighRec: 'Balance value and bluffs by texture.',
      wtsdHighTitle: 'WTSD high',
      wtsdHighDesc: (n) =>
        `WTSD ~${n}% — going to showdown often can be costly.`,
      wtsdHighRec: 'Review thin calls and river decisions.',
      wsdLowTitle: 'W$SD low',
      wsdLowDesc: (n) =>
        `Won at showdown ~${n}% — may be calling down too light.`,
      wsdLowRec: 'Work on hand reading and pot odds.',
      bbTitle: 'Negative win rate (bb/hand)',
      bbDesc: (n) => `Average ~${n} bb/hand in sample — review biggest loss categories.`,
      bbRec: 'Use weak-spot review and one table focus.',
    }
  }

  const isCn = language === 'zh-CN'
  const t = (tw: string, cn: string) => (isCn ? cn : tw)

  return {
    vpipHighTitle: t('VPIP 偏高', 'VPIP 偏高'),
    vpipHighDesc: (n) =>
      t(
        `VPIP 為 ${n}%，高於常見穩健區間（約 ${BENCHMARKS.vpip.min}–${BENCHMARKS.vpip.max}%）。`,
        `VPIP 为 ${n}%，高于常见稳健区间（约 ${BENCHMARKS.vpip.min}–${BENCHMARKS.vpip.max}%）。`,
      ),
    vpipHighRec: t('收緊開牌與冷跟範圍，多練 RFI。', '收紧开牌与冷跟范围，多练 RFI。'),
    vpipLowTitle: t('VPIP 過低', 'VPIP 过低'),
    vpipLowDesc: (n) => t(`VPIP 僅 ${n}%，可能過緊而犧牲 EV。`, `VPIP 仅 ${n}%，可能过紧而牺牲 EV。`),
    vpipLowRec: t('檢視偷盲與大盲防守頻率。', '检视偷盲与大盲防守频率。'),
    pfrHighTitle: t('PFR 偏高', 'PFR 偏高'),
    pfrHighDesc: (n) => t(`PFR ${n}%，翻前攻擊可能過寬。`, `PFR ${n}%，翻前攻击可能过宽。`),
    pfrHighRec: t('加強面對 3-bet／4-bet 的決策。', '加强面对 3-bet／4-bet 的决策。'),
    pfrLowTitle: t('PFR 偏低（偏被動）', 'PFR 偏低（偏被动）'),
    pfrLowDesc: (n) => t(`PFR ${n}%，可能過度 limp／跟注。`, `PFR ${n}%，可能过度 limp／跟注。`),
    pfrLowRec: t('能 open 的牌優先加注，練 RFI。', '能 open 的牌优先加注，练 RFI。'),
    gapTitle: t('VPIP 與 PFR 差距偏大', 'VPIP 与 PFR 差距偏大'),
    gapDesc: (n) =>
      t(
        `差距約 ${n.toFixed(1)} 個百分點，許多進池手牌未以加注進池。`,
        `差距约 ${n.toFixed(1)} 个百分点，许多进池手牌未以加注进池。`,
      ),
    gapRec: t('減少無計畫跟注／limp，適度轉成加注。', '减少无计划跟注／limp，适度转成加注。'),
    threebetHighTitle: t('3-bet 頻率偏高', '3-bet 频率偏高'),
    threebetHighDesc: (n) => t(`3-bet ${n}%，檢查 bluff 3-bet 是否過多。`, `3-bet ${n}%，检查 bluff 3-bet 是否过多。`),
    threebetHighRec: t('練習 VS 3-bet、Cold 4-bet 情境。', '练习 VS 3-bet、Cold 4-bet 情境。'),
    threebetLowTitle: t('3-bet 頻率偏低', '3-bet 频率偏低'),
    threebetLowDesc: (n) =>
      t(
        `3-bet ${n}%，可能過度棄牌或錯過價值 3-bet。`,
        `3-bet ${n}%，可能过度弃牌或错过价值 3-bet。`,
      ),
    threebetLowRec: t('在有利位置增加極化 3-bet。', '在有利位置增加极化 3-bet。'),
    ftcbHighTitle: t('面對 c-bet 棄牌率偏高', '面对 c-bet 弃牌率偏高'),
    ftcbHighDesc: (n) =>
      t(
        `面對 c-bet 棄牌約 ${n}%，高於常見目標（約 ${BENCHMARKS.foldToCbet.min}–${BENCHMARKS.foldToCbet.max}%）。`,
        `面对 c-bet 弃牌约 ${n}%，高于常见目标（约 ${BENCHMARKS.foldToCbet.min}–${BENCHMARKS.foldToCbet.max}%）。`,
      ),
    ftcbHighRec: t('加強翻後 c-bet 防守、float 與繼續範圍。', '加强翻后 c-bet 防守、float 与继续范围。'),
    ftcbLowTitle: t('面對 c-bet 棄牌率過低', '面对 c-bet 弃牌率过低'),
    ftcbLowDesc: (n) =>
      t(
        `面對 c-bet 棄牌約 ${n}%，防守可能過寬而缺乏後續計畫。`,
        `面对 c-bet 弃牌约 ${n}%，防守可能过宽而缺乏后续计划。`,
      ),
    ftcbLowRec: t('依牌面質地調整，適度加入 check-raise bluff。', '依牌面质地调整，适度加入 check-raise bluff。'),
    cbetLowTitle: t('C-bet 頻率偏低', 'C-bet 频率偏低'),
    cbetLowDesc: (n) => t(`C-bet 約 ${n}%，有利位置可能過度 check back。`, `C-bet 约 ${n}%，有利位置可能过度 check back。`),
    cbetLowRec: t('複習翻後 c-bet 尺度與範圍。', '复习翻后 c-bet 尺度与范围。'),
    cbetHighTitle: t('C-bet 頻率過高', 'C-bet 频率过高'),
    cbetHighDesc: (n) => t(`C-bet 約 ${n}%，可能過度開槍或 bluff 過多。`, `C-bet 约 ${n}%，可能过度开枪或 bluff 过多。`),
    cbetHighRec: t('依價值／詐唬比例與牌面調整延續下注。', '依价值／诈唬比例与牌面调整延续下注。'),
    wtsdHighTitle: t('攤牌率（WTSD）偏高', '摊牌率（WTSD）偏高'),
    wtsdHighDesc: (n) => t(`WTSD 約 ${n}%，過度進入攤牌可能耗損 EV。`, `WTSD 约 ${n}%，过度进入摊牌可能耗损 EV。`),
    wtsdHighRec: t('檢討河牌薄跟注與邊緣抓雞。', '检讨河牌薄跟注与边缘抓鸡。'),
    wsdLowTitle: t('攤牌勝率（W$SD）偏低', '摊牌胜率（W$SD）偏低'),
    wsdLowDesc: (n) => t(`攤牌勝率約 ${n}%，可能過度跟到底。`, `摊牌胜率约 ${n}%，可能过度跟到底。`),
    wsdLowRec: t('加強讀牌與底池賠率判斷。', '加强读牌与底池赔率判断。'),
    bbTitle: t('平均每手 bb 明顯為負', '平均每手 bb 明显为负'),
    bbDesc: (n) => t(`樣本平均約 ${n} bb／手，建議檢視最大虧損類型。`, `样本平均约 ${n} bb／手，建议检视最大亏损类型。`),
    bbRec: t('搭配弱點複習、單桌專注與降級。', '搭配弱点复习、单桌专注与降级。'),
  }
}

/**
 * @param prompt - user prompt
 * @returns API 回傳文字區塊
 */
async function fetchClaudeJsonPrompt(prompt: string): Promise<string> {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  }
  const useProxy = import.meta.env.DEV
  const url = useProxy ? '/claude-proxy/v1/messages' : 'https://api.anthropic.com/v1/messages'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  }
  if (!useProxy && import.meta.env.VITE_ANTHROPIC_API_KEY) {
    headers['x-api-key'] = import.meta.env.VITE_ANTHROPIC_API_KEY
  }
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Claude API ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = (await res.json()) as { content?: Array<{ text?: string }> }
  return data.content?.[0]?.text ?? ''
}

/**
 * @param text - 模型回傳
 * @returns 解析後 JSON 或 null
 */
function tryParseAiPayload(text: string): {
  leaks: LeakReport[]
  strengths: string[]
  summary: string
} | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as {
      leaks?: unknown[]
      strengths?: string[]
      summary?: string
    }
    if (!Array.isArray(raw.leaks)) return null
    const leaks: LeakReport[] = []
    for (const x of raw.leaks) {
      if (!x || typeof x !== 'object') continue
      const o = x as Record<string, unknown>
      const severity = o.severity
      const category = o.category
      if (
        severity !== 'high' &&
        severity !== 'medium' &&
        severity !== 'low'
      )
        continue
      if (category !== 'preflop' && category !== 'postflop' && category !== 'general') continue
      leaks.push({
        severity,
        category,
        title: String(o.title ?? ''),
        description: String(o.description ?? ''),
        recommendation: String(o.recommendation ?? ''),
        relatedMode: o.relatedMode ? String(o.relatedMode) : undefined,
      })
    }
    return {
      leaks,
      strengths: Array.isArray(raw.strengths)
        ? raw.strengths.map((s) => String(s))
        : [],
      summary: typeof raw.summary === 'string' ? raw.summary : '',
    }
  } catch {
    return null
  }
}

/**
 * @param stats - 統計
 * @param ruleBasedLeaks - 已偵測規則漏洞
 * @param language - 語言代碼字串
 */
async function getAIAnalysis(
  stats: HandHistoryStats,
  ruleBasedLeaks: LeakReport[],
  language: string,
): Promise<{ leaks: LeakReport[]; strengths: string[]; summary: string }> {
  const langHint =
    language === 'en'
      ? 'Respond in English.'
      : language === 'zh-CN'
        ? '使用简体中文撰写 title、description、recommendation、strengths、summary。'
        : '使用繁體中文撰寫 title、description、recommendation、strengths、summary。'

  const prompt = `You are a poker coach. Given sample stats from parsed hand histories, output STRICT JSON only (no markdown), shape:
{"leaks":[{"severity":"high"|"medium"|"low","category":"preflop"|"postflop"|"general","title":"","description":"","recommendation":"","relatedMode":"rfi|vs3bet|postflop-cbet|weakspots|optional"}],"strengths":["..."],"summary":"..."}
${langHint}
Stats JSON:
${JSON.stringify(stats)}
Rule-based flags already found (do not duplicate verbatim; you may refine or add 0-3 new leaks):
${JSON.stringify(ruleBasedLeaks.map((l) => ({ title: l.title, severity: l.severity })))}
`

  const text = await fetchClaudeJsonPrompt(prompt)
  const parsed = tryParseAiPayload(text)
  if (!parsed) throw new Error('Invalid AI JSON')
  return parsed
}

/**
 * @param stats - 聚合統計
 * @param hands - 手牌樣本（供未來擴充）
 * @param language - UI 語言
 */
export async function analyzeHandHistory(
  stats: HandHistoryStats,
  _hands: ParsedHand[],
  language: Language,
): Promise<AnalysisResult> {
  const ruleLeaks = detectRuleBasedLeaks(stats, language)
  let leaks = [...ruleLeaks]
  let strengths: string[] = []
  let summary = ''

  const canCall =
    import.meta.env.DEV || Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY)

  if (canCall) {
    try {
      const ai = await getAIAnalysis(stats, ruleLeaks, language)
      strengths = ai.strengths
      summary = ai.summary
      const merged = [...ruleLeaks]
      for (const L of ai.leaks) {
        if (!merged.some((x) => x.title === L.title)) merged.push(L)
      }
      leaks = merged.sort((a, b) => {
        const o = { high: 0, medium: 1, low: 2 }
        return o[a.severity] - o[b.severity]
      })
    } catch {
      summary =
        language === 'en'
          ? 'AI deep dive unavailable; showing rule-based leaks only.'
          : language === 'zh-CN'
            ? '无法完成 AI 深度分析，仅显示规则检测结果。'
            : '無法完成 AI 深度分析，僅顯示規則檢測結果。'
    }
  } else {
    summary =
      language === 'en'
        ? 'Set VITE_ANTHROPIC_API_KEY for AI summary (dev uses Vite proxy).'
        : language === 'zh-CN'
          ? '请设置 VITE_ANTHROPIC_API_KEY 以启用 AI 总结（开发环境可走代理）。'
          : '請設定 VITE_ANTHROPIC_API_KEY 以啟用 AI 總結（開發環境可走代理）。'
  }

  if (!summary && ruleLeaks.length === 0) {
    summary =
      language === 'en'
        ? 'No major stat deviations vs rough benchmarks.'
        : language === 'zh-CN'
          ? '与粗略基准相比，未发现明显偏离。'
          : '與粗略基準相比，未發現明顯偏離。'
  }

  return { stats, leaks, strengths, summary }
}
