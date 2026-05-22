'use client'
import Image from 'next/image'
import { useCallback, useRef } from 'react'
import type { CatalogProduct } from '@/lib/catalog/types'
import { formatCad } from '@/lib/currency'

export interface ShopDisplayCategory {
  id: string
  slug: string
  name: string
  image: string | null
  products: CatalogProduct[]
}

function RailCard({ p, onOpen }: { p: CatalogProduct; onOpen: () => void }) {
  return (
    <button type="button" className="cat-rail-card" onClick={onOpen}>
      <div className="cat-rail-img">
        {p.image ? (
          <Image src={p.image} alt={p.name} fill sizes="200px" style={{ objectFit: 'cover' }} unoptimized />
        ) : (
          <span style={{ fontSize: 36 }}>💨</span>
        )}
      </div>
      <div className="cat-rail-meta">
        <div className="cat-rail-name">{p.name}</div>
        <div className="cat-rail-price">{formatCad(p.price)}</div>
      </div>
    </button>
  )
}

function ProductRail({
  category,
  onOpenProduct,
}: {
  category: ShopDisplayCategory
  onOpenProduct: (p: CatalogProduct) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scroll = useCallback((dir: -1 | 1) => {
    const el = trackRef.current
    if (!el) return
    const step = Math.min(el.clientWidth * 0.85, 320)
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }, [])

  return (
    <div className="cat-rail-block">
      <div className="cat-rail-head">
        <h3 className="cat-rail-title">{category.name}</h3>
        <div className="cat-rail-arrows">
          <button type="button" className="cat-rail-arrow" onClick={() => scroll(-1)} aria-label={`Scroll ${category.name} left`}>
            ‹
          </button>
          <button type="button" className="cat-rail-arrow" onClick={() => scroll(1)} aria-label={`Scroll ${category.name} right`}>
            ›
          </button>
        </div>
      </div>
      <div className="cat-rail-track-wrap">
        <div className="cat-rail-track" ref={trackRef}>
          {category.products.map(p => (
            <RailCard key={p.id} p={p} onOpen={() => onOpenProduct(p)} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CategoryProductRails({
  categories,
  onOpenProduct,
}: {
  categories: ShopDisplayCategory[]
  onOpenProduct: (p: CatalogProduct) => void
}) {
  if (!categories.length) return null

  return (
    <div className="cat-rails-root">
      <div className="cat-rails-intro">
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 400, marginBottom: 8 }}>
          Browse by <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>category</em>
        </h2>
        <p style={{ fontSize: 13, color: 'var(--fog)', maxWidth: 480, lineHeight: 1.7 }}>
          Featured lines from our catalogue — swipe or use arrows to explore each range.
        </p>
      </div>
      {categories.map(cat => (
        <ProductRail key={cat.id} category={cat} onOpenProduct={onOpenProduct} />
      ))}
      <style>{`
        .cat-rails-root {
          margin-top: 56px;
          padding-top: 48px;
          border-top: 1px solid var(--line2);
        }
        .cat-rails-intro { margin-bottom: 32px; }
        .cat-rail-block { margin-bottom: 36px; }
        .cat-rail-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .cat-rail-title {
          font-family: var(--serif);
          font-size: clamp(20px, 2.5vw, 28px);
          font-weight: 400;
          color: var(--cream);
        }
        .cat-rail-arrows { display: flex; gap: 8px; flex-shrink: 0; }
        .cat-rail-arrow {
          width: 40px;
          height: 40px;
          border: 1px solid var(--line2);
          border-radius: 50%;
          background: transparent;
          color: var(--cream);
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          transition: border-color .25s, color .25s, background .25s;
        }
        .cat-rail-arrow:hover {
          border-color: var(--gold);
          color: var(--gold);
          background: var(--gold-a10);
        }
        .cat-rail-track-wrap {
          position: relative;
          margin: 0 -4px;
        }
        .cat-rail-track {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-padding: 4px;
          padding: 4px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .cat-rail-track::-webkit-scrollbar { display: none; }
        .cat-rail-card {
          flex: 0 0 min(200px, 42vw);
          scroll-snap-align: start;
          border: 1px solid var(--line2);
          background: var(--ink2);
          border-radius: 2px;
          overflow: hidden;
          text-align: left;
          cursor: pointer;
          transition: border-color .25s;
          padding: 0;
          color: inherit;
          font: inherit;
        }
        .cat-rail-card:hover { border-color: var(--gold); }
        .cat-rail-img {
          position: relative;
          aspect-ratio: 1;
          background: var(--ink3);
          display: grid;
          place-items: center;
        }
        .cat-rail-meta { padding: 10px 12px 12px; }
        .cat-rail-name {
          font-size: 12px;
          line-height: 1.35;
          color: var(--cream);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.7em;
        }
        .cat-rail-price {
          margin-top: 6px;
          font-family: var(--serif);
          font-size: 15px;
          color: var(--gold);
        }
        @media (max-width: 768px) {
          .cat-rails-root { margin-top: 40px; padding-top: 32px; }
          .cat-rail-arrow { width: 36px; height: 36px; font-size: 20px; }
        }
      `}</style>
    </div>
  )
}
