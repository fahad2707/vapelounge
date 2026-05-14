'use client'
import { useState, useEffect } from 'react'
import { useCart } from '@/lib/store'

const LINKS = [
  { href: '#about',      label: 'About'      },
  { href: '#highlights', label: 'Products'   },
  { href: '#shop',       label: 'Shop'       },
  { href: '#testi',      label: 'Reviews'    },
]

export default function Nav() {
  const [stuck,   setStuck]   = useState(false)
  const [mobOpen, setMobOpen] = useState(false)
  const { state, dispatch } = useCart()
  const totalQty = state.items.reduce((s, i) => s + i.qty, 0)

  useEffect(() => {
    const fn = () => setStuck(window.scrollY > 55)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const close = () => setMobOpen(false)

  return (
    <>
      <nav className="site-nav" style={{
        position:'fixed',top:0,left:0,right:0,zIndex:700,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding: stuck ? '14px 56px' : '26px 56px',
        background: stuck ? 'rgba(10,10,13,.88)' : 'transparent',
        backdropFilter: stuck ? 'blur(24px) saturate(1.4)' : 'none',
        borderBottom: stuck ? '1px solid var(--line)' : 'none',
        transition:'padding .45s var(--ease),background .45s,border-color .45s',
        gap:12,
      }}>
        <a href="#" className="nav-brand" style={{fontFamily:'var(--serif)',fontSize:18,fontWeight:500,letterSpacing:'.04em',display:'flex',alignItems:'center',gap:8,flexShrink:0,minWidth:0}}>
          <span style={{fontSize:20}}>💨</span>
          Vape<span style={{color:'var(--gold)'}}>Lounge</span>
        </a>

        <div style={{display:'flex',gap:34,alignItems:'center'}} className="nav-mid-desktop">
          {LINKS.map(l => (
            <a key={l.href} href={l.href} className="nav-link" style={{
              fontSize:11,letterSpacing:'.16em',textTransform:'uppercase',
              color:'rgba(246,242,234,.55)',transition:'color .3s',position:'relative',
            }}
              onMouseEnter={e=>(e.currentTarget.style.color='var(--gold)')}
              onMouseLeave={e=>(e.currentTarget.style.color='rgba(246,242,234,.55)')}
            >{l.label}</a>
          ))}
        </div>

        <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <button className="nav-cart-btn" onClick={()=>dispatch({type:'OPEN'})} style={{
            display:'flex',alignItems:'center',gap:7,border:'1px solid var(--line)',
            padding:'8px 18px',fontSize:11,letterSpacing:'.12em',textTransform:'uppercase',
            color:'rgba(246,242,234,.7)',transition:'border-color .3s,color .3s',position:'relative',
          }}>
            🛒 Cart
            {totalQty > 0 && (
              <span style={{position:'absolute',top:-7,right:-7,width:17,height:17,borderRadius:'50%',background:'var(--gold)',color:'var(--ink)',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{totalQty}</span>
            )}
          </button>
          <button className="ham" id="ham-btn" onClick={()=>setMobOpen(v=>!v)}
            style={{display:'none',flexDirection:'column',gap:5,padding:6,width:36}} aria-label="Menu">
            <span/><span/><span/>
          </button>
        </div>
      </nav>

      <div className={`nav-backdrop${mobOpen?' show':''}`} onClick={close}/>
      <div className={`mob-nav${mobOpen?' open':''}`}>
        {LINKS.map(l => (
          <a key={l.href} href={l.href} onClick={close} style={{fontSize:22,fontFamily:'var(--serif)',fontWeight:400,color:'var(--cream)',transition:'color .3s'}}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--gold)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--cream)')}>{l.label}</a>
        ))}
        <button className="btn-fill" style={{marginTop:16,alignSelf:'flex-start'}} onClick={()=>{close();dispatch({type:'OPEN'})}}>
          <span>Cart</span>
        </button>
      </div>

      <style>{`
        @media(max-width:768px){
          .site-nav{ padding:14px 18px!important; gap:10px!important; }
          .nav-mid-desktop{ display:none!important; }
          #ham-btn{ display:flex!important; }
          .nav-cart-btn{ display:none!important; }
          .nav-brand{ font-size:16px!important; }
          .nav-brand>span:first-child{ font-size:18px!important; }
        }
        @media(min-width:769px){ #ham-btn{ display:none!important; } }
      `}</style>
    </>
  )
}
