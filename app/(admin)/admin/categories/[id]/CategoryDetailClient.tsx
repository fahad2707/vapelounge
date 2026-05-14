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
  categoryId?: string | null
  modelId?: string | null
}
interface Category { id: string; name: string; slug: string; image: string | null; featured: boolean }
interface ModelItem { id: string; name: string; slug: string; categoryId: string }

export default function CategoryDetailClient({ categoryId }: { categoryId: string }) {
  const [category, setCategory] = useState<Category | null>(null)
  const [models, setModels] = useState<ModelItem[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [savedToast, setSavedToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const [c, m, p] = await Promise.all([
        fetch(`/api/admin/categories/${categoryId}`, { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/admin/models', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/admin/products', { cache: 'no-store' }).then(r => r.json()),
      ])
      if (c?.category) setCategory(c.category)
      else { setErr(c?.error || 'Category not found.') }
      setModels(Array.isArray(m?.models) ? m.models : [])
      setProducts(Array.isArray(p?.products) ? p.products : [])
    } catch { setErr('Network error.') }
    finally { setLoading(false) }
  }, [categoryId])
  useEffect(() => { void load() }, [load])

  const myModels = useMemo(
    () => models.filter(m => m.categoryId === categoryId),
    [models, categoryId],
  )
  const inCategory = useMemo(
    () => products.filter(p => p.categoryId === categoryId),
    [products, categoryId],
  )
  const groups = useMemo(() => {
    const map = new Map<string, AdminProduct[]>()
    for (const p of inCategory) {
      const key = p.modelId || '__none__'
      const arr = map.get(key) || []
      arr.push(p)
      map.set(key, arr)
    }
    return map
  }, [inCategory])

  const toast = (m: string) => {
    setSavedToast(m)
    window.setTimeout(() => setSavedToast(null), 2000)
  }

  const patchProduct = useCallback(async (
    handleId: string,
    patch: Record<string, unknown>,
    optimistic: (cur: AdminProduct) => AdminProduct,
  ) => {
    const prev = products
    setProducts(list => list.map(x => x.handleId === handleId ? optimistic(x) : x))
    try {
      const r = await fetch(`/api/admin/products/${encodeURIComponent(handleId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) {
        setProducts(prev)
        setErr(j.error || 'Could not save change.')
        return false
      }
      return true
    } catch {
      setProducts(prev)
      setErr('Network error.')
      return false
    }
  }, [products])

  const addProduct = useCallback(async (handleId: string) => {
    const ok = await patchProduct(handleId, { categoryId, modelId: null }, p => ({ ...p, categoryId, modelId: null }))
    if (ok) toast('Product added to category')
  }, [patchProduct, categoryId])

  const removeFromCategory = useCallback(async (p: AdminProduct) => {
    if (!window.confirm(`Remove "${p.name}" from this category?`)) return
    const ok = await patchProduct(p.handleId, { categoryId: null, modelId: null }, cur => ({ ...cur, categoryId: null, modelId: null }))
    if (ok) toast('Removed from category')
  }, [patchProduct])

  const moveToModel = useCallback(async (p: AdminProduct, modelId: string) => {
    const targetModelId = modelId || null
    const ok = await patchProduct(p.handleId, { modelId: targetModelId }, cur => ({ ...cur, modelId: targetModelId }))
    if (ok) toast(targetModelId ? 'Moved to model' : 'Removed from model')
  }, [patchProduct])

  const inThisCat = useMemo(
    () => new Set(inCategory.map(p => p.handleId)),
    [inCategory],
  )

  if (loading) {
    return <div className="adm-card adm-card-pad" style={{ color: '#64748B' }}>Loading…</div>
  }
  if (!category) {
    return (
      <>
        <div className="adm-error" style={{ marginBottom: 14 }}>{err || 'Category not found.'}</div>
        <Link href="/admin/categories" className="adm-btn adm-btn-ghost">← Back to categories</Link>
      </>
    )
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
            <Link href="/admin/categories" style={{ color: '#64748B' }}>Categories</Link>
            {' › '}
            <span>{category.name}</span>
          </div>
          <div className="adm-page-title">{category.name}</div>
          <div className="adm-page-sub">
            {inCategory.length} product{inCategory.length === 1 ? '' : 's'} · {myModels.length} model{myModels.length === 1 ? '' : 's'}
            {category.featured && <span style={{ marginLeft: 10 }} className="adm-pill visible">★ Featured</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/models" className="adm-btn adm-btn-ghost">Manage models</Link>
        </div>
      </div>

      <div className="adm-detail-head">
        <div className="adm-detail-img">
          {category.image
            /* eslint-disable-next-line @next/next/no-img-element */
            ? <img src={category.image} alt="" />
            : '🗂'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{category.name}</div>
          <div style={{ fontSize: 12.5, color: '#64748B' }}>Slug: <code style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>{category.slug}</code></div>
        </div>
        <Link href={`/admin/categories`} className="adm-btn adm-btn-ghost adm-btn-sm">Edit category</Link>
      </div>

      <div className="adm-card adm-card-pad" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Add a product to this category</div>
        <ProductPicker
          products={products}
          excludeHandleIds={inThisCat}
          onPick={addProduct}
          placeholder="Search any product by name, SKU or brand…"
        />
      </div>

      {err && <div className="adm-error" style={{ marginBottom: 14 }}>{err}</div>}

      {inCategory.length === 0 ? (
        <div className="adm-card adm-card-pad" style={{ color: '#64748B', textAlign: 'center' }}>
          No products in this category yet. Use the search above to add some.
        </div>
      ) : (
        <>
          {myModels.map(m => {
            const list = groups.get(m.id) || []
            return (
              <section key={m.id}>
                <div className="adm-section-h">
                  <div>
                    <div className="adm-section-title">{m.name}</div>
                    <div className="adm-section-sub">{list.length} product{list.length === 1 ? '' : 's'}</div>
                  </div>
                </div>
                <div className="adm-card">
                  {list.length === 0 ? (
                    <div className="adm-card-pad" style={{ color: '#64748B', fontSize: 13 }}>
                      No products in “{m.name}” yet — assign products to this model below.
                    </div>
                  ) : list.map(p => (
                    <ProductRow
                      key={p.handleId}
                      product={p}
                      models={myModels}
                      onMove={mid => moveToModel(p, mid)}
                      onRemove={() => removeFromCategory(p)}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          <section>
            <div className="adm-section-h">
              <div>
                <div className="adm-section-title">Unassigned model</div>
                <div className="adm-section-sub">Products in this category but not linked to any model.</div>
              </div>
            </div>
            <div className="adm-card">
              {(groups.get('__none__') || []).length === 0 ? (
                <div className="adm-card-pad" style={{ color: '#64748B', fontSize: 13 }}>
                  Everything is sorted into a model.
                </div>
              ) : (groups.get('__none__') || []).map(p => (
                <ProductRow
                  key={p.handleId}
                  product={p}
                  models={myModels}
                  onMove={mid => moveToModel(p, mid)}
                  onRemove={() => removeFromCategory(p)}
                />
              ))}
            </div>
          </section>
        </>
      )}

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

function ProductRow({
  product,
  models,
  onMove,
  onRemove,
}: {
  product: AdminProduct
  models: ModelItem[]
  onMove: (modelId: string) => void
  onRemove: () => void
}) {
  return (
    <div className="adm-row">
      <div className="adm-row-img">
        {product.image
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={product.image} alt="" />
          : '💨'}
      </div>
      <div className="adm-row-main">
        <div className="adm-row-name">{product.name}</div>
        <div className="adm-row-sub">{product.brand || '—'}{product.sku ? ` · ${product.sku}` : ''}</div>
      </div>
      <div className="adm-row-actions">
        <select
          className="adm-mini-select"
          value={product.modelId || ''}
          onChange={e => onMove(e.target.value)}
          aria-label="Move to model"
        >
          <option value="">— no model —</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  )
}
