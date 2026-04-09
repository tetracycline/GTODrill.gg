import type { Translations } from '../i18n/types'
import type { WrongQuizEntry } from './wrongBook'
import type { Vs3betAction, Vs4betAction, VsRFIAction } from './ranges'
import type { BvBBBAction, BvBSBVs3betAction } from './ranges'

/**
 * 訓練模式 id → 介面顯示名稱（錯題本、弱點複習共用）。
 *
 * @param mode - 如 `rfi`、`postflop-cbet`
 * @param p - `pages` 翻譯區塊
 */
export function trainingModeDisplayLabel(mode: string, p: Translations['pages']): string {
  switch (mode) {
    case 'rfi':
      return p.mode_display_rfi
    case 'vsrfi':
      return p.mode_display_vsrfi
    case 'bvb':
      return p.mode_display_bvb
    case 'vs3bet':
      return p.mode_display_vs3bet
    case 'vs4bet':
      return p.mode_display_vs4bet
    case 'cold4bet':
      return p.mode_display_cold4bet
    case 'pushfold':
      return p.mode_display_pushfold
    case 'postflop-cbet':
      return p.mode_display_postflop_cbet
    default:
      return mode
  }
}

function labelVsRfi(a: VsRFIAction, t: Translations): string {
  if (a === '3bet') return t.actions.three_bet
  if (a === 'call') return t.actions.call
  return t.actions.fold
}

function labelBvB(a: BvBBBAction | BvBSBVs3betAction, t: Translations): string {
  if (a === '3bet') return t.actions.three_bet
  if (a === '4bet') return t.actions.four_bet
  if (a === 'call') return t.actions.call
  return t.actions.fold
}

function labelVs3(a: Vs3betAction, t: Translations): string {
  if (a === '4bet') return t.actions.four_bet
  if (a === 'call') return t.actions.call
  return t.actions.fold
}

function labelVs4(a: Vs4betAction, t: Translations): string {
  return a === 'call' ? t.actions.call : t.actions.fold
}

function labelRfiFoldRaise(v: 'raise' | 'fold', t: Translations): string {
  return v === 'raise' ? t.actions.raise : t.actions.fold
}

function labelPushFold(v: 'push' | 'fold', t: Translations): string {
  return v === 'push' ? t.actions.push : t.actions.fold
}

/**
 * 依結構化 `parts` 組錯題單行摘要；無 `parts` 時回退既有繁中 `summary`。
 *
 * @param entry - 錯題紀錄
 * @param t - 完整翻譯
 */
export function formatWrongQuizEntryLine(entry: WrongQuizEntry, t: Translations): string {
  const p = entry.parts
  if (!p) return entry.summary
  const hand = entry.handLabel
  const you = t.pages.wrongbook_you_colon
  const gtoC = t.pages.wrongbook_gto_colon

  switch (p.k) {
    case 'rfi': {
      const u = labelRfiFoldRaise(p.user, t)
      const g = labelRfiFoldRaise(p.gto, t)
      if (p.solverGto !== undefined && p.solverGto !== p.gto) {
        const sg = labelRfiFoldRaise(p.solverGto, t)
        return `${p.position} · ${hand} — ${you}${u} · ${t.pages.wrongbook_table_expected_colon}${g} · ${t.pages.wrongbook_pure_gto_colon}${sg}`
      }
      return `${p.position} · ${hand} — ${you}${u} · ${gtoC}${g}`
    }
    case 'vsrfi': {
      const ctx = t.pages.wrongbook_vsrfi_ctx
        .replace('{villain}', p.villainPos)
        .replace('{hero}', p.heroPos)
      const u = labelVsRfi(p.user, t)
      const g = labelVsRfi(p.gto, t)
      return `${ctx} · ${hand} — ${you}${u} · ${gtoC}${g}`
    }
    case 'bvb': {
      const spot =
        p.spot === 'bb_defend' ? t.pages.wrongbook_spot_bb_defend : t.pages.wrongbook_spot_sb_vs_3bet
      const u = labelBvB(p.user, t)
      const g = labelBvB(p.gto, t)
      return `${spot} · ${hand} — ${you}${u} · ${gtoC}${g}`
    }
    case 'vs3bet': {
      const ctx = t.pages.wrongbook_vs3_ctx.replace('{opener}', p.openerPos).replace('{hand}', hand)
      const u = labelVs3(p.user, t)
      const g = labelVs3(p.gto, t)
      return `${ctx} — ${you}${u} · ${gtoC}${g}`
    }
    case 'vs4bet': {
      const u = labelVs4(p.user, t)
      const g = labelVs4(p.gto, t)
      return `${hand} — ${you}${u} · ${gtoC}${g}`
    }
    case 'pushfold': {
      const u = labelPushFold(p.user, t)
      const g = labelPushFold(p.gto, t)
      return `${p.position} · ${p.stackBb}bb · ${hand} — ${you}${u} · ${gtoC}${g}`
    }
    default:
      return entry.summary
  }
}

/**
 * 複製錯題本全文（日期依 `locale`、內容依目前語系）。
 *
 * @param entries - 錯題列表
 * @param t - 翻譯
 * @param locale - `Intl` locale，如 `zh-TW`、`en-US`
 */
export function formatWrongBookForCopy(entries: WrongQuizEntry[], t: Translations, locale: string): string {
  if (entries.length === 0) return ''
  return entries
    .map((e) => {
      const date = new Date(e.t).toLocaleString(locale, { hour12: false })
      const mode = trainingModeDisplayLabel(e.mode, t.pages)
      const line = formatWrongQuizEntryLine(e, t)
      return `[${date}] [${mode}] ${line}`
    })
    .join('\n')
}
