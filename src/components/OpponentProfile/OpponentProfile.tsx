import { useCallback, useId, useMemo, useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import {
  getExploitAdvice,
  type ExploitAdvice,
  type OpponentStats,
} from '../../utils/exploitAdjustments'
import styles from './OpponentProfile.module.css'

const PRESETS: Record<'fish' | 'reg' | 'shark' | 'nit', OpponentStats> = {
  fish: { vpip: 50, pfr: 15, threebet: 3, foldToCbet: 35 },
  reg: { vpip: 24, pfr: 18, threebet: 7, foldToCbet: 45 },
  shark: { vpip: 22, pfr: 17, threebet: 10, foldToCbet: 42 },
  nit: { vpip: 12, pfr: 10, threebet: 4, foldToCbet: 55 },
}

export interface OpponentProfileProps {
  /**
   * `inline`：置於右欄、範圍矩陣上方（預設）。
   * `floating`：畫面右上角固定（舊版行為）。
   */
  placement?: 'floating' | 'inline'
}

/**
 * 「對手資料」面板：可選輸入 HUD 風格統計並顯示剝削建議。
 */
export function OpponentProfile({ placement = 'inline' }: OpponentProfileProps) {
  const { t, lang } = useTranslation()
  const tp = t.opponent_profile
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [vpip, setVpip] = useState('')
  const [pfr, setPfr] = useState('')
  const [threebet, setThreebet] = useState('')
  const [foldToCbet, setFoldToCbet] = useState('')
  const [advices, setAdvices] = useState<ExploitAdvice[] | null>(null)

  const parseStat = useCallback((raw: string): number => {
    const n = Number.parseFloat(raw.trim())
    return Number.isFinite(n) ? n : 0
  }, [])

  const runAnalyze = useCallback(() => {
    const stats: OpponentStats = {
      vpip: parseStat(vpip),
      pfr: parseStat(pfr),
      threebet: parseStat(threebet),
      foldToCbet: parseStat(foldToCbet),
    }
    setAdvices(getExploitAdvice(stats, lang))
  }, [vpip, pfr, threebet, foldToCbet, lang, parseStat])

  const clearAll = useCallback(() => {
    setVpip('')
    setPfr('')
    setThreebet('')
    setFoldToCbet('')
    setAdvices(null)
  }, [])

  const applyPreset = useCallback((key: keyof typeof PRESETS) => {
    const s = PRESETS[key]
    setVpip(String(s.vpip))
    setPfr(String(s.pfr))
    setThreebet(String(s.threebet))
    setFoldToCbet(String(s.foldToCbet))
    setAdvices(getExploitAdvice(s, lang))
  }, [lang])

  const severityClass = useMemo(
    () => ({
      high: styles.cardHigh,
      medium: styles.cardMedium,
      low: styles.cardLow,
    }),
    [],
  )

  const badgeClass = useMemo(
    () => ({
      high: styles.badgeHigh,
      medium: styles.badgeMedium,
      low: styles.badgeLow,
    }),
    [],
  )

  const severityLabel = useMemo(
    () => ({
      high: tp.severity_high,
      medium: tp.severity_medium,
      low: tp.severity_low,
    }),
    [tp.severity_high, tp.severity_medium, tp.severity_low],
  )

  const btnClass = placement === 'floating' ? styles.fab : styles.toggleInline
  const panelClass = placement === 'floating' ? styles.panel : styles.panelInline

  const body = (
    <>
      <button
        type="button"
        className={btnClass}
        aria-expanded={open}
        aria-controls={`${uid}-opponent-panel`}
        onClick={() => setOpen((o) => !o)}
      >
        {tp.toggle_btn}
      </button>

      {open ? (
        <div
          id={`${uid}-opponent-panel`}
          className={panelClass}
          role="region"
          aria-label={tp.title}
        >
          <div className={styles.panelInner}>
            <div className={styles.headRow}>
              <h2 className={styles.title}>{tp.title}</h2>
              <span className={styles.optional}>{tp.optional}</span>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${uid}-vpip`}>
                  {tp.vpip}
                </label>
                <input
                  id={`${uid}-vpip`}
                  className={styles.input}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  value={vpip}
                  onChange={(e) => setVpip(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${uid}-pfr`}>
                  {tp.pfr}
                </label>
                <input
                  id={`${uid}-pfr`}
                  className={styles.input}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  value={pfr}
                  onChange={(e) => setPfr(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${uid}-3b`}>
                  {tp.threebet}
                </label>
                <input
                  id={`${uid}-3b`}
                  className={styles.input}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  value={threebet}
                  onChange={(e) => setThreebet(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${uid}-fcb`}>
                  {tp.fold_to_cbet}
                </label>
                <input
                  id={`${uid}-fcb`}
                  className={styles.input}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  value={foldToCbet}
                  onChange={(e) => setFoldToCbet(e.target.value)}
                />
              </div>
            </div>

            <p className={styles.presetsLabel}>{tp.presets}</p>
            <div className={styles.presetRow}>
              <button type="button" className={styles.presetBtn} onClick={() => applyPreset('fish')}>
                {tp.fish}
              </button>
              <button type="button" className={styles.presetBtn} onClick={() => applyPreset('reg')}>
                {tp.reg}
              </button>
              <button type="button" className={styles.presetBtn} onClick={() => applyPreset('shark')}>
                {tp.shark}
              </button>
              <button type="button" className={styles.presetBtn} onClick={() => applyPreset('nit')}>
                {tp.nit}
              </button>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.btnPrimary} onClick={runAnalyze}>
                {tp.analyze}
              </button>
              <button type="button" className={styles.btnGhost} onClick={clearAll}>
                {tp.clear}
              </button>
            </div>

            <h3 className={styles.sectionTitle}>{tp.adjustments}</h3>
            {advices === null ? (
              <p className={styles.emptyHint}>{tp.hint_before_analyze}</p>
            ) : advices.length === 0 ? (
              <p className={styles.emptyHint}>{tp.no_adjustments}</p>
            ) : (
              advices.map((a, i) => (
                <article
                  key={`${a.category}-${a.severity}-${i}`}
                  className={`${styles.card} ${severityClass[a.severity]}`}
                >
                  <span className={`${styles.badge} ${badgeClass[a.severity]}`}>
                    {severityLabel[a.severity]}
                  </span>
                  <p className={styles.adviceLine}>{a.advice}</p>
                  <p className={styles.adjustLine}>{a.adjustment}</p>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}
    </>
  )

  if (placement === 'inline') {
    return <div className={styles.wrapInline}>{body}</div>
  }

  return body
}
