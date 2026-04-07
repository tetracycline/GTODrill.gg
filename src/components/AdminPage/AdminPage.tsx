import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { Profile } from '../../lib/supabase'
import styles from './AdminPage.module.css'

export interface AdminPageProps {
  /** 返回一般訓練介面。 */
  onBack: () => void
}

interface AdminPayload {
  profiles: Profile[]
  totalUsers: number
  proUsers: number
  activeToday: number
  monthlyRevenueUsd: number
}

/**
 * 管理員儀表板：呼叫 `/api/admin`（service role 於後端），可調整訂閱與 admin 旗標。
 */
export function AdminPage({ onBack }: AdminPageProps) {
  const { session, refreshProfile } = useAuth()
  const [data, setData] = useState<AdminPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [patchingId, setPatchingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session?.access_token) {
      setError('尚未登入')
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = (await res.json()) as AdminPayload & { error?: string }
      if (!res.ok) throw new Error(json.error ?? res.statusText)
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    void load()
  }, [load])

  const patchProfile = useCallback(
    async (userId: string, updates: Record<string, unknown>) => {
      if (!session?.access_token) return
      setPatchingId(userId)
      try {
        const res = await fetch('/api/admin', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, updates }),
        })
        const json = (await res.json()) as { error?: string }
        if (!res.ok) throw new Error(json.error ?? res.statusText)
        await load()
        await refreshProfile()
      } catch (e) {
        setError(e instanceof Error ? e.message : '更新失敗')
      } finally {
        setPatchingId(null)
      }
    },
    [session?.access_token, load, refreshProfile],
  )

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>管理員面板</h1>
        <button type="button" className={styles.back} onClick={onBack}>
          ← 返回訓練
        </button>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <p className={styles.muted}>載入中…</p> : null}

      {!loading && data ? (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>總用戶</p>
              <p className={styles.statValue}>{data.totalUsers}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>今日活躍</p>
              <p className={styles.statValue}>{data.activeToday}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Pro 訂閱</p>
              <p className={styles.statValue}>{data.proUsers}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>本月收入</p>
              <p className={styles.statValue}>${data.monthlyRevenueUsd}</p>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>加入時間</th>
                  <th className={styles.th}>訂閱</th>
                  <th className={styles.th}>管理員</th>
                  <th className={styles.th}>最後更新</th>
                </tr>
              </thead>
              <tbody>
                {data.profiles.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.td}>{p.email ?? '—'}</td>
                    <td className={styles.td}>
                      {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                    </td>
                    <td className={styles.td}>
                      <select
                        className={styles.select}
                        value={p.subscription_status}
                        disabled={patchingId === p.id}
                        onChange={(e) => {
                          const subscription_status = e.target.value as 'free' | 'pro'
                          void patchProfile(p.id, { subscription_status })
                        }}
                      >
                        <option value="free">free</option>
                        <option value="pro">pro</option>
                      </select>
                    </td>
                    <td className={styles.td}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={p.is_admin}
                        disabled={patchingId === p.id}
                        onChange={(e) => void patchProfile(p.id, { is_admin: e.target.checked })}
                        aria-label={`admin-${p.id}`}
                      />
                    </td>
                    <td className={styles.td}>
                      {p.updated_at
                        ? new Date(p.updated_at).toLocaleString()
                        : p.created_at
                          ? new Date(p.created_at).toLocaleString()
                          : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  )
}
