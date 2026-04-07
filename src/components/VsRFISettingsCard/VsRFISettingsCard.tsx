import { useTranslation } from '../../i18n/LanguageContext'
import styles from './VsRFISettingsCard.module.css'

const VILLAINS: { id: string; keyHint: string }[] = [
  { id: 'UTG', keyHint: '1' },
  { id: 'HJ', keyHint: '2' },
  { id: 'CO', keyHint: '3' },
  { id: 'BTN', keyHint: '4' },
  { id: 'SB', keyHint: '5' },
]

export interface VsRFISettingsCardProps {
  /** 單選：對手開池位置 */
  selectedVillain: string
  /** 單選：Hero 位置 */
  selectedHero: string
  heroIds: string[]
  onSelectVillain: (pos: string) => void
  onSelectHero: (pos: string) => void
  onOpenShortcuts: () => void
  onResetStats: () => void
}

/**
 * VS RFI：對手開池與 Hero 位置單選設定。
 */
export function VsRFISettingsCard({
  selectedVillain,
  selectedHero,
  heroIds,
  onSelectVillain,
  onSelectHero,
  onOpenShortcuts,
  onResetStats,
}: VsRFISettingsCardProps) {
  const { t } = useTranslation()
  const handleReset = () => {
    if (window.confirm(t.quiz.reset_confirm)) {
      onResetStats()
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.titleRow}>
        <span className={styles.title}>{t.pages.combo_settings}</span>
        <div className={styles.iconRow}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={t.quiz.keyboard_shortcuts}
            onClick={onOpenShortcuts}
          >
            ⌨
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={t.quiz.reset_stats}
            onClick={handleReset}
          >
            ↺
          </button>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.rowLabel}>{t.pages.villain_open}</div>
        <div className={styles.positions}>
          {VILLAINS.map(({ id, keyHint }) => (
            <div key={id} className={styles.posWrap}>
              <button
                type="button"
                className={`${styles.btnVillain} ${selectedVillain === id ? styles.btnVillainActive : ''}`}
                onClick={() => onSelectVillain(id)}
              >
                {id}
              </button>
              <span className={styles.keyHint}>({keyHint})</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.rowLabel}>{t.pages.hero_position}</div>
        <div className={styles.positions}>
          {heroIds.map((id) => (
            <div key={id} className={styles.posWrap}>
              <button
                type="button"
                className={`${styles.btnHero} ${selectedHero === id ? styles.btnHeroActive : ''}`}
                onClick={() => onSelectHero(id)}
              >
                {id}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
