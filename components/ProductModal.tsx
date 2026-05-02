'use client'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import type { CatalogProduct, CatalogVariantChoice } from '@/lib/catalog/types'
import { formatCad } from '@/lib/currency'
import { useCart } from '@/lib/store'
import { useToast } from './Toast'

function imageIndexForVariantPick(
  imagesLen: number,
  variantName: string,
  choiceIndex: number,
  variantPosition: number,
): number {
  if (imagesLen <= 1) return 0
  let h = variantPosition * 9973 + choiceIndex * 17
  for (let i = 0; i < variantName.length; i++) h = (h * 31 + variantName.charCodeAt(i)) | 0
  return Math.abs(h) % imagesLen
}

function VariantBlock({
  type,
  choices,
  selectedIdx,
  onSelect,
}: {
  type: string
  choices: CatalogVariantChoice[]
  selectedIdx: number
  onSelect: (choiceIndex: number) => void
}) {
  const isColor = type?.toUpperCase() === 'COLOR'
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {choices.map((c, i) =>
        isColor && c.swatch ? (
          <button
            key={`${c.label}-${i}`}
            type="button"
            title={c.label}
            aria-label={c.label}
            aria-pressed={selectedIdx === i}
            onClick={() => onSelect(i)}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: selectedIdx === i ? '2px solid var(--gold)' : '1px solid var(--line2)',
              background: c.swatch,
              padding: 0,
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <button
            key={`${c.label}-${i}`}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={selectedIdx === i}
            style={{
              padding: '6px 12px',
              border:
                selectedIdx === i ? '1px solid var(--gold)' : '1px solid var(--line2)',
              borderRadius: 3,
              fontSize: 11,
              color: selectedIdx === i ? 'var(--gold)' : 'var(--cream2)',
              background: selectedIdx === i ? 'var(--gold-a10)' : 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--body)',
            }}
          >
            {c.label}
          </button>
        ),
      )}
    </div>
  )
}

export default function ProductModal({ product, onClose }: { product: CatalogProduct; onClose: () => void }) {
  const { dispatch } = useCart()
  const toast = useToast()

  const images = product.images.length ? [...product.images] : [product.image].filter(Boolean)

  const [imgIdx, setImgIdx] = useState(0)
  const [picked, setPicked] = useState<Record<string, number>>({})

  useEffect(() => {
    setImgIdx(0)
    const init: Record<string, number> = {}
    for (const v of product.variants) init[v.name] = 0
    setPicked(init)
  }, [product.id, product.variants])

  const clampIdx = useCallback(
    (i: number) => {
      if (images.length === 0) return 0
      const m = images.length
      return ((i % m) + m) % m
    },
    [images.length],
  )

  const goPrev = useCallback(() => setImgIdx(i => clampIdx(i - 1)), [clampIdx])
  const goNext = useCallback(() => setImgIdx(i => clampIdx(i + 1)), [clampIdx])

  const onVariantPick = useCallback(
    (variantName: string, choiceIndex: number, variantPosition: number) => {
      setPicked(p => ({ ...p, [variantName]: choiceIndex }))
      setImgIdx(
        imageIndexForVariantPick(images.length, variantName, choiceIndex, variantPosition),
      )
    },
    [images.length],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, goPrev, goNext])

  const src = images[imgIdx] || ''

  return (
    <div
      className="pd-ov"
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 920,
        background: 'rgba(0,0,0,.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pd-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(960px, 100%)',
          maxHeight: 'min(92vh, 900px)',
          overflow: 'auto',
          background: 'var(--ink2)',
          border: '1px solid var(--line2)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)',
          gap: 0,
        }}
      >
        <div style={{ position: 'relative', minHeight: 320, background: 'var(--ink3)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 5,
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1px solid var(--line2)',
              background: 'rgba(10,10,13,.75)',
              color: 'var(--cream)',
              fontSize: 20,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>

          <div
            style={{
              position: 'relative',
              aspectRatio: 1,
              maxHeight: 'min(52vh, 520px)',
              margin: '0 auto',
            }}
          >
            {src ? (
              <Image
                key={src}
                src={src}
                alt={product.name}
                fill
                sizes="(max-width:768px) 100vw, 480px"
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
                  fontSize: 64,
                }}
              >
                💨
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous image"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 4,
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    border: '1px solid var(--line2)',
                    background: 'rgba(10,10,13,.82)',
                    color: 'var(--cream)',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next image"
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 4,
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    border: '1px solid var(--line2)',
                    background: 'rgba(10,10,13,.82)',
                    color: 'var(--cream)',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ›
                </button>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 4,
                    display: 'flex',
                    gap: 6,
                  }}
                >
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Image ${i + 1}`}
                      aria-current={i === imgIdx ? 'true' : undefined}
                      onClick={() => setImgIdx(i)}
                      style={{
                        width: i === imgIdx ? 18 : 7,
                        height: 7,
                        borderRadius: 4,
                        border: 'none',
                        padding: 0,
                        background: i === imgIdx ? 'var(--gold)' : 'rgba(255,255,255,.28)',
                        cursor: 'pointer',
                        transition: 'width .2s, background .2s',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ padding: '32px 36px 36px', display: 'flex', flexDirection: 'column' }}>
          {product.badge && (
            <span className="pc-badge tag" style={{ alignSelf: 'flex-start', marginBottom: 12, padding: '4px 10px', fontSize: 9, letterSpacing: '.12em' }}>
              {product.badge}
            </span>
          )}
          <div style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
            {product.brand?.trim() || 'VapeLounge'} · {product.primaryCategory}
          </div>
          <h2 id="pd-title" style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 400, lineHeight: 1.15, marginBottom: 16, color: 'var(--cream)' }}>
            {product.name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--cream)' }}>{formatCad(product.price)}</span>
            {product.compareAtPrice != null && product.compareAtPrice > product.price && (
              <span style={{ fontSize: 15, color: 'var(--fog2)', textDecoration: 'line-through' }}>{formatCad(product.compareAtPrice)}</span>
            )}
          </div>

          <div
            className="pd-desc"
            style={{
              fontSize: 13,
              fontWeight: 300,
              color: 'var(--fog)',
              lineHeight: 1.7,
              marginBottom: 20,
              flex: 1,
              overflow: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml || `<p>${product.descriptionPlain}</p>` }}
          />

          {product.variants.length > 0 && (
            <div style={{ borderTop: '1px solid var(--line2)', paddingTop: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Variants</div>
              {product.variants.map((v, vi) => (
                <div key={v.name} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--cream2)', marginBottom: 6 }}>{v.name}</div>
                  <VariantBlock
                    type={v.type}
                    choices={v.choices}
                    selectedIdx={picked[v.name] ?? 0}
                    onSelect={ci => onVariantPick(v.name, ci, vi)}
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn-fill"
            disabled={!product.inStock}
            style={{ alignSelf: 'stretch', justifyContent: 'center', marginTop: 'auto' }}
            onClick={() => {
              if (!product.inStock) return
              dispatch({
                type: 'ADD',
                item: {
                  id: product.id,
                  emoji: '🛒',
                  name: product.name,
                  cat: product.primaryCategory,
                  price: product.price,
                  label: formatCad(product.price),
                },
              })
              toast(`${product.name} added to cart`)
              onClose()
            }}
          >
            <span>{product.inStock ? 'Add to cart' : 'Out of stock'}</span>
          </button>
        </div>
      </div>

      <style>{`
        .pd-desc p { margin: 0 0 0.65em; }
        .pd-desc ul, .pd-desc ol { margin: 0.5em 0 0.75em 1.1em; padding: 0; }
        .pd-desc li { margin-bottom: 0.35em; }
        @media(max-width:768px){
          [role="dialog"] { grid-template-columns: 1fr !important; max-height: 94vh !important; }
        }
      `}</style>
    </div>
  )
}
