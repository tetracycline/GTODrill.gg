import { useCallback } from 'react'
import { useOpponentType } from '../../contexts/OpponentTypeContext'
import { getAdjustedRFIPercent, getAdjustedRFIAction } from '../../utils/exploitRanges'
import { useTranslation } from '../../i18n/LanguageContext'
import { RangeMatrix, type MatrixFlash } from '../RangeMatrix/RangeMatrix'
import styles from './RangePanel.module.css'

export interface RangePanelProps {
  showRange: boolean
  onToggleShowRange: () => void
  /** 與測驗一致之位置（著色與頁尾） */
  matrixPosition: string
  highlightHandIdx: number
  matrixFlash: MatrixFlash
}

/**
 * 顯示/隱藏範圍圖表切換與矩陣卡片。
 */
export function RangePanel({
  showRange,
  onToggleShowRange,
  matrixPosition,
  highlightHandIdx,
  matrixFlash,
}: RangePanelProps) {
  const { t } = useTranslation()
  const { opponentType } = useOpponentType()
  const raisePct = getAdjustedRFIPercent(matrixPosition, opponentType)

  const getAction = useCallback(
    (idx: number) =>
      getAdjustedRFIAction(idx, matrixPosition, opponentType) === 'raise' ? 'raise' : 'fold',
    [matrixPosition, opponentType],
  )

  return (
    <div>
      <button
        type="button"
        className={`${styles.toggle} ${showRange ? styles.toggleActive : ''}`}
        onClick={onToggleShowRange}
      >
        {showRange ? `◉ ${t.quiz.hide_range}` : `◉ ${t.quiz.show_range}`}
      </button>

      {showRange ? (
        <div className={styles.matrixCard}>
          <div className={styles.headerRow}>
            <span className={styles.headerLabel}>{t.quiz.current_settings}</span>
            <span className={styles.badge}>{matrixPosition}</span>
          </div>
          <RangeMatrix
            colorMode="rfi"
            opponentType={opponentType}
            matrixPosition={matrixPosition}
            getAction={getAction}
            highlightHandIdx={highlightHandIdx}
            flash={matrixFlash}
          />
          {opponentType === 'fish' || opponentType === 'nit' ? (
            <div className={styles.matrixLegend} role="note">
              {opponentType === 'fish' ? (
                <>
                  <div className={styles.legendTitle}>{t.quiz.range_legend_fish_title}</div>
                  <ul className={styles.legendList}>
                    <li>{t.quiz.range_legend_fish_amber}</li>
                    <li>{t.quiz.range_legend_fish_orange}</li>
                  </ul>
                </>
              ) : (
                <>
                  <div className={styles.legendTitle}>{t.quiz.range_legend_nit_title}</div>
                  <ul className={styles.legendList}>
                    <li>{t.quiz.range_legend_nit_dark}</li>
                    <li>{t.quiz.range_legend_nit_orange}</li>
                  </ul>
                </>
              )}
            </div>
          ) : null}
          <div className={styles.footer}>
            <span className={styles.footerLeft}>
              {t.quiz.based_on_rfi} {matrixPosition} RFI
            </span>
            <span className={styles.footerRight}>
              {t.quiz.raise_pct_footer.replace('{n}', String(raisePct))}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
