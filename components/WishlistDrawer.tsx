'use client'
import Image from 'next/image'
import { formatCad } from '@/lib/currency'
import { useCart } from '@/lib/store'
import { useWishlist } from '@/lib/wishlist'

export default function WishlistDrawer() {
  const { state, dispatch } = useWishlist()
  const { dispatch: cartDispatch } = useCart()

  return (
    <>
      <div className={`cart-ov${state.open ? ' show' : ''}`} onClick={() => dispatch({ type: 'CLOSE' })} />
      <div className={`cart-drawer wishlist-drawer${state.open ? ' open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--line2)' }}>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 400 }}>Wishlist</h3>
          <button type="button" onClick={() => dispatch({ type: 'CLOSE' })} style={{ fontSize: 18, color: 'var(--fog)', lineHeight: 1 }}>
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {state.items.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--fog)' }}>
              <div style={{ fontSize: 40, opacity: 0.25 }}>♡</div>
              <p style={{ fontSize: 13 }}>No saved items yet</p>
            </div>
          ) : (
            state.items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line2)' }}>
                <div style={{ width: 52, height: 52, position: 'relative', background: 'var(--ink3)', flexShrink: 0, overflow: 'hidden' }}>
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="52px" style={{ objectFit: 'cover' }} unoptimized />
                  ) : (
                    <span style={{ display: 'grid', placeItems: 'center', height: '100%', fontSize: 22 }}>💨</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 8 }}>{formatCad(item.price)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '6px 10px', fontSize: 10 }}
                      onClick={() => {
                        cartDispatch({
                          type: 'ADD',
                          item: {
                            id: item.id,
                            emoji: '🛒',
                            name: item.name,
                            cat: item.cat,
                            price: item.price,
                            label: formatCad(item.price),
                          },
                        })
                        cartDispatch({ type: 'OPEN' })
                      }}
                    >
                      + Cart
                    </button>
                    <button type="button" onClick={() => dispatch({ type: 'REMOVE', id: item.id })} style={{ fontSize: 11, color: 'var(--fog)' }}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
