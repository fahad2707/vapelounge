'use client'
import { formatCad } from '@/lib/currency'
import { useCart } from '@/lib/store'

export default function CartDrawer() {
  const { state, dispatch } = useCart()
  const total = state.items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <>
      <div className={`cart-ov${state.open ? ' show' : ''}`} onClick={() => dispatch({ type: 'CLOSE' })} />
      <div className={`cart-drawer${state.open ? ' open' : ''}`}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid var(--line2)' }}>
          <h3 style={{ fontFamily:'var(--serif)', fontSize:19, fontWeight:400 }}>Your Cart</h3>
          <button onClick={() => dispatch({ type:'CLOSE' })} style={{ fontSize:18, color:'var(--fog)', transition:'color .25s', lineHeight:1 }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
          {state.items.length === 0 ? (
            <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'var(--fog)' }}>
              <div style={{ fontSize:40, opacity:.25 }}>🛒</div>
              <p style={{ fontSize:13 }}>Your cart is empty</p>
            </div>
          ) : state.items.map(item => (
            <div key={item.id} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:'1px solid var(--line2)' }}>
              <div style={{ width:52, height:52, background:'var(--ink3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{item.emoji}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--serif)', fontSize:14.5, fontWeight:400, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</div>
                <div style={{ fontSize:9.5, color:'var(--fog)', marginBottom:7 }}>{item.cat}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button className="ci-qb" onClick={() => dispatch({ type:'QTY', id:item.id, delta:-1 })}>−</button>
                  <span style={{ fontSize:12, width:16, textAlign:'center' }}>{item.qty}</span>
                  <button className="ci-qb" onClick={() => dispatch({ type:'QTY', id:item.id, delta:1 })}>+</button>
                  <button onClick={() => dispatch({ type:'REMOVE', id:item.id })} style={{ fontSize:11, color:'var(--fog)', marginLeft:4, transition:'color .2s' }}>✕</button>
                </div>
              </div>
              <div style={{ fontFamily:'var(--serif)', fontSize:16, color:'var(--gold)', marginLeft:'auto', alignSelf:'center', flexShrink:0 }}>
                {item.price ? formatCad(item.price * item.qty) : item.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'16px 24px', borderTop:'1px solid var(--line2)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:11, color:'var(--fog)', letterSpacing:'.08em', textTransform:'uppercase' }}>Total</span>
            <strong style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:400, color:'var(--gold)' }}>{formatCad(total)}</strong>
          </div>
          <button className="btn-fill" style={{ width:'100%' }}><span>Checkout →</span></button>
        </div>
      </div>
    </>
  )
}
