import styles from './UpgradeModal.module.css'

const DEFAULT_UPGRADE_HREF =
  (import.meta.env.VITE_UPGRADE_URL as string | undefined) ||
  'mailto:?subject=GTODrill%20Pro%20%E5%8D%87%E7%B4%9A&body=%E8%AB%8B%E5%95%8F%20Pro%20%E8%A8%82%E9%96%B1%E8%88%87%E4%BB%98%E6%AC%BE%E6%96%B9%E5%BC%8F%E3%80%82'

export interface UpgradeModalProps {
  /** 關閉對話框。 */
  onClose: () => void
}

/**
 * 免費／訪客點選 Pro 功能時顯示的升級說明（MVP：外連表單或 mailto）。
 */
export function UpgradeModal({ onClose }: UpgradeModalProps) {
  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="upgrade-title" className={styles.title}>
          🔒 Pro 功能
        </h2>
        <p className={styles.lead}>升級 Pro 解鎖所有訓練模式</p>
        <ul className={styles.list}>
          <li>BvB、VS 3BET、VS 4BET</li>
          <li>AI 教練無限使用</li>
          <li>手牌歷史分析</li>
          <li>弱點分析雲端同步</li>
        </ul>
        <p className={styles.price}>$8 / 月</p>
        <div className={styles.actions}>
          <a className={styles.primary} href={DEFAULT_UPGRADE_HREF} target="_blank" rel="noreferrer">
            升級 Pro
          </a>
          <button type="button" className={styles.secondary} onClick={onClose}>
            暫時不用
          </button>
        </div>
      </div>
    </div>
  )
}
