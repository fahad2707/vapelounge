'use client'
import { useCallback, useEffect, useState } from 'react'
import type { CatalogProduct } from '@/lib/catalog/types'
import CategoryProductRails, { type ShopDisplayCategory } from './CategoryProductRails'
import ProductModal from './ProductModal'

export default function ShopShowcase() {
  const [categories, setCategories] = useState<ShopDisplayCategory[]>([])
  const [loaded, setLoaded] = useState(false)
  const [modalProduct, setModalProduct] = useState<CatalogProduct | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const r = await fetch('/api/categories/shop-display', { signal: ac.signal })
        if (!r.ok) return
        const j = (await r.json()) as { categories?: ShopDisplayCategory[] }
        if (!ac.signal.aborted) setCategories(j.categories || [])
      } catch {
        /* ignore */
      } finally {
        if (!ac.signal.aborted) setLoaded(true)
      }
    })()
    return () => ac.abort()
  }, [])

  const openProduct = useCallback(async (summary: CatalogProduct) => {
    setModalProduct(summary)
    try {
      const r = await fetch(`/api/products/${encodeURIComponent(summary.id)}`, { cache: 'no-store' })
      if (!r.ok) return
      const j = (await r.json()) as { product?: CatalogProduct }
      if (j.product) setModalProduct(j.product)
    } catch {
      /* keep summary */
    }
  }, [])

  if (!loaded || categories.length === 0) return null

  return (
    <section id="shop-showcase" className="shop-showcase-section" aria-label="Featured category collections">
      <div className="shop-showcase-inner">
        <CategoryProductRails categories={categories} onOpenProduct={openProduct} />
      </div>
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onSwitchToProduct={async handleId => {
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
        .shop-showcase-section {
          padding: 0 56px 80px;
          background: var(--ink);
        }
        .shop-showcase-inner {
          max-width: 1420px;
          margin: 0 auto;
        }
        .shop-showcase-section .cat-rails-root {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }
        @media (max-width: 768px) {
          .shop-showcase-section { padding: 0 16px 64px; }
        }
      `}</style>
    </section>
  )
}
