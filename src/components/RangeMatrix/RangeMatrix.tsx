import { Fragment, useState } from 'react'
import type { OpponentType } from '../../types/opponentType'
import {
  RANKS,
  getRFIMatrixCellKind,
  handIndex,
  handName,
  type RfiMatrixCellKind,
} from '../../utils/ranges'
import styles from './RangeMatrix.module.css'

export type MatrixFlash = 'correct' | 'wrong' | null

/** 矩陣著色模式 */
export type ColorMode = 'rfi' | 'vsrfi' | 'vs3bet' | 'vs4bet' | 'pushfold' | 'cold4bet'

export interface RangeMatrixProps {
  colorMode: ColorMode
  /** 回傳該格的策略標籤（如 raise / fold / 3bet / call / 4bet / push） */
  getAction: (handIdx: number) => string
  /** 目前測驗手牌；-1 表示不高亮 */
  highlightHandIdx: number
  flash: MatrixFlash
  /** 圖表模式：hover 顯示 tooltip */
  showTooltip?: boolean
  /**
   * RFI 模式：與 {@link matrixPosition} 一併傳入時，依桌型顯示 extra／removed 色塊。
   */
  opponentType?: OpponentType
  /** RFI 模式：練習位置（UTG…SB） */
  matrixPosition?: string
}

function resolveRfiTone(kind: RfiMatrixCellKind): string {
  if (kind === 'extra') return styles.cellExtra
  if (kind === 'removed') return styles.cellRemoved
  if (kind === 'raise') return styles.cellRaise
  return styles.cellFoldDark
}

function resolveToneClass(colorMode: ColorMode, action: string): string {
  if (colorMode === 'rfi') {
    return action === 'raise' ? styles.cellRaise : styles.cellFoldDark
  }
  if (colorMode === 'vsrfi') {
    if (action === '3bet') return styles.vsThreeBet
    if (action === 'call') return styles.cellCallGreen
    return styles.vsFold
  }
  if (colorMode === 'vs3bet' || colorMode === 'cold4bet') {
    if (action === '4bet') return styles.vs3betFourbet
    if (action === 'call') return styles.cellCallGreen
    return styles.vsFold
  }
  if (colorMode === 'vs4bet') {
    return action === 'call' ? styles.cellCallGreen : styles.vsFold
  }
  return action === 'push' ? styles.cellPush : styles.vsFold
}

function defaultTooltipLabel(
  colorMode: ColorMode,
  name: string,
  action: string,
): string {
  if (colorMode === 'pushfold') {
    return action === 'push' ? `${name} — Push ✓` : `${name} — Fold`
  }
  if (colorMode === 'vs4bet') {
    return action === 'call' ? `${name} — Call ✓` : `${name} — Fold`
  }
  return name
}

/**
 * @param kind - RFI 桌型著色類別
 * @param name - 手牌標籤
 */
function rfiTooltipWithKind(kind: RfiMatrixCellKind, name: string): string {
  if (kind === 'extra') return `${name} — + vs fish (not GTO open)`
  if (kind === 'removed') return `${name} — fold vs nit (removed from GTO open)`
  if (kind === 'raise') return `${name} — Raise`
  return `${name} — Fold`
}

/**
 * 13×13 範圍矩陣（多模式著色 + 可選 tooltip）。
 */
export function RangeMatrix({
  colorMode,
  getAction,
  highlightHandIdx,
  flash,
  showTooltip = false,
  opponentType,
  matrixPosition,
}: RangeMatrixProps) {
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)
  const hi = highlightHandIdx >= 0 && highlightHandIdx <= 168
  const hr = hi ? Math.floor(highlightHandIdx / 13) : -1
  const hc = hi ? highlightHandIdx % 13 : -1

  return (
    <div className={styles.wrap}>
      {tip && showTooltip ? (
        <div
          style={{
            position: 'fixed',
            left: tip.x + 12,
            top: tip.y + 12,
            zIndex: 2000,
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: '#fff',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {tip.text}
        </div>
      ) : null}
      <div className={styles.grid}>
        <div className={styles.corner} />
        {RANKS.map((rk) => (
          <div key={`col-${rk}`} className={styles.headerCell}>
            {rk}
          </div>
        ))}
        {RANKS.map((rowRank, r) => (
          <Fragment key={`row-${rowRank}`}>
            <div className={styles.rowHeader}>{rowRank}</div>
            {RANKS.map((_, c) => {
              const idx = handIndex(r, c)
              const action = getAction(idx)
              const rfiKind =
                colorMode === 'rfi' && matrixPosition
                  ? getRFIMatrixCellKind(idx, matrixPosition, opponentType ?? 'gto')
                  : null
              const tone =
                rfiKind != null ? resolveRfiTone(rfiKind) : resolveToneClass(colorMode, action)
              const isHi = r === hr && c === hc
              const flashClass =
                isHi && flash === 'correct'
                  ? styles.flashCorrect
                  : isHi && flash === 'wrong'
                    ? styles.flashWrong
                    : ''
              const nm = handName(r, c)

              return (
                <div
                  key={`cell-${r}-${c}`}
                  className={`${styles.cell} ${tone} ${isHi ? styles.highlight : ''} ${flashClass}`}
                  title={showTooltip ? undefined : undefined}
                  onMouseEnter={
                    showTooltip
                      ? (e) =>
                          setTip({
                            x: e.clientX,
                            y: e.clientY,
                            text:
                              colorMode === 'rfi' && rfiKind != null
                                ? rfiTooltipWithKind(rfiKind, nm)
                                : defaultTooltipLabel(colorMode, nm, action),
                          })
                      : undefined
                  }
                  onMouseMove={
                    showTooltip
                      ? (e) =>
                          setTip((t) =>
                            t
                              ? { ...t, x: e.clientX, y: e.clientY }
                              : {
                                  x: e.clientX,
                                  y: e.clientY,
                                  text:
                                    colorMode === 'rfi' && rfiKind != null
                                      ? rfiTooltipWithKind(rfiKind, nm)
                                      : defaultTooltipLabel(colorMode, nm, action),
                                },
                          )
                      : undefined
                  }
                  onMouseLeave={showTooltip ? () => setTip(null) : undefined}
                >
                  {nm}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
