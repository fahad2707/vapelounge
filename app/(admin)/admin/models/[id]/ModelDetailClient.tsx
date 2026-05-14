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
interface Category { id: string; name: string }
interface ModelItem { id: string; name: string; slug: string; categoryId: string }

export default function ModelDetailClient({ modelId }: { modelId: string }) {
  const [model, setModel] = useState<ModelItem | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [allModels, setAllModels] = useState<ModelItem[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [savedToast, setSavedToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const [mRes, cRes, mAll, p] = await Promise.all([
        fetch(`/api/admin/models/${modelId}`, { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/admin/categories', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/admin/models', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/admin/products', { cache: 'no-store' }).then(r => r.json()),
      ])
      if (mRes?.model) setModel(mRes.model)
      else setErr(mRes?.error || 'Model not found.')
      const cats: Category[] = Array.isArray(cRes?.categories) ? cRes.categories : []
      const me = mRes?.model
      setCategory(me ? cats.find(c => c.id === me.categoryId) || null : null)
      setAllModels(Array.isArray(mAll?.models) ? mAll.models : [])
      setProducts(Array.isArray(p?.products) ? p.products : [])
    } catch { setErr('Network error.') }
    finally { setLoading(false) }
  }, [modelId])
  useEffect(() => { void load() }, [load])

  const inModel = useMemo(
    () => products.filter(p => p.modelId === modelId),
    [products, modelId],
  )
  const inThisModel = useMemo(
    () => new Set(inModel.map(p => p.handleId)),
    [inModel],
  )

  const sameCatModels = useMemo(
    () => model ? allModels.filter(m => m.categoryId === model.categoryId) : [],
    [allModels, model],
  )

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
    } catch { setProducts(prev); setErr('Network error.'); return false }
  }, [products])

  const addProduct = useCallback(async (handleId: string) => {
    if (!model) return
    const ok = await patchProduct(
      handleId,
      { categoryId: model.categoryId, modelId: model.id },
      p => ({ ...p, categoryId: model.categoryId, modelId: model.id }),
    )
    if (ok) toast('Product added to this model')
  }, [patchProduct, model])

  const removeFromModel = useCallback(async (p: AdminProduct) => {
    if (!window.confirm(`Remove "${p.name}" from this model?`)) return
    const ok = await patchProduct(p.handleId, { modelId: null }, cur => ({ ...cur, modelId: null }))
    if (ok) toast('Removed from model')
  }, [patchProduct])

  const moveToOtherModel = useCallback(async (p: AdminProduct, newModelId: string) => {
    const target = newModelId || null
    const ok = await patchProduct(p.handleId, { modelId: target }, cur => ({ ...cur, modelId: target }))
    if (ok) toast(target ? 'Moved to model' : 'Removed from model')
  }, [patchProduct])

  if (loading) return <div className="adm-card adm-card-pad" style={{ color: '#64748B' }}>Loading…</div>
  if (!model) {
    return (
      <>
        <div className="adm-error" style={{ marginBottom: 14 }}>{err || 'Model not found.'}</div>
        <Link href="/admin/models" className="adm-btn adm-btn-ghost">← Back to models</Link>
      </>
    )
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
            <Link href="/admin/models" style={{ color: '#64748B' }}>Models</Link>
            {' › '}
            {category && (
              <>
                <Link href={`/admin/categories/${category.id}`} style={{ color: '#64748B' }}>{category.name}</Link>
                {' › '}
              </>
            )}
            <span>{model.name}</span>
          </div>
          <div className="adm-page-title">{model.name}</div>
          <div className="adm-page-sub">
            {inModel.length} product{inModel.length === 1 ? '' : 's'} ·{' '}
            {category ? <Link href={`/admin/categories/${category.id}`}>under {category.name}</Link> : 'no parent category'}
          </div>
        </div>
      </div>

      <div className="adm-card adm-card-pad" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Add a product to this model</div>
        <ProductPicker
          products={products}
          excludeHandleIds={inThisModel}
          onPick={addProduct}
          placeholder="Search any product by name, SKU or brand…"
        />
      </div>

      {err && <div className="adm-error" style={{ marginBottom: 14 }}>{err}</div>}

      <div className="adm-card">
        {inModel.length === 0 ? (
          <div className="adm-card-pad" style={{ color: '#64748B', textAlign: 'center' }}>
            No products in “{model.name}” yet. Use the search above.
          </div>
        ) : inModel.map(p => (
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
              <select
                className="adm-mini-select"
                value={p.modelId || ''}
                onChange={e => moveToOtherModel(p, e.target.value)}
                aria-label="Move to another model"
              >
                {sameCatModels.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.id === model.id ? `${m.name} (here)` : m.name}
                  </option>
                ))}
                <option value="">— no model —</option>
              </select>
              <button type="button" className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => removeFromModel(p)}>
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
