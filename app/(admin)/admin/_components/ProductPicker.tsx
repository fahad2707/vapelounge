'use client'
import { useMemo, useState } from 'react'

export interface PickerProduct {
  handleId: string
  name: string
  image: string
  brand: string | null
  sku: string | null
  variantGroupId?: string | null
  categoryId?: string | null
  modelId?: string | null
}

interface Props {
  products: PickerProduct[]
  excludeHandleIds?: Set<string>
  /** Disable rows that match this predicate (still visible, greyed out). */
  isDisabled?: (p: PickerProduct) => string | false
  onPick: (handleId: string) => void | Promise<void>
  placeholder?: string
  emptyHint?: string
}

export default function ProductPicker({
  products,
  excludeHandleIds,
  isDisabled,
  onPick,
  placeholder = 'Search products to add by name, SKU or brand…',
  emptyHint = 'No matching products.',
}: Props) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return []
    return products
      .filter(p => !excludeHandleIds?.has(p.handleId))
      .filter(p =>
        p.name.toLowerCase().includes(needle) ||
        (p.sku || '').toLowerCase().includes(needle) ||
        (p.brand || '').toLowerCase().includes(needle) ||
        p.handleId.toLowerCase().includes(needle),
      )
      .slice(0, 20)
  }, [q, products, excludeHandleIds])

  const handle = async (p: PickerProduct) => {
    if (busy) return
    setBusy(p.handleId)
    try { await onPick(p.handleId) } finally { setBusy(null) }
  }

  return (
    <div className="adm-picker">
      <input
        className="adm-input"
        placeholder={placeholder}
        value={q}
        onChange={e => setQ(e.target.value)}
        autoComplete="off"
      />
      {q.trim() && (
        <div className="adm-picker-list">
          {visible.length === 0 ? (
            <div className="adm-picker-empty">{emptyHint}</div>
          ) : visible.map(p => {
            const disabledReason = isDisabled?.(p) || false
            return (
              <button
                key={p.handleId}
                type="button"
                className="adm-picker-row"
                disabled={!!disabledReason || busy === p.handleId}
                onClick={() => handle(p)}
              >
                {p.image
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={p.image} alt="" />
                  : <div className="adm-picker-ph">💨</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>
                    {p.brand || '—'} {p.sku ? ` · SKU ${p.sku}` : ''}
                    {disabledReason && <span style={{ color: '#92400E', marginLeft: 6 }}>· {disabledReason}</span>}
                  </div>
                </div>
                <span className="adm-picker-cta">{busy === p.handleId ? '…' : 'Add'}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
