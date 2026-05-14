'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ProductPicker from '../../_components/ProductPicker'

interface AdminProduct {
  handleId: string
  name: string
  image: string
  brand: string | null
  sku: string | null
  variantGroupId?: string | null
}
interface Group { id: string; name: string; productHandleIds: string[] }

export default function VariantDetailClient({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<Group | null>(null)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [savedToast, setSavedToast] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const [g, p] = await Promise.all([
        fetch(`/api/admin/variants/${groupId}`, { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/admin/products', { cache: 'no-store' }).then(r => r.json()),
      ])
      if (g?.group) { setGroup(g.group); setNewName(g.group.name) }
      else setErr(g?.error || 'Variant group not found.')
      setProducts(Array.isArray(p?.products) ? p.products : [])
    } catch { setErr('Network error.') }
    finally { setLoading(false) }
  }, [groupId])
  useEffect(() => { void load() }, [load])

  const inGroup = useMemo(
    () => group ? products.filter(p => group.productHandleIds.includes(p.handleId)) : [],
    [products, group],
  )
  const inGroupSet = useMemo(
    () => new Set(inGroup.map(p => p.handleId)),
    [inGroup],
  )

  const toast = (m: string) => {
    setSavedToast(m)
    window.setTimeout(() => setSavedToast(null), 2000)
  }

  const patchGroup = useCallback(async (handleIds: string[]) => {
    if (!group) return false
    const prev = group
    setGroup({ ...group, productHandleIds: handleIds })
    try {
      const r = await fetch(`/api/admin/variants/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productHandleIds: handleIds }),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) { setGroup(prev); setErr(j.error || 'Could not save.'); return false }
      return true
    } catch { setGroup(prev); setErr('Network error.'); return false }
  }, [group, groupId])

  const addProduct = useCallback(async (handleId: string) => {
    if (!group) return
    const ok = await patchGroup([...group.productHandleIds, handleId])
    if (ok) { toast('Product added to variant group'); void load() }
  }, [group, patchGroup, load])

  const removeProduct = useCallback(async (p: AdminProduct) => {
    if (!group) return
    if (group.productHandleIds.length <= 2) {
      window.alert('A variant group needs at least 2 products. Delete the whole group instead if you want fewer.')
      return
    }
    if (!window.confirm(`Remove "${p.name}" from this variant group?`)) return
    const next = group.productHandleIds.filter(h => h !== p.handleId)
    const ok = await patchGroup(next)
    if (ok) { toast('Removed from group'); void load() }
  }, [group, patchGroup, load])

  const saveName = useCallback(async () => {
    if (!group || !newName.trim() || newName.trim() === group.name) { setRenaming(false); return }
    try {
      const r = await fetch(`/api/admin/variants/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) { setErr(j.error || 'Could not rename.'); return }
      setGroup({ ...group, name: newName.trim() })
      toast('Renamed group')
    } catch { setErr('Network error.') }
    finally { setRenaming(false) }
  }, [group, groupId, newName])

  if (loading) return <div className="adm-card adm-card-pad" style={{ color: '#64748B' }}>Loading…</div>
  if (!group) {
    return (
      <>
        <div className="adm-error" style={{ marginBottom: 14 }}>{err || 'Variant group not found.'}</div>
        <Link href="/admin/variants" className="adm-btn adm-btn-ghost">← Back to variants</Link>
      </>
    )
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
            <Link href="/admin/variants" style={{ color: '#64748B' }}>Variants</Link>
            {' › '}
            <span>{group.name}</span>
          </div>
          {renaming ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                autoFocus
                className="adm-input"
                style={{ maxWidth: 380 }}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveName()
                  if (e.key === 'Escape') { setRenaming(false); setNewName(group.name) }
                }}
              />
              <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={saveName}>Save</button>
              <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => { setRenaming(false); setNewName(group.name) }}>Cancel</button>
            </div>
          ) : (
            <div className="adm-page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {group.name}
              <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setRenaming(true)}>Rename</button>
            </div>
          )}
          <div className="adm-page-sub">
            {inGroup.length} product{inGroup.length === 1 ? '' : 's'} clubbed together. Visitors see these as flavour options.
          </div>
        </div>
      </div>

      <div className="adm-card adm-card-pad" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Add a product to this group</div>
        <ProductPicker
          products={products}
          excludeHandleIds={inGroupSet}
          isDisabled={p => p.variantGroupId && p.variantGroupId !== groupId ? 'already in another group' : false}
          onPick={addProduct}
          placeholder="Search any product by name, SKU or brand…"
        />
      </div>

      {err && <div className="adm-error" style={{ marginBottom: 14 }}>{err}</div>}

      <div className="adm-card">
        {inGroup.length === 0 ? (
          <div className="adm-card-pad" style={{ color: '#64748B', textAlign: 'center' }}>
            No products in this group yet. Use the search above.
          </div>
        ) : inGroup.map(p => (
          <div key={p.handleId} className="adm-row">
            <div className="adm-row-img">
              {p.image
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={p.image} alt="" />
                : '💨'}
            </div>
            <div className="adm-row-main">
              <div className="adm-row-name">{p.name}</div>
              <div className="adm-row-sub">{p.brand || '—'}{p.sku ? ` · ${p.sku}` : ''}</div>
            </div>
            <div className="adm-row-actions">
              <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => removeProduct(p)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {savedToast && (
        <div
          role="status"
          style={{
            position: 'fixed', bottom: 24, right: 24, background: '#0F172A', color: '#fff',
            padding: '10px 16px', borderRadius: 8, fontSize: 13,
            boxShadow: '0 10px 25px rgba(15,23,42,.2)', zIndex: 950,
          }}
        >
          {savedToast}
        </div>
      )}
    </>
  )
}
