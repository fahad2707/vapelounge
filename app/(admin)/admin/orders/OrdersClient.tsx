'use client'
import { useCallback, useEffect, useState } from 'react'

interface OrderItem {
  id: string
  name: string
  qty: number
  price: number
}

interface OrderRow {
  id: string
  customerName: string
  email: string
  phone: string
  dob: string
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  currency: string
  status: string
  createdAt?: string
}

function formatCad(n: number) {
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
}

export default function OrdersClient() {
  const [items, setItems] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch('/api/admin/orders', { cache: 'no-store' })
      const j = (await r.json().catch(() => ({}))) as { orders?: OrderRow[]; error?: string }
      if (!r.ok) {
        setErr(j.error || 'Failed to load orders.')
        setItems([])
      } else {
        setItems(j.orders || [])
      }
    } catch {
      setErr('Network error.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const open = items.find(o => o.id === openId)

  return (
    <>
      <div className="adm-page-head">
        <div>
          <div className="adm-page-title">Online orders</div>
          <div className="adm-page-sub">Orders placed on the website (in-store pickup). Includes 13% HST.</div>
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
            No online orders yet.
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(o => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{o.customerName}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{o.email}</div>
                  </td>
                  <td>{o.phone || '—'}</td>
                  <td style={{ color: '#0F172A', fontWeight: 500 }}>{formatCad(o.total)}</td>
                  <td>
                    <span className="adm-pill visible" style={{ fontSize: 10 }}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748B' }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}
                  </td>
                  <td>
                    <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setOpenId(o.id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(15,23,42,.4)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
          onClick={() => setOpenId(null)}
        >
          <div
            className="adm-card"
            style={{ width: 'min(520px,100%)', maxHeight: '85vh', overflow: 'auto', padding: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Order {open.id.slice(-8)}</h3>
            <p style={{ fontSize: 13, marginBottom: 8 }}>
              <strong>{open.customerName}</strong> · {open.email} · {open.phone}
            </p>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>DOB: {open.dob || '—'}</p>
            <ul style={{ fontSize: 13, marginBottom: 12, paddingLeft: 18 }}>
              {open.items.map((it, i) => (
                <li key={`${it.id}-${i}`}>
                  {it.name} × {it.qty} — {formatCad(it.price * it.qty)}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 13 }}>
              Subtotal {formatCad(open.subtotal)} · HST {formatCad(open.tax)} · <strong>Total {formatCad(open.total)}</strong>
            </p>
            <button type="button" className="adm-btn adm-btn-primary" style={{ marginTop: 16 }} onClick={() => setOpenId(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
