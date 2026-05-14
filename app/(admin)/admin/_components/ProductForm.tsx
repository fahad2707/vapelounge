'use client'
import { useEffect, useState } from 'react'
import ImageDrop from './ImageDrop'

interface AdminCategory { id: string; name: string }
interface AdminModel { id: string; name: string; categoryId: string }

export interface ProductFormValues {
  sku: string
  name: string
  description: string
  price: string
  costPrice: string
  quantity: string
  categoryId: string
  modelId: string
  images: string[]
}

export const EMPTY_PRODUCT: ProductFormValues = {
  sku: '',
  name: '',
  description: '',
  price: '',
  costPrice: '',
  quantity: '',
  categoryId: '',
  modelId: '',
  images: [],
}

export default function ProductForm({
  value,
  onChange,
  onSubmit,
  submitting,
  error,
  submitLabel = 'Save product',
}: {
  value: ProductFormValues
  onChange: (v: ProductFormValues) => void
  onSubmit: () => void
  submitting: boolean
  error: string | null
  submitLabel?: string
}) {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [models, setModels] = useState<AdminModel[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [c, m] = await Promise.all([
          fetch('/api/admin/categories', { cache: 'no-store' }).then(r => r.json()),
          fetch('/api/admin/models', { cache: 'no-store' }).then(r => r.json()),
        ])
        if (cancelled) return
        if (Array.isArray(c?.categories)) setCategories(c.categories)
        if (Array.isArray(m?.models)) setModels(m.models)
      } catch {
        /* ignore */
      }
    })()
    return () => { cancelled = true }
  }, [])

  const set = <K extends keyof ProductFormValues>(k: K, v: ProductFormValues[K]) =>
    onChange({ ...value, [k]: v })

  const filteredModels = value.categoryId
    ? models.filter(m => m.categoryId === value.categoryId)
    : []

  return (
    <form
      className="adm-form-grid"
      onSubmit={e => { e.preventDefault(); onSubmit() }}
      noValidate
    >
      <div className="adm-form-row-2">
        <div>
          <label htmlFor="pf-sku" className="adm-label">SKU / Barcode</label>
          <input
            id="pf-sku"
            className="adm-input"
            value={value.sku}
            onChange={e => set('sku', e.target.value)}
            placeholder="e.g. 0628250300123"
          />
          <div className="adm-help">Scan or type the barcode used at checkout.</div>
        </div>
        <div>
          <label htmlFor="pf-name" className="adm-label">Product name<span className="req">*</span></label>
          <input
            id="pf-name"
            className="adm-input"
            value={value.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Elf Bar BC5000 Watermelon"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="pf-desc" className="adm-label">Description</label>
        <textarea
          id="pf-desc"
          className="adm-textarea"
          value={value.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Short product description shown on the website."
        />
      </div>

      <div className="adm-form-row-2">
        <div>
          <label htmlFor="pf-price" className="adm-label">Selling price (CAD)<span className="req">*</span></label>
          <input
            id="pf-price"
            type="number" step="0.01" min="0"
            className="adm-input"
            value={value.price}
            onChange={e => set('price', e.target.value)}
            placeholder="24.99"
            required
          />
        </div>
        <div>
          <label htmlFor="pf-cost" className="adm-label">Cost price (CAD) <span style={{ color: '#94A3B8', fontWeight: 400 }}>· optional</span></label>
          <input
            id="pf-cost"
            type="number" step="0.01" min="0"
            className="adm-input"
            value={value.costPrice}
            onChange={e => set('costPrice', e.target.value)}
            placeholder="15.00"
          />
        </div>
      </div>

      <div className="adm-form-row-2">
        <div>
          <label htmlFor="pf-qty" className="adm-label">Quantity available <span style={{ color: '#94A3B8', fontWeight: 400 }}>· optional</span></label>
          <input
            id="pf-qty"
            type="number" step="1" min="0"
            className="adm-input"
            value={value.quantity}
            onChange={e => set('quantity', e.target.value)}
            placeholder="50"
          />
          <div className="adm-help">Leave empty for unlimited stock.</div>
        </div>
        <div>
          <label htmlFor="pf-cat" className="adm-label">Category</label>
          <select
            id="pf-cat"
            className="adm-select"
            value={value.categoryId}
            onChange={e => onChange({ ...value, categoryId: e.target.value, modelId: '' })}
          >
            <option value="">— none —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="pf-model" className="adm-label">Model</label>
        <select
          id="pf-model"
          className="adm-select"
          value={value.modelId}
          onChange={e => set('modelId', e.target.value)}
          disabled={!value.categoryId}
        >
          <option value="">— none —</option>
          {filteredModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        {!value.categoryId
          ? <div className="adm-help">Pick a category first to enable models.</div>
          : filteredModels.length === 0 && <div className="adm-help">No models in this category yet — add one from Models page.</div>}
      </div>

      <div>
        <label className="adm-label">Product pictures</label>
        <ImageDrop value={value.images} onChange={v => set('images', v)} />
      </div>

      {error && <div className="adm-error" role="alert">{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
        <button
          type="submit"
          className="adm-btn adm-btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
