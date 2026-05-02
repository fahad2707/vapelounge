'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { CatalogProduct } from '@/lib/catalog/types'
import { formatCad } from '@/lib/currency'
import { useCart } from '@/lib/store'
import ProductModal from './ProductModal'
import { useToast } from './Toast'

function badgeClass(badge: string | null): string {
  if (!badge) return ''
  const b = badge.toLowerCase()
  if (b === 'hot' || b === 'sale' || b === 'new') return b
  return 'tag'
}

function ProductCard({
  p,
  onOpen,
}: {
  p: CatalogProduct
  onOpen: () => void
}) {
  const { dispatch } = useCart()
  const toast = useToast()
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
        <button
          type="button"
          className="pc-wl"
          onClick={e => {
            e.stopPropagation()
            toast('Saved to wishlist')
          }}
        >
          ♡
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
  )
}

type ProductsResponse = {
  products: CatalogProduct[]
  brands?: string[]
  message?: string
}

export default function Shop() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [brands, setBrands] = useState<string[]>(['All brands'])
  const [brandFilt, setBrandFilt] = useState('All brands')
  const [vis, setVis] = useState(24)
  const [loaded, setLoaded] = useState(false)
  const [modalProduct, setModalProduct] = useState<CatalogProduct | null>(null)
  const [brandSheet, setBrandSheet] = useState(false)
  const { dispatch } = useCart()

  useEffect(() => {
    const ac = new AbortController()
    setLoaded(false)
    ;(async () => {
      try {
        const q = new URLSearchParams()
        q.set('limit', '1000')
        if (brandFilt && brandFilt !== 'All brands') q.set('brand', brandFilt)
        const r = await fetch(`/api/products?${q.toString()}`, { cache: 'no-store', signal: ac.signal })
        const data = (await r.json()) as ProductsResponse
        if (ac.signal.aborted) return
        if (Array.isArray(data.products)) setProducts(data.products)
        if (data.brands?.length) setBrands(data.brands)
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return
        if (!ac.signal.aborted) setProducts([])
      } finally {
        if (!ac.signal.aborted) setLoaded(true)
      }
    })()
    return () => ac.abort()
  }, [brandFilt])

  const openBrands = () => setBrandSheet(true)
  const closeBrands = () => setBrandSheet(false)

  const selectBrand = (b: string) => {
    setBrandFilt(b)
    setVis(24)
    setBrandSheet(false)
  }

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
          <div className="shop-sidebar-title">Brand / line</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          {loaded && products.length === 0 && (
            <p style={{ color: 'var(--fog)', fontSize: 14, marginBottom: 24 }}>
              No products loaded. Set <code style={{ color: 'var(--cream2)' }}>MONGODB_URI</code> and run{' '}
              <code style={{ color: 'var(--cream2)' }}>npm run db:seed</code>.
            </p>
          )}

          <div className="pgrid">
            {products.slice(0, vis).map(p => (
              <ProductCard key={p.id} p={p} onOpen={() => setModalProduct(p)} />
            ))}
          </div>

          {products.length > vis && (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <button type="button" className="btn-ghost" onClick={() => setVis(v => v + 24)}>
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

      {modalProduct && <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} />}

      <style>{`
        .shop-layout { display:flex; gap:40px; align-items:flex-start; max-width:1420px; margin:0 auto; }
        .shop-sidebar { width:220px; flex-shrink:0; position:sticky; top:96px; max-height:calc(100vh - 120px); overflow-y:auto; padding-right:6px; }
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
        .pc-wl { z-index:4; }
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
