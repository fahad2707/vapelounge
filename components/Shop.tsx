'use client'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import type { CatalogProduct } from '@/lib/catalog/types'
import { formatCad } from '@/lib/currency'
import { useCart } from '@/lib/store'
import { productMatchesBrand } from '@/lib/catalog/shop-utils'
import { catalogToWishlist, useWishlist } from '@/lib/wishlist'
import ProductModal from './ProductModal'
import { useToast } from './Toast'

function badgeClass(badge: string | null): string {
  if (!badge) return ''
  const b = badge.toLowerCase()
  if (b === 'hot' || b === 'sale' || b === 'new') return b
  return 'tag'
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function ProductCard({
  p,
  onOpen,
}: {
  p: CatalogProduct
  onOpen: () => void
}) {
  const { dispatch } = useCart()
  const { dispatch: wlDispatch, isSaved } = useWishlist()
  const toast = useToast()
  const saved = isSaved(p.id)
  const bClass = badgeClass(p.badge)
  const accent = p.accentColor || 'var(--gold)'

  return (
    <div className="pc">
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className="pc-card-hit"
          onClick={onOpen}
          style={{
            border: 'none',
            padding: 0,
            margin: 0,
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            background: 'transparent',
            color: 'inherit',
            font: 'inherit',
            display: 'block',
          }}
        >
          <div
            style={{
              aspectRatio: 1,
              position: 'relative',
              overflow: 'hidden',
              background: 'var(--ink2)',
              transition: 'transform .5s var(--ease)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 130,
                height: 130,
                borderRadius: '50%',
                filter: 'blur(40px)',
                opacity: 0.22,
                background: `radial-gradient(circle,${accent},transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
            {p.badge && bClass && (
              <span
                className={`pc-badge ${bClass}`}
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  zIndex: 2,
                  padding: '3px 8px',
                  fontSize: 8.5,
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  pointerEvents: 'none',
                }}
              >
                {p.badge}
              </span>
            )}
            {p.image ? (
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="(max-width: 768px) 50vw, min(280px, 33vw)"
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 52,
                  zIndex: 1,
                }}
              >
                💨
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg,transparent 58%,var(--ink2) 100%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />
          </div>
        </button>
      </div>

      <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          type="button"
          className="pc-card-hit"
          onClick={onOpen}
          style={{
            border: 'none',
            padding: 0,
            margin: 0,
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            background: 'transparent',
            color: 'inherit',
            font: 'inherit',
          }}
        >
          <div
            className="pc-name"
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 15,
              fontWeight: 400,
              lineHeight: 1.28,
              color: 'var(--cream)',
            }}
          >
            {p.name}
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, color: 'var(--cream)' }}>{formatCad(p.price)}</span>
            {p.compareAtPrice != null && p.compareAtPrice > p.price && (
              <span style={{ fontSize: 11, color: 'var(--fog2)', textDecoration: 'line-through' }}>{formatCad(p.compareAtPrice)}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              className={`pc-wl-btn${saved ? ' on' : ''}`}
              aria-pressed={saved}
              aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={e => {
                e.stopPropagation()
                wlDispatch({ type: 'TOGGLE', item: catalogToWishlist(p) })
                toast(saved ? 'Removed from wishlist' : 'Saved to wishlist')
              }}
            >
              {saved ? '♥' : '♡'}
            </button>
            <button
              type="button"
              className="pc-atc"
              disabled={!p.inStock}
              onClick={e => {
                e.stopPropagation()
                if (!p.inStock) return
                dispatch({
                  type: 'ADD',
                  item: {
                    id: p.id,
                    emoji: '🛒',
                    name: p.name,
                    cat: p.primaryCategory,
                    price: p.price,
                    label: formatCad(p.price),
                  },
                })
                toast(`${p.name} added to cart`)
              }}
            >
              {p.inStock ? '+ Cart' : 'Out of stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type ProductsResponse = {
  source?: 'mongodb' | 'no_database' | 'empty' | 'error'
  products: CatalogProduct[]
  brands?: string[]
  total?: number
  hasMore?: boolean
  message?: string
}

const SHOP_FIRST_PAGE = 120
const SHOP_PAGE_SIZE = 400

async function fetchProductPage(
  skip: number,
  limit: number,
  signal: AbortSignal,
): Promise<ProductsResponse & { hasMore: boolean }> {
  const r = await fetch(`/api/products?limit=${limit}&skip=${skip}&skipBrands=1`, { signal })
  const data = (await r.json().catch(() => ({ products: [] }))) as ProductsResponse
  return { ...data, hasMore: Boolean(data.hasMore) }
}

export default function Shop() {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [brands, setBrands] = useState<string[]>(['All brands'])
  const [brandFilt, setBrandFilt] = useState('All brands')
  const [vis, setVis] = useState(36)
  const [loaded, setLoaded] = useState(false)
  const [modalProduct, setModalProduct] = useState<CatalogProduct | null>(null)

  const openProduct = async (summary: CatalogProduct) => {
    setModalProduct(summary)
    try {
      const r = await fetch(`/api/products/${encodeURIComponent(summary.id)}`, { cache: 'no-store' })
      if (!r.ok) return
      const j = (await r.json()) as { product?: CatalogProduct }
      if (j.product) setModalProduct(j.product)
    } catch {
      /* keep summary in modal */
    }
  }
  const [brandSheet, setBrandSheet] = useState(false)
  const [emptyHint, setEmptyHint] = useState<string | null>(null)
  const { dispatch } = useCart()

  const products = useMemo(
    () => catalog.filter(p => productMatchesBrand(p, brandFilt)),
    [catalog, brandFilt],
  )

  useEffect(() => {
    const onFilter = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (typeof detail === 'string' && detail.trim()) {
        setBrandFilt(detail.trim())
        setVis(36)
      }
    }
    window.addEventListener('vp:filter-brand', onFilter as EventListener)
    return () => window.removeEventListener('vp:filter-brand', onFilter as EventListener)
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    setLoaded(false)
    setEmptyHint(null)

    ;(async () => {
      const apply = (data: ProductsResponse, list: CatalogProduct[]) => {
        if (ac.signal.aborted) return
        setCatalog(shuffle(list))
        if (data.brands?.length) setBrands(data.brands)
        setEmptyHint(list.length === 0 ? data.message || 'No products in catalog.' : null)
        setLoaded(true)
      }

      try {
        let data: ProductsResponse | null = null
        let list: CatalogProduct[] = []

        const catalogRes = await fetch('/api/catalog', { signal: ac.signal })
        const catalogCt = catalogRes.headers.get('content-type') ?? ''
        if (catalogRes.ok && catalogCt.includes('application/json')) {
          data = (await catalogRes.json()) as ProductsResponse
          if (data.source === 'no_database') {
            setCatalog([])
            setEmptyHint(data.message || 'Database not configured.')
            setLoaded(true)
            return
          }
          if (data.source !== 'error') {
            list = Array.isArray(data.products) ? data.products : []
          }
        }

        if (list.length === 0) {
          const [first, brandsRes] = await Promise.all([
            fetchProductPage(0, SHOP_FIRST_PAGE, ac.signal),
            fetch('/api/products/brands', { signal: ac.signal }),
          ])
          if (ac.signal.aborted) return

          const brandsJson = brandsRes.ok
            ? ((await brandsRes.json().catch(() => ({}))) as { brands?: string[] })
            : {}

          if (first.source === 'error' || (first.products.length === 0 && first.source !== 'mongodb')) {
            setCatalog([])
            setEmptyHint(
              first.message || data?.message || 'Could not load products. Try refreshing.',
            )
            setLoaded(true)
            return
          }

          if (first.source === 'no_database') {
            setCatalog([])
            setEmptyHint(first.message || 'Database not configured.')
            setLoaded(true)
            return
          }

          data = first
          list = Array.isArray(first.products) ? first.products : []
          if (brandsJson.brands?.length) data.brands = brandsJson.brands

          apply(data, list)

          if (first.hasMore) {
            let skip = list.length
            ;(async () => {
              let hasMore = true
              while (hasMore && !ac.signal.aborted) {
                const page = await fetchProductPage(skip, SHOP_PAGE_SIZE, ac.signal)
                if (ac.signal.aborted) return
                if (page.source === 'error' || !page.products.length) break
                hasMore = page.hasMore
                skip += page.products.length
                setCatalog(prev => [...prev, ...page.products])
              }
            })().catch(() => {})
          }
          return
        }

        apply(data ?? { products: list }, list)
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return
        setEmptyHint('Network error while loading products. Try refreshing the page.')
        setLoaded(true)
      }
    })()

    return () => ac.abort()
  }, [])

  const openBrands = () => setBrandSheet(true)
  const closeBrands = () => setBrandSheet(false)

  const selectBrand = (b: string) => {
    setBrandFilt(b)
    setVis(36)
    setBrandSheet(false)
  }

  useEffect(() => {
    setVis(36)
  }, [brandFilt])

  return (
    <section id="shop" className="shop-root" style={{ padding: '100px 56px 80px' }}>
      <div className="rv" style={{ marginBottom: 40 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <span style={{ width: 26, height: 1, background: 'var(--gold)', display: 'block' }} />
          Shop
        </div>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(34px,4.5vw,58px)', fontWeight: 400, lineHeight: 1.06, marginBottom: 12 }}>
          <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Canadian</em> vape catalogue
        </h2>
        <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--fog)', maxWidth: 520, lineHeight: 1.75 }}>
          Tap a product to view photos, full description, and all variants. Prices in CAD.
        </p>
      </div>

      <div className="shop-layout">
        <aside className="shop-sidebar shop-sidebar-desktop" aria-label="Filter by brand">
          <div className="shop-sidebar-sticky">
            <div className="shop-sidebar-title">Brand / line</div>
            <nav className="shop-sidebar-nav">
              {brands.map(b => (
                <button
                  key={b}
                  type="button"
                  className={`shop-brand-btn${brandFilt === b ? ' on' : ''}`}
                  onClick={() => selectBrand(b)}
                >
                  {b === 'All brands' ? 'All brands' : b}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          {loaded && products.length === 0 && emptyHint && (
            <p
              style={{
                color: 'var(--fog)',
                fontSize: 14,
                marginBottom: 24,
                maxWidth: 640,
                lineHeight: 1.75,
              }}
            >
              {emptyHint}
            </p>
          )}

          <div className="pgrid">
            {products.slice(0, vis).map(p => (
              <ProductCard key={p.id} p={p} onOpen={() => void openProduct(p)} />
            ))}
          </div>

          {products.length > vis && (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <button type="button" className="btn-ghost" onClick={() => setVis(v => v + 36)}>
                Load more →
              </button>
            </div>
          )}

        </div>
      </div>

      <div className="shop-mob-bar" role="toolbar" aria-label="Shop tools">
        <button type="button" className="shop-mob-btn" onClick={openBrands}>
          Brands
        </button>
        <button type="button" className="shop-mob-btn shop-mob-btn-primary" onClick={() => dispatch({ type: 'OPEN' })}>
          Cart
        </button>
      </div>

      {brandSheet && (
        <div className="shop-sheet-ov" role="presentation" onClick={closeBrands}>
          <div className="shop-sheet" role="dialog" aria-modal="true" aria-label="Brands" onClick={e => e.stopPropagation()}>
            <div className="shop-sheet-head">
              <span>Filter by brand or line</span>
              <button type="button" className="shop-sheet-x" onClick={closeBrands} aria-label="Close">
                ×
              </button>
            </div>
            <div className="shop-sheet-list">
              {brands.map(b => (
                <button key={b} type="button" className={`shop-sheet-row${brandFilt === b ? ' on' : ''}`} onClick={() => selectBrand(b)}>
                  {b === 'All brands' ? 'All brands' : b}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onSwitchToProduct={async handleId => {
            const local = products.find(p => p.id === handleId)
            if (local) { setModalProduct(local); return }
            try {
              const r = await fetch(`/api/products/${encodeURIComponent(handleId)}`, { cache: 'no-store' })
              if (!r.ok) return
              const j = (await r.json()) as { product?: CatalogProduct }
              if (j.product) setModalProduct(j.product)
            } catch {
              /* ignore */
            }
          }}
        />
      )}

      <style>{`
        .shop-layout { display:flex; gap:40px; align-items:stretch; max-width:1420px; margin:0 auto; }
        .shop-sidebar { width:220px; flex-shrink:0; padding-right:6px; }
        .shop-sidebar-sticky {
          position:sticky;
          top:64px;
          max-height:calc(100vh - 72px);
          overflow-y:auto;
          padding-bottom:16px;
        }
        .shop-sidebar-nav { display:flex; flex-direction:column; gap:4px; }
        .shop-sidebar-title { font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--gold); margin-bottom:14px; font-weight:500; }
        .shop-brand-btn {
          display:block; width:100%; text-align:left; padding:10px 14px; font-size:12.5px; font-weight:300;
          color:var(--fog); background:transparent; border:1px solid transparent; border-radius:2px; transition:all .22s;
          cursor:pointer; font-family:var(--body);
        }
        .shop-brand-btn:hover { color:var(--cream2); border-color:var(--line2); }
        .shop-brand-btn.on { color:var(--gold); border-color:var(--gold); background:var(--gold-a10); }
        .shop-mob-bar {
          display:none; position:fixed; bottom:0; left:0; right:0; z-index:650;
          padding:10px 16px calc(10px + env(safe-area-inset-bottom));
          gap:10px; background:rgba(10,10,13,.92); border-top:1px solid var(--line2);
          backdrop-filter:blur(16px); justify-content:center;
        }
        .shop-mob-btn {
          flex:1; max-width:200px; padding:12px 16px; font-size:11px; letter-spacing:.14em; text-transform:uppercase;
          border:1px solid var(--line2); color:var(--cream2); background:rgba(18,18,24,.9); border-radius:2px; cursor:pointer;
        }
        .shop-mob-btn-primary { border-color:var(--gold); color:var(--gold); }
        .shop-sheet-ov {
          display:none; position:fixed; inset:0; z-index:860; background:rgba(0,0,0,.55);
          align-items:flex-end; justify-content:center;
        }
        .shop-sheet {
          width:100%; max-height:70vh; background:var(--ink2); border-top:1px solid var(--line2);
          border-radius:12px 12px 0 0; padding:0 0 12px; overflow:hidden;
        }
        .shop-sheet-head { display:flex; justify-content:space-between; align-items:center; padding:16px 18px; border-bottom:1px solid var(--line2); font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); }
        .shop-sheet-x { width:36px; height:36px; border:none; background:transparent; color:var(--cream); font-size:22px; cursor:pointer; line-height:1; }
        .shop-sheet-list { max-height:52vh; overflow-y:auto; padding:8px 12px 8px; }
        .shop-sheet-row {
          display:block; width:100%; text-align:left; padding:14px 12px; border:none; border-bottom:1px solid var(--line2);
          background:transparent; color:var(--cream); font-size:14px; cursor:pointer;
        }
        .shop-sheet-row.on { color:var(--gold); }
        .pc-wl-btn {
          padding: 6px 10px;
          border: 1px solid var(--line2);
          border-radius: 2px;
          font-size: 14px;
          line-height: 1;
          color: var(--fog);
          background: transparent;
          cursor: pointer;
          transition: border-color .22s, color .22s, background .22s;
        }
        .pc-wl-btn:hover, .pc-wl-btn.on {
          border-color: var(--gold);
          color: var(--gold);
          background: var(--gold-a10);
        }
        @media(max-width:768px){
          #shop.shop-root { padding:70px 16px 88px!important; }
          .shop-layout { flex-direction:column; gap:0; }
          .shop-sidebar-desktop { display:none!important; }
          .shop-mob-bar { display:flex!important; }
          .shop-sheet-ov { display:flex!important; }
        }
        @media(min-width:769px){
          .shop-mob-bar { display:none!important; }
          .shop-sheet-ov { display:none!important; }
        }
      `}</style>
    </section>
  )
}
