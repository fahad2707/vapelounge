'use client'
import { useState } from 'react'
import { formatCad } from '@/lib/currency'
import type { CartItem } from '@/lib/store'
import { TAX_RATE } from '@/lib/validation/order'

export default function CheckoutModal({
  items,
  subtotal,
  tax,
  total,
  onClose,
  onSuccess,
}: {
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  onClose: () => void
  onSuccess?: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    if (!name.trim() || !phone.trim() || !email.trim() || !dob) {
      setError('Please fill in name, phone, email, and date of birth.')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          dob,
          items: items.map(i => ({
            id: i.id,
            name: i.name,
            cat: i.cat,
            emoji: i.emoji,
            price: i.price,
            qty: i.qty,
          })),
        }),
      })
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; orderId?: string; error?: string }
      if (!r.ok) {
        setError(j.error || 'Could not place order. Try again.')
        setSubmitting(false)
        return
      }
      setOrderId(j.orderId || null)
      setDone(true)
      onSuccess?.()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="checkout-ov"
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 950,
        background: 'rgba(0,0,0,.72)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(480px, 100%)',
          maxHeight: 'min(90vh, 720px)',
          overflow: 'auto',
          background: 'var(--ink2)',
          border: '1px solid var(--line2)',
          padding: '24px 22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 id="checkout-title" style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400 }}>
            {done ? 'Order placed' : 'Checkout'}
          </h3>
          <button type="button" onClick={onClose} style={{ fontSize: 22, color: 'var(--fog)', lineHeight: 1 }} aria-label="Close">
            ×
          </button>
        </div>

        {done ? (
          <div style={{ fontSize: 14, color: 'var(--cream2)', lineHeight: 1.75 }}>
            <p style={{ marginBottom: 14 }}>
              <strong style={{ color: 'var(--gold)' }}>Your order has been placed.</strong>
              {orderId ? (
                <>
                  {' '}
                  Reference: <span style={{ fontFamily: 'monospace' }}>{orderId.slice(-8)}</span>
                </>
              ) : null}
            </p>
            <p style={{ marginBottom: 14 }}>
              We are <strong>unable to deliver</strong> at this time. Please visit our store to collect your order:
            </p>
            <p style={{ color: 'var(--fog)', marginBottom: 14 }}>
              17 Chalmers St S Unit B, Cambridge, ON N1R 5A9
            </p>
            <p>Bring your reference and a valid ID. We will have your items ready for pickup.</p>
            <button type="button" className="btn-fill" style={{ width: '100%', marginTop: 20 }} onClick={onClose}>
              <span>Done</span>
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--fog)', marginBottom: 16, lineHeight: 1.6 }}>
              Subtotal {formatCad(subtotal)} · HST ({Math.round(TAX_RATE * 100)}%) {formatCad(tax)} ·{' '}
              <strong style={{ color: 'var(--gold)' }}>Total {formatCad(total)}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                <span style={{ color: 'var(--fog)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Full name *</span>
                <input className="checkout-input" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                <span style={{ color: 'var(--fog)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Phone *</span>
                <input className="checkout-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                <span style={{ color: 'var(--fog)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Email *</span>
                <input className="checkout-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                <span style={{ color: 'var(--fog)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Date of birth *</span>
                <input className="checkout-input" type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </label>
            </div>

            {error && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}>{error}</p>}

            <button
              type="button"
              className="btn-fill"
              style={{ width: '100%' }}
              disabled={submitting}
              onClick={() => void submit()}
            >
              <span>{submitting ? 'Placing order…' : 'Place order →'}</span>
            </button>
          </>
        )}
      </div>
      <style>{`
        .checkout-input {
          width: 100%;
          padding: 10px 12px;
          background: var(--ink3);
          border: 1px solid var(--line2);
          color: var(--cream);
          font-family: var(--body);
          font-size: 14px;
          border-radius: 2px;
        }
        .checkout-input:focus {
          outline: none;
          border-color: var(--gold);
        }
      `}</style>
    </div>
  )
}
