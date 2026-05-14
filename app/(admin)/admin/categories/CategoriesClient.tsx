'use client'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import Modal from '../_components/Modal'
import ImageDrop from '../_components/ImageDrop'

interface Category {
  id: string
  slug: string
  name: string
  image: string | null
  featured: boolean
}

const MAX_FEATURED = 6

export default function CategoriesClient() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [featured, setFeatured] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch('/api/admin/categories', { cache: 'no-store' })
      const j = (await r.json().catch(() => ({}))) as { categories?: Category[]; error?: string }
      if (!r.ok) { setErr(j.error || 'Failed to load categories.'); setItems([]) }
      else setItems(j.categories || [])
    } catch { setErr('Network error.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const featuredCount = items.filter(i => i.featured).length

  const openAdd = () => {
    setEditing(null); setName(''); setImages([]); setFeatured(false); setFormErr(null); setOpen(true)
  }
  const openEdit = (c: Category) => {
    setEditing(c); setName(c.name); setImages(c.image ? [c.image] : []); setFeatured(c.featured); setFormErr(null); setOpen(true)
  }

  const save = useCallback(async () => {
    setFormErr(null)
    setSubmitting(true)
    try {
      const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories'
      const method = editing ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          image: images[0] || null,
          featured,
        }),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) { setFormErr(j.error || 'Could not save.'); setSubmitting(false); return }
      setOpen(false)
      void load()
    } catch { setFormErr('Network error.') }
    finally { setSubmitting(false) }
  }, [editing, name, images, featured, load])

  const remove = useCallback(async (c: Category) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return
    try {
      const r = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) { setErr(j.error || 'Could not delete.'); return }
      void load()
    } catch { setErr('Network error.') }
  }, [load])

  const toggleFeatured = useCallback(async (c: Category) => {
    const next = !c.featured
    try {
      const r = await fetch(`/api/admin/categories/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: next }),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) { setErr(j.error || 'Could not update.'); return }
      void load()
    } catch { setErr('Network error.') }
  }, [load])

  return (
    <>
      <div className="adm-page-head">
        <div>
          <div className="adm-page-title">Categories</div>
          <div className="adm-page-sub">
            Top-level brand lines. Mark up to {MAX_FEATURED} as <strong>Featured</strong> to show them on the homepage carousel.
            {' '}<span style={{ color: featuredCount >= MAX_FEATURED ? '#92400E' : '#475569' }}>
              {featuredCount}/{MAX_FEATURED} featured
            </span>
          </div>
        </div>
        <button type="button" className="adm-btn adm-btn-primary" onClick={openAdd}>
          + Add category
        </button>
      </div>

      {err && <div className="adm-error" style={{ marginBottom: 14 }}>{err}</div>}

      <div className="adm-card">
        {loading ? (
          <div className="adm-card-pad" style={{ color: '#64748B' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="adm-card-pad" style={{ color: '#64748B', textAlign: 'center' }}>
            No categories yet. Add your first one.
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 64 }}></th>
                <th>Name</th>
                <th>Slug</th>
                <th style={{ width: 130 }}>Homepage</th>
                <th style={{ width: 230, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id}>
                  <td>
                    <div
                      style={{
                        width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
                        background: '#F1F5F9', display: 'grid', placeItems: 'center', fontSize: 18, color: '#94A3B8',
                      }}
                    >
                      {c.image
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '🗂'}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    <Link href={`/admin/categories/${c.id}`} style={{ color: '#0F172A' }}>
                      {c.name}
                    </Link>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 12.5, color: '#475569' }}>
                    {c.slug}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleFeatured(c)}
                      className={`adm-pill ${c.featured ? 'visible' : 'muted'}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                      disabled={!c.featured && featuredCount >= MAX_FEATURED}
                      title={!c.featured && featuredCount >= MAX_FEATURED ? `Maximum ${MAX_FEATURED} featured` : ''}
                    >
                      {c.featured ? '★ Featured' : 'Not featured'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/admin/categories/${c.id}`} className="adm-btn adm-btn-ghost adm-btn-sm" style={{ marginRight: 6 }}>
                      Open
                    </Link>
                    <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className="adm-btn adm-btn-danger adm-btn-sm" style={{ marginLeft: 6 }} onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Modal
          title={editing ? 'Edit category' : 'Add category'}
          onClose={() => !submitting && setOpen(false)}
          maxWidth={560}
          footer={
            <>
              <button type="button" className="adm-btn adm-btn-ghost" disabled={submitting} onClick={() => setOpen(false)}>Cancel</button>
              <button
                type="button"
                className="adm-btn adm-btn-primary"
                disabled={submitting || !name.trim()}
                onClick={save}
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <div className="adm-form-grid">
            <div>
              <label className="adm-label" htmlFor="cat-name">Name<span className="req">*</span></label>
              <input
                id="cat-name"
                className="adm-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Elf Bar"
                autoFocus
              />
            </div>

            <div>
              <label className="adm-label">Category picture <span style={{ color: '#94A3B8', fontWeight: 400 }}>· shown on homepage wheel</span></label>
              <ImageDrop value={images} onChange={setImages} max={1} />
            </div>

            <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={featured}
                onChange={e => setFeatured(e.target.checked)}
              />
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>Show on homepage carousel</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Up to {MAX_FEATURED} categories total. Picture is recommended.</div>
              </div>
            </label>

            {formErr && <div className="adm-error">{formErr}</div>}
          </div>
        </Modal>
      )}
    </>
  )
}
