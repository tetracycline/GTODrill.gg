import { useCallback } from 'react'
import { getRFIPercent, isRFI } from '../../utils/ranges'
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
  const raisePct = getRFIPercent(matrixPosition)

  const getAction = useCallback(
    (idx: number) => (isRFI(idx, matrixPosition) ? 'raise' : 'fold'),
    [matrixPosition],
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
            getAction={getAction}
            highlightHandIdx={highlightHandIdx}
            flash={matrixFlash}
          />
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
