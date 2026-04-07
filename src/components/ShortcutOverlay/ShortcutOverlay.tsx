import type { Language } from '../../i18n/types'
import { useTranslation } from '../../i18n/LanguageContext'
import styles from './ShortcutOverlay.module.css'

/** 與 App / useKeyboard 對齊的訓練模式（BvB 拆成兩列） */
export type ShortcutTrainingMode =
  | 'rfi'
  | 'vsrfi'
  | 'bvb_bb'
  | 'bvb_sb'
  | 'vs3bet'
  | 'vs4bet'
  | 'cold4bet'
  | 'pushfold'
  | 'pushfoldchart'
  | 'postflop-cbet'
  | 'weakspots'

export type ShortcutRow = { keys: string; desc: string }

const COMMON_SHORTCUTS_ZH: ShortcutRow[] = [
  { keys: 'H', desc: '顯示/隱藏範圍圖表（適用模式）' },
  { keys: 'Space / Tab', desc: '下一手牌／下一題（結果階段）' },
  { keys: 'Backspace', desc: '重置統計' },
  { keys: '?', desc: '顯示/隱藏此快捷鍵面板' },
  { keys: 'Esc', desc: '關閉此面板' },
]

const COMMON_SHORTCUTS_EN: ShortcutRow[] = [
  { keys: 'H', desc: 'Toggle range chart (where supported)' },
  { keys: 'Space / Tab', desc: 'Next hand / next question (result phase)' },
  { keys: 'Backspace', desc: 'Reset stats' },
  { keys: '?', desc: 'Toggle this overlay' },
  { keys: 'Esc', desc: 'Close overlay' },
]

const MODE_ROWS_ZH: Record<ShortcutTrainingMode, ShortcutRow[]> = {
  rfi: [
    { keys: 'R', desc: '加注 (Raise)' },
    { keys: 'F', desc: '棄牌 (Fold)' },
    { keys: '1–5', desc: '切換練習位置 UTG→SB（結果階段）' },
  ],
  vsrfi: [
    { keys: 'R', desc: '3-Bet' },
    { keys: 'C', desc: '跟注 (Call)' },
    { keys: 'F', desc: '棄牌 (Fold)' },
    { keys: '1–5', desc: '切換對手開池位置（結果階段）' },
  ],
  bvb_bb: [
    { keys: 'R', desc: '3-Bet（BB 防守 SB 開牌）' },
    { keys: 'C', desc: 'Call' },
    { keys: 'F', desc: 'Fold' },
  ],
  bvb_sb: [
    { keys: 'B', desc: '4-Bet（SB 面對 BB 3-Bet）' },
    { keys: 'C', desc: 'Call' },
    { keys: 'F', desc: 'Fold' },
  ],
  vs3bet: [
    { keys: 'B', desc: '4-Bet' },
    { keys: 'C', desc: 'Call' },
    { keys: 'F', desc: 'Fold' },
    { keys: '1–5', desc: '切換開牌位置（結果階段）' },
  ],
  vs4bet: [
    { keys: 'C', desc: 'Call 跟注' },
    { keys: 'F', desc: 'Fold 棄牌' },
  ],
  cold4bet: [
    { keys: 'B', desc: '4-Bet' },
    { keys: 'C', desc: 'Call（僅 BTN/BB/CO 等有 cold call 範圍）' },
    { keys: 'F', desc: 'Fold' },
    { keys: '1–5', desc: '切換 Hero 位置 HJ→BB（結果階段）' },
  ],
  pushfold: [
    { keys: 'P', desc: '直推 (Push)' },
    { keys: 'F', desc: '棄牌 (Fold)' },
    { keys: '1–6', desc: '切換碼量 5/8/10/12/15/20 bb' },
    { keys: 'Q W E R T', desc: '切換位置 UTG/HJ/CO/BTN/SB' },
  ],
  pushfoldchart: [{ keys: '? / Esc', desc: '開啟或關閉說明' }],
  'postflop-cbet': [
    { keys: '1 / 2 / 3', desc: '第一／二／三選項（題目階段；題目有幾個選項就對應幾個鍵）' },
    { keys: '4', desc: '第四選項（若該題有四個選項）' },
  ],
  weakspots: [{ keys: '—', desc: '此頁為統計與複習入口，無題目快捷鍵' }],
}

const MODE_ROWS_EN: Record<ShortcutTrainingMode, ShortcutRow[]> = {
  rfi: [
    { keys: 'R', desc: 'Raise' },
    { keys: 'F', desc: 'Fold' },
    { keys: '1–5', desc: 'Cycle position UTG→SB (result phase)' },
  ],
  vsrfi: [
    { keys: 'R', desc: '3-Bet' },
    { keys: 'C', desc: 'Call' },
    { keys: 'F', desc: 'Fold' },
    { keys: '1–5', desc: 'Cycle villain open position (result)' },
  ],
  bvb_bb: [
    { keys: 'R', desc: '3-bet (BB vs SB open)' },
    { keys: 'C', desc: 'Call' },
    { keys: 'F', desc: 'Fold' },
  ],
  bvb_sb: [
    { keys: 'B', desc: '4-bet (SB vs BB 3-bet)' },
    { keys: 'C', desc: 'Call' },
    { keys: 'F', desc: 'Fold' },
  ],
  vs3bet: [
    { keys: 'B', desc: '4-bet' },
    { keys: 'C', desc: 'Call' },
    { keys: 'F', desc: 'Fold' },
    { keys: '1–5', desc: 'Cycle open position (result)' },
  ],
  vs4bet: [
    { keys: 'C', desc: 'Call' },
    { keys: 'F', desc: 'Fold' },
  ],
  cold4bet: [
    { keys: 'B', desc: '4-bet' },
    { keys: 'C', desc: 'Call (where cold-call range exists)' },
    { keys: 'F', desc: 'Fold' },
    { keys: '1–5', desc: 'Cycle hero seat HJ→BB (result)' },
  ],
  pushfold: [
    { keys: 'P', desc: 'Push' },
    { keys: 'F', desc: 'Fold' },
    { keys: '1–6', desc: 'Stack depth 5/8/10/12/15/20 bb' },
    { keys: 'Q W E R T', desc: 'Position UTG/HJ/CO/BTN/SB' },
  ],
  pushfoldchart: [{ keys: '? / Esc', desc: 'Open or close help' }],
  'postflop-cbet': [
    { keys: '1 / 2 / 3', desc: 'Options 1–3 (question phase)' },
    { keys: '4', desc: 'Option 4 (if available)' },
  ],
  weakspots: [{ keys: '—', desc: 'Stats hub — no quiz hotkeys' }],
}

/**
 * @param mode - 目前訓練模式
 * @param lang - 介面語言（英文用 EN 列，其餘用中文列）
 */
export function overlayRowsForTrainerMode(
  mode: ShortcutTrainingMode,
  lang: Language = 'zh-TW',
): { common: ShortcutRow[]; specific: ShortcutRow[] } {
  const zh = lang !== 'en'
  const common = zh ? COMMON_SHORTCUTS_ZH : COMMON_SHORTCUTS_EN
  const table = zh ? MODE_ROWS_ZH : MODE_ROWS_EN
  return { common, specific: table[mode] ?? table.rfi }
}

/**
 * @deprecated 請改用 {@link overlayRowsForTrainerMode} + {@link ShortcutOverlay} `mode`
 */
export function shortcutRowsFor(mode: ShortcutTrainingMode, lang: Language = 'zh-TW'): ShortcutRow[] {
  const { common, specific } = overlayRowsForTrainerMode(mode, lang)
  return [...common, ...specific]
}

export interface ShortcutOverlayProps {
  open: boolean
  onClose: () => void
  /** 兩欄版面：通用 + 模式專用 */
  mode?: ShortcutTrainingMode
  /** 自訂列（若傳入則忽略 mode，單欄顯示） */
  rows?: ShortcutRow[]
}

/**
 * 全螢幕快捷鍵說明；點背景關閉。
 */
export function ShortcutOverlay({ open, onClose, mode, rows }: ShortcutOverlayProps) {
  const { lang, t } = useTranslation()

  if (!open) return null

  const useTwoColumn = !rows && mode !== undefined
  const legacyFlat =
    rows ?? (mode ? shortcutRowsFor(mode, lang) : shortcutRowsFor('rfi', lang))
  const twoCol = mode ? overlayRowsForTrainerMode(mode, lang) : overlayRowsForTrainerMode('rfi', lang)

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-title"
      onClick={onClose}
    >
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <h2 id="shortcut-title" className={styles.title}>
          {t.pages.shortcut_overlay_title}
        </h2>
        {useTwoColumn ? (
          <div className={styles.twoCol}>
            <div className={styles.col}>
              <h3 className={styles.colTitle}>{t.pages.shortcut_col_general}</h3>
              <div className={styles.rows}>
                {twoCol.common.map((row) => (
                  <div key={row.keys} className={styles.row}>
                    <span className={styles.keys}>{row.keys}</span>
                    <span className={styles.desc}>{row.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.col}>
              <h3 className={styles.colTitle}>{t.pages.shortcut_col_mode}</h3>
              <div className={styles.rows}>
                {twoCol.specific.map((row) => (
                  <div key={row.keys} className={styles.row}>
                    <span className={styles.keys}>{row.keys}</span>
                    <span className={styles.desc}>{row.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.rows}>
            {legacyFlat.map((row) => (
              <div key={row.keys} className={styles.row}>
                <span className={styles.keys}>{row.keys}</span>
                <span className={styles.desc}>{row.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
