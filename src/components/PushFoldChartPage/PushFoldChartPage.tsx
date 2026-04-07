import { useCallback, useMemo, useState } from 'react'
import { isPush } from '../../utils/ranges'
import { useKeyboard } from '../../hooks/useKeyboard'
import { RangeMatrix } from '../RangeMatrix/RangeMatrix'
import { ShortcutOverlay } from '../ShortcutOverlay/ShortcutOverlay'
import { PUSH_FOLD_STACK_PRESETS } from '../../hooks/usePushFoldQuiz'
import { useTranslation } from '../../i18n/LanguageContext'
import styles from './PushFoldChartPage.module.css'

const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const

/**
 * Push/Fold 圖表（僅檢視、無測驗）。
 */
export function PushFoldChartPage() {
  const { t } = useTranslation()
  const [stackBb, setStackBb] = useState(10)
  const [position, setPosition] = useState<string>('BTN')
  const [shortcutOpen, setShortcutOpen] = useState(false)

  const getMatrixAction = useCallback(
    (idx: number) => (isPush(idx, stackBb, position) ? 'push' : 'fold'),
    [stackBb, position],
  )

  const { pushPct, pushCount } = useMemo(() => {
    let n = 0
    for (let i = 0; i < 169; i++) {
      if (isPush(i, stackBb, position)) n += 1
    }
    return {
      pushPct: Math.round((n / 169) * 10) / 10,
      pushCount: n,
    }
  }, [stackBb, position])

  const toggleShortcutOverlay = useCallback(() => setShortcutOpen((o) => !o), [])
  const closeShortcutOverlay = useCallback(() => setShortcutOpen(false), [])

  useKeyboard({
    mode: 'pushfoldchart',
    phase: 'question',
    shortcutOpen,
    toggleShortcutOverlay,
    closeShortcutOverlay,
    onNextHand: () => {},
    onToggleShowRange: () => {},
    onResetStats: () => {},
  })

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.sidebar.push_fold_chart}</h1>
        <p className={styles.subtitle}>{t.pages.pushfold_chart_subtitle}</p>
      </header>

      <div className={styles.shell}>
        <div className={styles.colLeft}>
          <div className={styles.settingsCard}>
            <div className={styles.titleRow}>
              <span className={styles.cardTitle}>{t.pages.chart_settings}</span>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={t.quiz.keyboard_shortcuts}
                onClick={() => setShortcutOpen(true)}
              >
                ⌨
              </button>
            </div>

            <div className={styles.stackDisplay}>
              <div className={styles.stackBig}>{stackBb} bb</div>
            </div>

            <input
              type="range"
              className={styles.slider}
              min={2}
              max={20}
              step={0.5}
              value={stackBb}
              onChange={(e) => setStackBb(Number(e.target.value))}
              aria-label={t.pages.chart_stack_aria}
            />
            <div className={styles.sliderLabels}>
              <span>2 bb</span>
              <span>20 bb</span>
            </div>

            <div className={styles.presetRow}>
              {PUSH_FOLD_STACK_PRESETS.map((bb) => (
                <button
                  key={bb}
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => setStackBb(bb)}
                >
                  {bb} bb
                </button>
              ))}
            </div>

            <div className={styles.rowLabel}>{t.pages.chart_position_row}</div>
            <div className={styles.positions}>
              {POSITIONS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.btnPos} ${position === id ? styles.btnPosActive : ''}`}
                  onClick={() => setPosition(id)}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryLine}>
              {t.pages.chart_push_line} {pushPct}%
            </div>
            <div className={styles.summaryCount}>
              {t.pages.chart_hands_count.replace('{n}', String(pushCount))}
            </div>
            <p className={styles.explain}>{t.pages.chart_note}</p>
          </div>
        </div>

        <div className={styles.colRight}>
          <div className={styles.matrixCard}>
            <div className={styles.headerRow}>
              <span className={styles.badgeBb}>{stackBb} bb</span>
              <span className={styles.badgePos}>{position}</span>
            </div>
            <RangeMatrix
              colorMode="pushfold"
              getAction={getMatrixAction}
              highlightHandIdx={-1}
              flash={null}
              showTooltip
            />
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={styles.dotP} aria-hidden />
                {t.pages.gto_push}
              </span>
              <span className={styles.legendItem}>
                <span className={styles.dotF} aria-hidden />
                {t.pages.gto_fold}
              </span>
            </div>
            <div className={styles.footer}>
              <span>{t.pages.chart_source}</span>
              <span className={styles.footerRight}>
                {t.pages.push_stat_pct_fmt.replace('{n}', String(pushPct))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ShortcutOverlay open={shortcutOpen} onClose={closeShortcutOverlay} mode="pushfoldchart" />
    </>
  )
}
