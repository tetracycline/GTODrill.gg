import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { OpponentType } from '../types/opponentType'

const STORAGE_KEY = 'gto-opponent-type'

function normalizeOpponentType(v: string | null): OpponentType {
  if (v === 'gto' || v === 'fish' || v === 'nit' || v === 'reg' || v === 'aggro') return v
  return 'gto'
}

export interface OpponentTypeContextValue {
  opponentType: OpponentType
  setOpponentType: (type: OpponentType) => void
}

const OpponentTypeContext = createContext<OpponentTypeContextValue | null>(null)

/**
 * 全域桌型（對手模型）；影響 RFI／翻後等測驗之「預期答案」。
 */
export function OpponentTypeProvider({ children }: { children: ReactNode }) {
  const [opponentType, setOpponentTypeState] = useState<OpponentType>(() =>
    typeof localStorage !== 'undefined' ? normalizeOpponentType(localStorage.getItem(STORAGE_KEY)) : 'gto',
  )

  const setOpponentType = useCallback((type: OpponentType) => {
    setOpponentTypeState(type)
    try {
      localStorage.setItem(STORAGE_KEY, type)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ opponentType, setOpponentType }),
    [opponentType, setOpponentType],
  )

  return <OpponentTypeContext.Provider value={value}>{children}</OpponentTypeContext.Provider>
}

/**
 * @throws 若未包在 {@link OpponentTypeProvider} 內
 */
export function useOpponentType(): OpponentTypeContextValue {
  const ctx = useContext(OpponentTypeContext)
  if (!ctx) throw new Error('useOpponentType must be used within OpponentTypeProvider')
  return ctx
}
