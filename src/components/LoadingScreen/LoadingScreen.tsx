import styles from './LoadingScreen.module.css'

/**
 * 全螢幕載入中畫面（驗證初始化時使用）。
 */
export function LoadingScreen() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden />
      <p className={styles.text}>載入中…</p>
    </div>
  )
}
