import { useOpponentType } from '../../contexts/OpponentTypeContext'
import { useTranslation } from '../../i18n/LanguageContext'
import type { OpponentType } from '../../types/opponentType'
import styles from './OpponentTypeSelector.module.css'

const SELECTABLE: OpponentType[] = ['gto', 'fish', 'nit', 'aggro', 'reg']

/**
 * 全域桌型切換：影響 RFI／翻後等測驗之預期答案。
 */
export interface OpponentTypeSelectorProps {
  /** 為 true 時選項橫向一排捲動（行動版頂列）。 */
  scrollRow?: boolean
}

/**
 * 全域桌型切換：影響 RFI／翻後等測驗之預期答案。
 */
export function OpponentTypeSelector({ scrollRow = false }: OpponentTypeSelectorProps) {
  const { t } = useTranslation()
  const { opponentType, setOpponentType } = useOpponentType()

  const labelFor = (type: OpponentType): string => {
    switch (type) {
      case 'gto':
        return t.opponent_type.gto
      case 'fish':
        return t.opponent_type.fish
      case 'nit':
        return t.opponent_type.nit
      case 'aggro':
        return t.opponent_type.aggro
      case 'reg':
        return t.opponent_type.reg
      default:
        return type
    }
  }

  return (
    <div
      className={`${styles.wrap} ${scrollRow ? styles.wrapScroll : ''}`}
      role="group"
      aria-label={t.opponent_type.label}
    >
      <span className={styles.label}>{t.opponent_type.label}</span>
      <div className={styles.row}>
        {SELECTABLE.map((type) => (
          <button
            key={type}
            type="button"
            className={`${styles.btn} ${opponentType === type ? styles.btnActive : ''} ${styles[`tone_${type}`]}`}
            onClick={() => setOpponentType(type)}
            aria-pressed={opponentType === type}
          >
            {labelFor(type)}
          </button>
        ))}
      </div>
    </div>
  )
}
