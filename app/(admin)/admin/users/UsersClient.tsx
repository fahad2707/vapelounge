'use client'
import { useCallback, useEffect, useState } from 'react'

interface SiteUser {
  id: string
  name: string
  email: string
  phone: string
  dob: string
  lastSource: string
  createdAt?: string
  updatedAt?: string
}

export default function UsersClient() {
  const [items, setItems] = useState<SiteUser[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch('/api/admin/users', { cache: 'no-store' })
      const j = (await r.json().catch(() => ({}))) as { users?: SiteUser[]; error?: string }
      if (!r.ok) {
        setErr(j.error || 'Failed to load users.')
        setItems([])
      } else {
        setItems(j.users || [])
      }
    } catch {
      setErr('Network error.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <>
      <div className="adm-page-head">
        <div>
          <div className="adm-page-title">User management</div>
          <div className="adm-page-sub">
            Customers who complete checkout (name, phone, email, date of birth) appear here automatically.
          </div>
        </div>
        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>

      {err && <div className="adm-error" style={{ marginBottom: 14 }}>{err}</div>}

      <div className="adm-card">
        {loading ? (
          <div className="adm-card-pad" style={{ color: '#64748B' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="adm-card-pad" style={{ color: '#64748B', textAlign: 'center' }}>
            No users yet. They are created when someone places an order on the website.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>DOB</th>
                  <th>Source</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {items.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name || '—'}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{u.dob || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{u.lastSource || '—'}</td>
                    <td style={{ fontSize: 12, color: '#64748B' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
