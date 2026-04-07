import {
  handName,
  type BvBBBAction,
  type BvBSBVs3betAction,
  type Vs3betAction,
  type Vs4betAction,
  type VsRFIAction,
} from './ranges'

const STORAGE_KEY = 'gto-trainer-wrong-quiz'
const MAX_ENTRIES = 400

/** 錯題所屬訓練模式 */
export type WrongQuizMode = 'rfi' | 'vsrfi' | 'bvb' | 'vs3bet' | 'vs4bet' | 'pushfold'

/**
 * 單筆錯題紀錄（存於 localStorage）。
 */
export interface WrongQuizEntry {
  id: string
  /** Unix 毫秒時間戳 */
  t: number
  mode: WrongQuizMode
  /** 抽象手牌，如 AKs */
  handLabel: string
  handIdx: number
  /** 單行中文摘要，供列表與複製 */
  summary: string
}

const MODE_LABEL: Record<WrongQuizMode, string> = {
  rfi: 'RFI',
  vsrfi: 'VS RFI',
  bvb: 'BvB',
  vs3bet: 'VS 3-Bet',
  vs4bet: 'VS 4-Bet',
  pushfold: 'Push/Fold',
}

const EVT = 'gto-wrong-book-updated'

/**
 * @param handIdx - 0–168
 * @returns 抽象手牌字串（如 AKs）
 */
export function handLabelFromIdx(handIdx: number): string {
  const r = Math.floor(handIdx / 13)
  const c = handIdx % 13
  return handName(r, c)
}

function labelRfi(a: 'raise' | 'fold'): string {
  return a === 'raise' ? '開池' : '棄牌'
}

function labelVsRfi(a: VsRFIAction): string {
  if (a === '3bet') return '3-Bet'
  if (a === 'call') return '跟注'
  return '棄牌'
}

function labelBvB(a: BvBBBAction | BvBSBVs3betAction): string {
  if (a === '3bet') return '3-Bet'
  if (a === '4bet') return '4-Bet'
  if (a === 'call') return '跟注'
  return '棄牌'
}

function labelVs3(a: Vs3betAction): string {
  if (a === '4bet') return '4-Bet'
  if (a === 'call') return '跟注'
  return '棄牌'
}

function labelVs4(a: Vs4betAction): string {
  return a === 'call' ? '跟注' : '棄牌'
}

function labelPush(a: 'push' | 'fold'): string {
  return a === 'push' ? '直推' : '棄牌'
}

function notifyUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVT))
  }
}

/**
 * 讀取已儲存的錯題列表（新→舊）。
 */
export function loadWrongQuizEntries(): WrongQuizEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x): x is WrongQuizEntry =>
        x &&
        typeof x === 'object' &&
        typeof (x as WrongQuizEntry).id === 'string' &&
        typeof (x as WrongQuizEntry).summary === 'string',
    )
  } catch {
    return []
  }
}

/**
 * 寫入一筆錯題並觸發 {@link EVT}。
 */
export function appendWrongQuizEntry(
  partial: Omit<WrongQuizEntry, 'id' | 't'>,
): void {
  if (typeof window === 'undefined') return
  const entry: WrongQuizEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    t: Date.now(),
    ...partial,
  }
  const prev = loadWrongQuizEntries()
  const next = [entry, ...prev].slice(0, MAX_ENTRIES)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    notifyUpdated()
  } catch {
    /* quota 或 private mode：靜默略過 */
  }
}

/**
 * 清空錯題本。
 */
export function clearWrongQuizEntries(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    notifyUpdated()
  } catch {
    /* ignore */
  }
}

/**
 * 將所有摘要組成文字（複製用）。
 */
export function formatWrongBookForCopy(entries: WrongQuizEntry[]): string {
  if (entries.length === 0) return ''
  const lines = entries.map((e) => {
    const date = new Date(e.t).toLocaleString('zh-TW', { hour12: false })
    return `[${date}] [${MODE_LABEL[e.mode]}] ${e.summary}`
  })
  return lines.join('\n')
}

/** 自訂事件名稱，供 UI 訂閱刷新 */
export const WRONG_BOOK_EVENT = EVT

/**
 * RFI 答錯時寫入錯題本。
 */
export function recordRfiWrong(params: {
  position: string
  handIdx: number
  user: 'raise' | 'fold'
  gto: 'raise' | 'fold'
}): void {
  const handLabel = handLabelFromIdx(params.handIdx)
  appendWrongQuizEntry({
    mode: 'rfi',
    handIdx: params.handIdx,
    handLabel,
    summary: `${params.position} · ${handLabel} — 你：${labelRfi(params.user)} · GTO：${labelRfi(params.gto)}`,
  })
}

/**
 * VS RFI 答錯時寫入錯題本。
 */
export function recordVsRfiWrong(params: {
  villainPos: string
  heroPos: string
  handIdx: number
  user: VsRFIAction
  gto: VsRFIAction
}): void {
  const handLabel = handLabelFromIdx(params.handIdx)
  appendWrongQuizEntry({
    mode: 'vsrfi',
    handIdx: params.handIdx,
    handLabel,
    summary: `Villain ${params.villainPos} → Hero ${params.heroPos} · ${handLabel} — 你：${labelVsRfi(params.user)} · GTO：${labelVsRfi(params.gto)}`,
  })
}

/**
 * BvB 答錯時寫入錯題本。
 */
export function recordBvBWrong(params: {
  spot: 'bb_defend' | 'sb_vs_3bet'
  handIdx: number
  user: BvBBBAction | BvBSBVs3betAction
  gto: BvBBBAction | BvBSBVs3betAction
}): void {
  const handLabel = handLabelFromIdx(params.handIdx)
  const spotLabel = params.spot === 'bb_defend' ? 'BB 防守' : 'SB vs 3-Bet'
  appendWrongQuizEntry({
    mode: 'bvb',
    handIdx: params.handIdx,
    handLabel,
    summary: `${spotLabel} · ${handLabel} — 你：${labelBvB(params.user)} · GTO：${labelBvB(params.gto)}`,
  })
}

/**
 * VS 3-Bet 答錯時寫入錯題本。
 */
export function recordVs3betWrong(params: {
  openerPos: string
  handIdx: number
  user: Vs3betAction
  gto: Vs3betAction
}): void {
  const handLabel = handLabelFromIdx(params.handIdx)
  appendWrongQuizEntry({
    mode: 'vs3bet',
    handIdx: params.handIdx,
    handLabel,
    summary: `開池 ${params.openerPos} · ${handLabel} — 你：${labelVs3(params.user)} · GTO：${labelVs3(params.gto)}`,
  })
}

/**
 * VS 4-Bet 答錯時寫入錯題本。
 */
export function recordVs4betWrong(params: {
  handIdx: number
  user: Vs4betAction
  gto: Vs4betAction
}): void {
  const handLabel = handLabelFromIdx(params.handIdx)
  appendWrongQuizEntry({
    mode: 'vs4bet',
    handIdx: params.handIdx,
    handLabel,
    summary: `${handLabel} — 你：${labelVs4(params.user)} · GTO：${labelVs4(params.gto)}`,
  })
}

/**
 * Push/Fold 答錯時寫入錯題本。
 */
export function recordPushFoldWrong(params: {
  position: string
  stackBb: number
  handIdx: number
  user: 'push' | 'fold'
  gto: 'push' | 'fold'
}): void {
  const handLabel = handLabelFromIdx(params.handIdx)
  appendWrongQuizEntry({
    mode: 'pushfold',
    handIdx: params.handIdx,
    handLabel,
    summary: `${params.position} · ${params.stackBb}bb · ${handLabel} — 你：${labelPush(params.user)} · GTO：${labelPush(params.gto)}`,
  })
}

export { MODE_LABEL }
