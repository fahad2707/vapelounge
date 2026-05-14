'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../_components/Modal'

interface AdminProduct {
  handleId: string
  name: string
  image: string
  brand: string | null
  variantGroupId?: string | null
}
interface Group { id: string; name: string; productHandleIds: string[] }

export default function VariantsClient() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Group | null>(null)
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const [p, g] = await Promise.all([
        fetch('/api/admin/products', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/admin/variants', { cache: 'no-store' }).then(r => r.json()),
      ])
      setProducts(Array.isArray(p?.products) ? p.products : [])
      setGroups(Array.isArray(g?.groups) ? g.groups : [])
    } catch { setErr('Network error.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const productByHandle = useMemo(() => {
    const m = new Map<string, AdminProduct>()
    for (const p of products) m.set(p.handleId, p)
    return m
  }, [products])

  const openAdd = () => { setEditing(null); setName(''); setPicked(new Set()); setSearch(''); setFormErr(null); setOpen(true) }
  const openEdit = (g: Group) => {
    setEditing(g); setName(g.name); setPicked(new Set(g.productHandleIds)); setSearch(''); setFormErr(null); setOpen(true)
  }

  const toggle = (handleId: string) => {
    setPicked(s => {
      const n = new Set(s)
      if (n.has(handleId)) n.delete(handleId)
      else n.add(handleId)
      return n
    })
  }

  const save = useCallback(async () => {
    setFormErr(null); setSubmitting(true)
    try {
      const url = editing ? `/api/admin/variants/${editing.id}` : '/api/admin/variants'
      const method = editing ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, productHandleIds: Array.from(picked) }),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) { setFormErr(j.error || 'Could not save.'); setSubmitting(false); return }
      setOpen(false); void load()
    } catch { setFormErr('Network error.') }
    finally { setSubmitting(false) }
  }, [editing, name, picked, load])

  const remove = useCallback(async (g: Group) => {
    if (!window.confirm(`Delete variant group "${g.name}"? Products will be unlinked.`)) return
    try {
      const r = await fetch(`/api/admin/variants/${g.id}`, { method: 'DELETE' })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) { setErr(j.error || 'Could not delete.'); return }
      void load()
    } catch { setErr('Network error.') }
  }, [load])

  const needle = search.trim().toLowerCase()
  const visibleProducts = needle
    ? products.filter(p =>
        p.name.toLowerCase().includes(needle) ||
        (p.brand || '').toLowerCase().includes(needle))
    : products

  return (
    <>
      <div className="adm-page-head">
        <div>
          <div className="adm-page-title">Variants</div>
          <div className="adm-page-sub">
            Club separate products (different flavours of the same model) so visitors see them as one product with flavour choices.
          </div>
        </div>
        <button type="button" className="adm-btn adm-btn-primary" onClick={openAdd}>
          + Create variant group
        </button>
      </div>

      {err && <div className="adm-error" style={{ marginBottom: 14 }}>{err}</div>}

      {loading ? (
        <div className="adm-card adm-card-pad" style={{ color: '#64748B' }}>Loading…</div>
      ) : groups.length === 0 ? (
        <div className="adm-card adm-card-pad" style={{ color: '#64748B', textAlign: 'center' }}>
          No variant groups yet. Group flavours like “Elf Bar 5K (watermelon / guava / strawberry)” to display them together on the site.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {groups.map(g => (
            <div key={g.id} className="adm-card">
              <div className="adm-card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <Link href={`/admin/variants/${g.id}`} style={{ color: '#0F172A', fontWeight: 600 }}>{g.name}</Link>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{g.productHandleIds.length} product(s)</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/admin/variants/${g.id}`} className="adm-btn adm-btn-ghost adm-btn-sm">Open</Link>
                  <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => openEdit(g)}>Edit</button>
                  <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => remove(g)}>Delete</button>
                </div>
              </div>
              <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {g.productHandleIds.map(h => {
                  const p = productByHandle.get(h)
                  return (
                    <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12.5 }}>
                      {p?.image && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.image} alt="" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4 }} />
                      )}
                      <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p?.name || h}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal
          title={editing ? 'Edit variant group' : 'Create variant group'}
          onClose={() => !submitting && setOpen(false)}
          maxWidth={760}
          footer={
            <>
              <button type="button" className="adm-btn adm-btn-ghost" disabled={submitting} onClick={() => setOpen(false)}>Cancel</button>
              <button
                type="button"
                className="adm-btn adm-btn-primary"
                disabled={submitting || !name.trim() || picked.size < 2}
                onClick={save}
              >
                {submitting ? 'Saving…' : `Save group (${picked.size})`}
              </button>
            </>
          }
        >
          <div className="adm-form-grid">
            <div>
              <label className="adm-label" htmlFor="vg-name">Variant group name<span className="req">*</span></label>
              <input
                id="vg-name"
                className="adm-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Elf Bar BC5000 — Flavours"
                autoFocus
              />
            </div>

            <div>
              <label className="adm-label">Pick products to club together<span className="req">*</span></label>
              <input
                className="adm-input"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="adm-help">Tick at least 2 products. They&apos;ll appear on the site as flavour options under each other.</div>
              <div style={{ marginTop: 10, maxHeight: 360, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                {visibleProducts.length === 0 && (
                  <div style={{ padding: 14, color: '#64748B', fontSize: 13 }}>No products match.</div>
                )}
                {visibleProducts.map(p => {
                  const inOther = p.variantGroupId && (!editing || p.variantGroupId !== editing.id)
                  const checked = picked.has(p.handleId)
                  return (
                    <label
                      key={p.handleId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 12px', borderBottom: '1px solid #F1F5F9',
                        cursor: inOther ? 'not-allowed' : 'pointer',
                        opacity: inOther ? .55 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!!inOther}
                        onChange={() => toggle(p.handleId)}
                      />
                      {p.image
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={p.image} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, background: '#F1F5F9' }} />
                        : <div style={{ width: 32, height: 32, background: '#F1F5F9', borderRadius: 4, display: 'grid', placeItems: 'center', fontSize: 14 }}>💨</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>
                          {p.brand || '—'}
                          {inOther && <span style={{ marginLeft: 6, color: '#92400E' }}>· already in another group</span>}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {formErr && <div className="adm-error">{formErr}</div>}
          </div>
        </Modal>
      )}
    </>
  )
}
