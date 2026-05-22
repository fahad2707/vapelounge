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
  shopDisplay: boolean
  shopDisplayOrder: number
  productCount: number
}

const MAX_FEATURED = 6
const MAX_SHOP_DISPLAY = 10

export default function CategoriesClient() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [syncNote, setSyncNote] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [featured, setFeatured] = useState(false)
  const [shopDisplay, setShopDisplay] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  const load = useCallback(async (sync = false) => {
    setLoading(true)
    setErr(null)
    try {
      const url = sync ? '/api/admin/categories?sync=1' : '/api/admin/categories'
      const r = await fetch(url, { cache: 'no-store' })
      const j = (await r.json().catch(() => ({}))) as {
        categories?: Category[]
        synced?: number
        error?: string
      }
      if (!r.ok) {
        setErr(j.error || 'Failed to load categories.')
        setItems([])
      } else {
        setItems(j.categories || [])
        if (sync && typeof j.synced === 'number' && j.synced > 0) {
          setSyncNote(`Synced ${j.synced} new line(s) from the product catalogue.`)
        } else if (sync) {
          setSyncNote('Catalogue sync complete — all product lines are in the list.')
        } else {
          setSyncNote(
            `${j.categories?.length ?? 0} categories loaded. Click “Sync catalogue” to import any missing lines from products.`,
          )
        }
      }
    } catch {
      setErr('Network error.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const featuredCount = items.filter(i => i.featured).length
  const shopDisplayCount = items.filter(i => i.shopDisplay).length

  const openAdd = () => {
    setEditing(null)
    setName('')
    setImages([])
    setFeatured(false)
    setShopDisplay(false)
    setFormErr(null)
    setOpen(true)
  }
  const openEdit = (c: Category) => {
    setEditing(c)
    setName(c.name)
    setImages(c.image ? [c.image] : [])
    setFeatured(c.featured)
    setShopDisplay(c.shopDisplay)
    setFormErr(null)
    setOpen(true)
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
          shopDisplay,
        }),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) {
        setFormErr(j.error || 'Could not save.')
        setSubmitting(false)
        return
      }
      setOpen(false)
      void load()
    } catch {
      setFormErr('Network error.')
    } finally {
      setSubmitting(false)
    }
  }, [editing, name, images, featured, shopDisplay, load])

  const remove = useCallback(async (c: Category) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return
    try {
      const r = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) {
        setErr(j.error || 'Could not delete.')
        return
      }
      void load()
    } catch {
      setErr('Network error.')
    }
  }, [load])

  const patchFlag = useCallback(
    async (c: Category, patch: { featured?: boolean; shopDisplay?: boolean }) => {
      try {
        const r = await fetch(`/api/admin/categories/${c.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        const j = (await r.json().catch(() => ({}))) as { error?: string }
        if (!r.ok) {
          setErr(j.error || 'Could not update.')
          return
        }
        void load()
      } catch {
        setErr('Network error.')
      }
    },
    [load],
  )

  return (
    <>
      <div className="adm-page-head">
        <div>
          <div className="adm-page-title">Categories</div>
          <div className="adm-page-sub">
            All brand lines from your catalogue (auto-synced from products). Mark up to{' '}
            <strong>{MAX_FEATURED}</strong> as <strong>Homepage carousel</strong> and up to{' '}
            <strong>{MAX_SHOP_DISPLAY}</strong> as <strong>Shop showcase</strong> (horizontal rails after
            &quot;Load more&quot;).
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="adm-btn adm-btn-ghost" onClick={() => void load(true)} disabled={loading}>
            Sync catalogue
          </button>
          <button type="button" className="adm-btn adm-btn-primary" onClick={openAdd}>
            + Add category
          </button>
        </div>
      </div>

      {syncNote && !err && (
        <div style={{ marginBottom: 12, fontSize: 12.5, color: '#475569' }}>{syncNote}</div>
      )}
      {err && <div className="adm-error" style={{ marginBottom: 14 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap', fontSize: 12.5 }}>
        <span style={{ color: featuredCount >= MAX_FEATURED ? '#92400E' : '#475569' }}>
          Homepage carousel: {featuredCount}/{MAX_FEATURED}
        </span>
        <span style={{ color: shopDisplayCount >= MAX_SHOP_DISPLAY ? '#92400E' : '#475569' }}>
          Shop showcase: {shopDisplayCount}/{MAX_SHOP_DISPLAY}
        </span>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-card-pad" style={{ color: '#64748B' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="adm-card-pad" style={{ color: '#64748B', textAlign: 'center' }}>
            No categories found. Add products or create a category manually.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: 64 }}></th>
                  <th>Name</th>
                  <th style={{ width: 72 }}>Products</th>
                  <th style={{ width: 130 }}>Carousel</th>
                  <th style={{ width: 140 }}>Shop showcase</th>
                  <th style={{ width: 200, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#F1F5F9',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 18,
                          color: '#94A3B8',
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
                      <div style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 11, color: '#94A3B8' }}>
                        {c.slug}
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: 13 }}>{c.productCount}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => patchFlag(c, { featured: !c.featured })}
                        className={`adm-pill ${c.featured ? 'visible' : 'muted'}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        disabled={!c.featured && featuredCount >= MAX_FEATURED}
                        title={!c.featured && featuredCount >= MAX_FEATURED ? `Maximum ${MAX_FEATURED}` : ''}
                      >
                        {c.featured ? '★ On' : 'Off'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => patchFlag(c, { shopDisplay: !c.shopDisplay })}
                        className={`adm-pill ${c.shopDisplay ? 'visible' : 'muted'}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        disabled={!c.shopDisplay && shopDisplayCount >= MAX_SHOP_DISPLAY}
                        title={
                          !c.shopDisplay && shopDisplayCount >= MAX_SHOP_DISPLAY
                            ? `Maximum ${MAX_SHOP_DISPLAY}`
                            : ''
                        }
                      >
                        {c.shopDisplay ? '★ On' : 'Off'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Link href={`/admin/categories/${c.id}`} className="adm-btn adm-btn-ghost adm-btn-sm" style={{ marginRight: 6 }}>
                        Open
                      </Link>
                      <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button
                        className="adm-btn adm-btn-danger adm-btn-sm"
                        style={{ marginLeft: 6 }}
                        onClick={() => remove(c)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <Modal
          title={editing ? 'Edit category' : 'Add category'}
          onClose={() => !submitting && setOpen(false)}
          maxWidth={560}
          footer={
            <>
              <button type="button" className="adm-btn adm-btn-ghost" disabled={submitting} onClick={() => setOpen(false)}>
                Cancel
              </button>
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
              <label className="adm-label" htmlFor="cat-name">
                Name<span className="req">*</span>
              </label>
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
              <label className="adm-label">
                Category picture{' '}
                <span style={{ color: '#94A3B8', fontWeight: 400 }}>· homepage carousel</span>
              </label>
              <ImageDrop value={images} onChange={setImages} max={1} />
            </div>

            <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>Homepage carousel (max {MAX_FEATURED})</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Rotating wheel on the main page.</div>
              </div>
            </label>

            <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={shopDisplay} onChange={e => setShopDisplay(e.target.checked)} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>Shop showcase (max {MAX_SHOP_DISPLAY})</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Horizontal product sliders after customers load all shop products.
                </div>
              </div>
            </label>

            {formErr && <div className="adm-error">{formErr}</div>}
          </div>
        </Modal>
      )}
    </>
  )
}
