import { useEffect } from 'react'
import type { QuizPhase } from './useQuiz'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

export type TrainingKeyboardMode =
  | 'rfi'
  | 'vsrfi'
  | 'bvb'
  | 'vs3bet'
  | 'vs4bet'
  | 'cold4bet'
  | 'pushfold'
  | 'pushfoldchart'
  | 'postflop-cbet'

/** BvB：BB 防守或 SB 面對 3-bet，決定 R/B/C/F 對應 */
export type BvbKeyboardSpot = 'bb' | 'sb'

const RFI_POS_MAP: Record<string, string> = {
  '1': 'UTG',
  '2': 'HJ',
  '3': 'CO',
  '4': 'BTN',
  '5': 'SB',
}

const COLD4BET_HERO_MAP: Record<string, string> = {
  '1': 'HJ',
  '2': 'CO',
  '3': 'BTN',
  '4': 'SB',
  '5': 'BB',
}

const PUSHFOLD_STACK_BY_KEY: Record<string, number> = {
  '1': 5,
  '2': 8,
  '3': 10,
  '4': 12,
  '5': 15,
  '6': 20,
}

const PUSHFOLD_POS_BY_KEY: Record<string, string> = {
  q: 'UTG',
  w: 'HJ',
  e: 'CO',
  r: 'BTN',
  t: 'SB',
}

export interface UseKeyboardOptions {
  mode: TrainingKeyboardMode
  /** BvB 專用：目前子情境 */
  bvbSpot?: BvbKeyboardSpot
  phase: QuizPhase
  shortcutOpen: boolean
  toggleShortcutOverlay: () => void
  closeShortcutOverlay: () => void
  onNextHand: () => void
  onToggleShowRange: () => void
  onResetStats: () => void
  onRfiRaise?: () => void
  onRfiFold?: () => void
  onRfiTogglePosition?: (pos: string) => void
  onVsRfiThreeBet?: () => void
  onVsRfiCall?: () => void
  onVsRfiFold?: () => void
  onVsRfiToggleVillain?: (pos: string) => void
  onVs3betFourbet?: () => void
  onVs3betCall?: () => void
  onVs3betFold?: () => void
  onVs3betToggleOpener?: (pos: string) => void
  onBvBbbThreeBet?: () => void
  onBvBbbCall?: () => void
  onBvBbbFold?: () => void
  onBvBsbFourbet?: () => void
  onBvBsbCall?: () => void
  onBvBsbFold?: () => void
  onVs4betCall?: () => void
  onVs4betFold?: () => void
  onCold4betFourbet?: () => void
  onCold4betCall?: () => void
  onCold4betFold?: () => void
  onCold4betToggleHero?: (pos: string) => void
  onPushFoldPush?: () => void
  onPushFoldFold?: () => void
  onPushFoldToggleStack?: (bb: number) => void
  onPushFoldTogglePos?: (pos: string) => void
  /** 翻後：依選項索引作答（0-based） */
  onPostflopOptionIndex?: (index: number) => void
  /** 翻後目前題目的選項數量 */
  postflopOptionCount?: number
}

/**
 * 依模式綁定快捷鍵；僅在目前掛載的頁面呼叫（單一 listener）。
 */
export function useKeyboard(options: UseKeyboardOptions): void {
  const {
    mode,
    bvbSpot = 'bb',
    phase,
    shortcutOpen,
    toggleShortcutOverlay,
    closeShortcutOverlay,
    onNextHand,
    onToggleShowRange,
    onResetStats,
    onRfiRaise,
    onRfiFold,
    onRfiTogglePosition,
    onVsRfiThreeBet,
    onVsRfiCall,
    onVsRfiFold,
    onVsRfiToggleVillain,
    onVs3betFourbet,
    onVs3betCall,
    onVs3betFold,
    onVs3betToggleOpener,
    onBvBbbThreeBet,
    onBvBbbCall,
    onBvBbbFold,
    onBvBsbFourbet,
    onBvBsbCall,
    onBvBsbFold,
    onVs4betCall,
    onVs4betFold,
    onCold4betFourbet,
    onCold4betCall,
    onCold4betFold,
    onCold4betToggleHero,
    onPushFoldPush,
    onPushFoldFold,
    onPushFoldToggleStack,
    onPushFoldTogglePos,
    onPostflopOptionIndex,
    postflopOptionCount = 0,
  } = options

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return

      if (e.key === '?') {
        e.preventDefault()
        toggleShortcutOverlay()
        return
      }

      if (e.key === 'Escape') {
        if (shortcutOpen) {
          e.preventDefault()
          closeShortcutOverlay()
        }
        return
      }

      if (shortcutOpen) return

      if (mode === 'postflop-cbet' && phase === 'question' && onPostflopOptionIndex) {
        if (e.key >= '1' && e.key <= '4') {
          const idx = parseInt(e.key, 10) - 1
          if (idx >= 0 && idx < postflopOptionCount) {
            e.preventDefault()
            onPostflopOptionIndex(idx)
          }
          return
        }
      }

      if (mode === 'pushfold') {
        if (e.key >= '1' && e.key <= '6') {
          const bb = PUSHFOLD_STACK_BY_KEY[e.key]
          if (bb !== undefined && onPushFoldToggleStack) {
            e.preventDefault()
            onPushFoldToggleStack(bb)
          }
          return
        }
        const lk0 = e.key.toLowerCase()
        const pos0 = PUSHFOLD_POS_BY_KEY[lk0]
        if (pos0 && onPushFoldTogglePos) {
          e.preventDefault()
          onPushFoldTogglePos(pos0)
          return
        }
      }

      if (phase === 'result' && (e.key === ' ' || e.key === 'Tab')) {
        e.preventDefault()
        onNextHand()
        return
      }

      if (mode === 'pushfoldchart') {
        return
      }

      if (mode === 'postflop-cbet') {
        /* 翻後模式無範圍圖表快捷鍵 */
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault()
        onToggleShowRange()
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        if (window.confirm('確定要重置統計嗎？')) {
          onResetStats()
        }
        return
      }

      if (phase !== 'question') {
        if (mode === 'rfi' && e.key >= '1' && e.key <= '5') {
          const pos = RFI_POS_MAP[e.key]
          if (pos && onRfiTogglePosition) {
            e.preventDefault()
            onRfiTogglePosition(pos)
          }
          return
        }
        if (mode === 'vsrfi' && e.key >= '1' && e.key <= '5') {
          const pos = RFI_POS_MAP[e.key]
          if (pos && onVsRfiToggleVillain) {
            e.preventDefault()
            onVsRfiToggleVillain(pos)
          }
          return
        }
        if (mode === 'vs3bet' && e.key >= '1' && e.key <= '5') {
          const pos = RFI_POS_MAP[e.key]
          if (pos && onVs3betToggleOpener) {
            e.preventDefault()
            onVs3betToggleOpener(pos)
          }
          return
        }
        if (mode === 'cold4bet' && e.key >= '1' && e.key <= '5') {
          const pos = COLD4BET_HERO_MAP[e.key]
          if (pos && onCold4betToggleHero) {
            e.preventDefault()
            onCold4betToggleHero(pos)
          }
          return
        }
        return
      }

      if (phase === 'question') {
        if (mode === 'rfi') {
          if (e.key === 'r' || e.key === 'R') {
            e.preventDefault()
            onRfiRaise?.()
            return
          }
          if (e.key === 'f' || e.key === 'F') {
            e.preventDefault()
            onRfiFold?.()
            return
          }
        }

        if (mode === 'vsrfi') {
          if (e.key === 'r' || e.key === 'R') {
            e.preventDefault()
            onVsRfiThreeBet?.()
            return
          }
          if (e.key === 'c' || e.key === 'C') {
            e.preventDefault()
            onVsRfiCall?.()
            return
          }
          if (e.key === 'f' || e.key === 'F') {
            e.preventDefault()
            onVsRfiFold?.()
            return
          }
        }

        if (mode === 'vs3bet') {
          if (e.key === 'b' || e.key === 'B') {
            e.preventDefault()
            onVs3betFourbet?.()
            return
          }
          if (e.key === 'c' || e.key === 'C') {
            e.preventDefault()
            onVs3betCall?.()
            return
          }
          if (e.key === 'f' || e.key === 'F') {
            e.preventDefault()
            onVs3betFold?.()
            return
          }
        }

        if (mode === 'bvb' && bvbSpot === 'bb') {
          if (e.key === 'r' || e.key === 'R') {
            e.preventDefault()
            onBvBbbThreeBet?.()
            return
          }
          if (e.key === 'c' || e.key === 'C') {
            e.preventDefault()
            onBvBbbCall?.()
            return
          }
          if (e.key === 'f' || e.key === 'F') {
            e.preventDefault()
            onBvBbbFold?.()
            return
          }
        }

        if (mode === 'bvb' && bvbSpot === 'sb') {
          if (e.key === 'b' || e.key === 'B') {
            e.preventDefault()
            onBvBsbFourbet?.()
            return
          }
          if (e.key === 'c' || e.key === 'C') {
            e.preventDefault()
            onBvBsbCall?.()
            return
          }
          if (e.key === 'f' || e.key === 'F') {
            e.preventDefault()
            onBvBsbFold?.()
            return
          }
        }

        if (mode === 'vs4bet') {
          if (e.key === 'c' || e.key === 'C') {
            e.preventDefault()
            onVs4betCall?.()
            return
          }
          if (e.key === 'f' || e.key === 'F') {
            e.preventDefault()
            onVs4betFold?.()
            return
          }
        }

        if (mode === 'cold4bet') {
          if (e.key === 'b' || e.key === 'B') {
            e.preventDefault()
            onCold4betFourbet?.()
            return
          }
          if (e.key === 'c' || e.key === 'C') {
            e.preventDefault()
            onCold4betCall?.()
            return
          }
          if (e.key === 'f' || e.key === 'F') {
            e.preventDefault()
            onCold4betFold?.()
            return
          }
        }

        if (mode === 'pushfold') {
          if (e.key === 'p' || e.key === 'P') {
            e.preventDefault()
            onPushFoldPush?.()
            return
          }
          if (e.key === 'f' || e.key === 'F') {
            e.preventDefault()
            onPushFoldFold?.()
            return
          }
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    mode,
    bvbSpot,
    phase,
    shortcutOpen,
    toggleShortcutOverlay,
    closeShortcutOverlay,
    onNextHand,
    onToggleShowRange,
    onResetStats,
    onRfiRaise,
    onRfiFold,
    onRfiTogglePosition,
    onVsRfiThreeBet,
    onVsRfiCall,
    onVsRfiFold,
    onVsRfiToggleVillain,
    onVs3betFourbet,
    onVs3betCall,
    onVs3betFold,
    onVs3betToggleOpener,
    onBvBbbThreeBet,
    onBvBbbCall,
    onBvBbbFold,
    onBvBsbFourbet,
    onBvBsbCall,
    onBvBsbFold,
    onVs4betCall,
    onVs4betFold,
    onCold4betFourbet,
    onCold4betCall,
    onCold4betFold,
    onCold4betToggleHero,
    onPushFoldPush,
    onPushFoldFold,
    onPushFoldToggleStack,
    onPushFoldTogglePos,
    onPostflopOptionIndex,
    postflopOptionCount,
  ])
}
