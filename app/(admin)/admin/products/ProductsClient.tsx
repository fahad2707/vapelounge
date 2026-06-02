'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../_components/Modal'
import ProductForm, { EMPTY_PRODUCT, type ProductFormValues } from '../_components/ProductForm'

interface AdminProduct {
  handleId: string
  name: string
  sku: string | null
  image: string
  images: string[]
  price: number
  costPrice?: number | null
  quantity?: number | null
  visible: boolean
  inStock: boolean
  primaryCategory: string
  brand: string | null
  descriptionPlain: string
  categoryId?: string | null
  modelId?: string | null
}

function productToForm(p: AdminProduct): ProductFormValues {
  return {
    sku: p.sku || '',
    name: p.name,
    description: p.descriptionPlain || '',
    price: String(p.price ?? ''),
    costPrice: p.costPrice == null ? '' : String(p.costPrice),
    quantity: p.quantity == null ? '' : String(p.quantity),
    categoryId: p.categoryId || '',
    modelId: p.modelId || '',
    images: p.images || [],
  }
}

function formatCad(n: number): string {
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
}

async function fetchProductPage(params: { skip: number; q: string }) {
  const sp = new URLSearchParams()
  sp.set('limit', '36')
  sp.set('skip', String(params.skip))
  if (params.q.trim()) sp.set('q', params.q.trim())
  const r = await fetch(`/api/admin/products?${sp}`, { cache: 'no-store' })
  const j = (await r.json().catch(() => ({}))) as {
    products?: AdminProduct[]
    hasMore?: boolean
    error?: string
  }
  if (!r.ok) {
    throw new Error(
      j.error ||
        (r.status === 504 ? 'Request timed out. Refresh the page.' : 'Failed to load products.'),
    )
  }
  return { products: j.products || [], hasMore: !!j.hasMore }
}

export default function ProductsClient({
  initialProducts = [],
  initialHasMore = false,
  initialError = null,
}: {
  initialProducts?: AdminProduct[]
  initialHasMore?: boolean
  initialError?: string | null
}) {
  const skipFirstFetch = useRef(initialProducts.length > 0)
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts)
  const [loading, setLoading] = useState(initialProducts.length === 0 && !initialError)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadErr, setLoadErr] = useState<string | null>(initialError)
  const [q, setQ] = useState('')
  const [showHidden, setShowHidden] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormValues>(EMPTY_PRODUCT)
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)
  const [savedToast, setSavedToast] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const [hasMore, setHasMore] = useState(initialHasMore)
  const skipRef = useRef(initialProducts.length)

  const reloadList = useCallback(async () => {
    setLoading(true)
    setLoadErr(null)
    skipRef.current = 0
    try {
      const { products: batch, hasMore: more } = await fetchProductPage({ skip: 0, q })
      setProducts(batch)
      setHasMore(more)
      skipRef.current = batch.length
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to load products.')
      setProducts([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => {
    if (skipFirstFetch.current && !q.trim()) {
      skipFirstFetch.current = false
      return
    }
    let cancelled = false
    const timer = window.setTimeout(
      () => {
        void (async () => {
          setLoading(true)
          setLoadErr(null)
          skipRef.current = 0
          try {
            const { products: batch, hasMore: more } = await fetchProductPage({ skip: 0, q })
            if (cancelled) return
            setProducts(batch)
            setHasMore(more)
            skipRef.current = batch.length
          } catch (e) {
            if (cancelled) return
            setLoadErr(e instanceof Error ? e.message : 'Failed to load products.')
            setProducts([])
            setHasMore(false)
          } finally {
            if (!cancelled) setLoading(false)
          }
        })()
      },
      q.trim() ? 280 : 0,
    )
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [q])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const { products: batch, hasMore: more } = await fetchProductPage({
        skip: skipRef.current,
        q,
      })
      setProducts(prev => [...prev, ...batch])
      setHasMore(more)
      skipRef.current += batch.length
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to load more products.')
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, q])

  const filtered = useMemo(() => {
    return products.filter(p => showHidden || p.visible)
  }, [products, showHidden])

  const toggleHidden = useCallback(async (p: AdminProduct) => {
    const next = !p.visible
    setProducts(list => list.map(x => (x.handleId === p.handleId ? { ...x, visible: next } : x)))
    try {
      const r = await fetch(`/api/admin/products/${encodeURIComponent(p.handleId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: next }),
      })
      if (!r.ok) throw new Error()
      setSavedToast(next ? `${p.name} is now visible` : `${p.name} hidden`)
      window.setTimeout(() => setSavedToast(null), 2200)
    } catch {
      setProducts(list => list.map(x => (x.handleId === p.handleId ? { ...x, visible: p.visible } : x)))
      setLoadErr('Could not update visibility. Please try again.')
    }
  }, [])

  const removeProduct = useCallback(async (p: AdminProduct) => {
    if (!window.confirm(`Delete "${p.name}" permanently? This cannot be undone.`)) return
    const prev = products
    setProducts(list => list.filter(x => x.handleId !== p.handleId))
    try {
      const r = await fetch(`/api/admin/products/${encodeURIComponent(p.handleId)}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      setSavedToast(`${p.name} deleted`)
      window.setTimeout(() => setSavedToast(null), 2200)
    } catch {
      setProducts(prev)
      setLoadErr('Could not delete. Please try again.')
    }
  }, [products])

  const openAdd = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_PRODUCT)
    setSubmitErr(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback(async (p: AdminProduct) => {
    setEditingId(p.handleId)
    setForm(productToForm(p))
    setSubmitErr(null)
    setEditLoading(true)
    setModalOpen(true)
    try {
      const r = await fetch(`/api/admin/products/${encodeURIComponent(p.handleId)}`, {
        cache: 'no-store',
      })
      const j = (await r.json().catch(() => ({}))) as { product?: AdminProduct; error?: string }
      if (r.ok && j.product) {
        setForm(productToForm(j.product))
        setProducts(list =>
          list.map(x => (x.handleId === p.handleId ? { ...x, ...j.product! } : x)),
        )
      }
    } catch {
      /* keep list row data in form */
    } finally {
      setEditLoading(false)
    }
  }, [])

  const submit = useCallback(async () => {
    setSubmitErr(null)
    setSubmitting(true)
    try {
      const payload = {
        sku: form.sku.trim() || null,
        name: form.name.trim(),
        description: form.description,
        price: form.price,
        costPrice: form.costPrice || null,
        quantity: form.quantity || null,
        images: form.images,
        categoryId: form.categoryId || null,
        modelId: form.modelId || null,
      }
      const url = editingId
        ? `/api/admin/products/${encodeURIComponent(editingId)}`
        : '/api/admin/products'
      const method = editingId ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) {
        setSubmitErr(j.error || 'Could not save the product.')
        setSubmitting(false)
        return
      }
      setSavedToast(editingId ? 'Changes saved' : 'Product added')
      window.setTimeout(() => setSavedToast(null), 2200)
      setModalOpen(false)
      setForm(EMPTY_PRODUCT)
      setEditingId(null)
      await reloadList()
    } catch {
      setSubmitErr('Network error.')
    } finally {
      setSubmitting(false)
    }
  }, [editingId, form, reloadList])

  const visibleCount = products.filter(p => p.visible).length
  const hiddenCount = products.length - visibleCount

  return (
    <>
      <div className="adm-page-head">
        <div>
          <div className="adm-page-title">Products</div>
          <div className="adm-page-sub">
            {loading
              ? 'Loading catalogue…'
              : `${products.length} loaded · ${visibleCount} visible · ${hiddenCount} hidden`}
          </div>
        </div>
        <button type="button" className="adm-btn adm-btn-primary" onClick={openAdd}>
          + Add product
        </button>
      </div>

      <div className="adm-toolbar">
        <input
          className="adm-search"
          placeholder="Search by name, SKU, or brand…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
          <input type="checkbox" checked={showHidden} onChange={e => setShowHidden(e.target.checked)} />
          Show hidden
        </label>
      </div>

      {loadErr && (
        <div className="adm-error" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>{loadErr}</span>
          <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => void reloadList()}>
            Retry
          </button>
        </div>
      )}

      {!loading && filtered.length === 0 && !loadErr && (
        <div className="adm-card adm-card-pad" style={{ textAlign: 'center', color: '#64748B' }}>
          {products.length === 0
            ? 'No products yet. Click “Add product” to create your first one.'
            : 'No products match this search.'}
        </div>
      )}

      {hasMore && !loading && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <button
            type="button"
            className="adm-btn adm-btn-ghost"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? 'Loading…' : 'Load more products →'}
          </button>
        </div>
      )}

      <div className="adm-prod-grid">
        {filtered.map(p => (
          <div key={p.handleId} className={`adm-prod-card${p.visible ? '' : ' hidden'}`}>
            <div className="adm-prod-img">
              {p.image
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={p.image} alt={p.name} />
                : <div className="adm-prod-img-empty">💨</div>}
            </div>
            <div className="adm-prod-meta">
              <div className="adm-prod-name">{p.name}</div>
              <div className="adm-prod-sku">SKU: {p.sku || '—'}</div>
              <div className="adm-prod-row">
                <span className="adm-prod-price">{formatCad(p.price)}</span>
                <span className={`adm-pill ${p.visible ? 'visible' : 'hidden'}`}>
                  {p.visible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                {p.brand || p.primaryCategory || '—'}
                {p.quantity != null ? ` · Qty: ${p.quantity}` : ''}
              </div>
            </div>
            <div className="adm-prod-actions">
              <button
                type="button"
                className="adm-btn adm-btn-ghost adm-btn-sm"
                onClick={() => void openEdit(p)}
              >
                Edit
              </button>
              <button
                type="button"
                className={p.visible ? 'adm-btn adm-btn-ghost adm-btn-sm' : 'adm-btn adm-btn-primary adm-btn-sm'}
                onClick={() => toggleHidden(p)}
              >
                {p.visible ? 'Hide' : 'Unhide'}
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-danger adm-btn-sm"
                onClick={() => removeProduct(p)}
                aria-label={`Delete ${p.name}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {savedToast && (
        <div
          role="status"
          style={{
            position: 'fixed', bottom: 24, right: 24,
            background: '#0F172A', color: '#fff', padding: '10px 16px',
            borderRadius: 8, fontSize: 13, boxShadow: '0 10px 25px rgba(15,23,42,.2)',
            zIndex: 950,
          }}
        >
          {savedToast}
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editingId ? 'Edit product' : 'Add product'}
          onClose={() => !submitting && setModalOpen(false)}
        >
          {editLoading ? (
            <p style={{ color: '#64748B', fontSize: 14 }}>Loading product details…</p>
          ) : null}
          <ProductForm
            value={form}
            onChange={setForm}
            onSubmit={submit}
            submitting={submitting}
            error={submitErr}
            submitLabel={editingId ? 'Save changes' : 'Save product'}
          />
        </Modal>
      )}
    </>
  )
}
