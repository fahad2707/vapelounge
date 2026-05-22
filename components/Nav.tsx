'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useCart } from '@/lib/store'
import { useWishlist } from '@/lib/wishlist'

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
  const { state: wlState, dispatch: wlDispatch } = useWishlist()
  const totalQty = state.items.reduce((s, i) => s + i.qty, 0)
  const wlCount = wlState.items.length

  useEffect(() => {
    const fn = () => setStuck(window.scrollY > 55)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const close = () => setMobOpen(false)

  return (
    <>
      <nav
        className={`site-nav${stuck ? ' site-nav--stuck' : ''}`}
        style={{
          position:'fixed',top:0,left:0,right:0,zIndex:700,
          display:'flex',alignItems:'center',justifyContent:'space-between',
          background: stuck ? 'rgba(10,10,13,.88)' : 'transparent',
          backdropFilter: stuck ? 'blur(24px) saturate(1.4)' : 'none',
          borderBottom: stuck ? '1px solid var(--line)' : 'none',
          transition:'background .45s,border-color .45s',
          gap:12,
        }}
      >
        <a href="#" className="nav-brand">
          <Image
            src="/logo.png"
            alt="Vape Lounge"
            width={814}
            height={306}
            priority
            className="nav-logo-img"
          />
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
          <button
            type="button"
            className="nav-wishlist-btn"
            onClick={() => wlDispatch({ type: 'OPEN' })}
            style={{
              display:'flex',alignItems:'center',gap:6,border:'1px solid var(--line)',
              padding:'8px 14px',fontSize:11,letterSpacing:'.12em',textTransform:'uppercase',
              color:'rgba(246,242,234,.7)',transition:'border-color .3s,color .3s',position:'relative',
            }}
            aria-label="Wishlist"
          >
            ♡ Wishlist
            {wlCount > 0 && (
              <span style={{position:'absolute',top:-7,right:-7,width:17,height:17,borderRadius:'50%',background:'var(--gold)',color:'var(--ink)',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{wlCount}</span>
            )}
          </button>
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
        .site-nav {
          padding: 12px 56px;
          min-height: 52px;
          box-sizing: border-box;
        }
        .site-nav--stuck {
          padding: 8px 56px;
          min-height: 48px;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          min-width: 0;
          line-height: 0;
        }
        .nav-logo-img {
          display: block;
          width: auto;
          height: 34px;
          max-width: min(200px, 52vw);
          object-fit: contain;
          object-position: left center;
        }
        @media(max-width:768px){
          .site-nav, .site-nav--stuck {
            padding: 8px 14px !important;
            min-height: 44px !important;
            gap: 8px !important;
          }
          .nav-logo-img {
            height: 28px;
            max-width: min(168px, 58vw);
          }
          .nav-mid-desktop{ display:none!important; }
          #ham-btn{ display:flex!important; }
          .nav-cart-btn, .nav-wishlist-btn{ display:none!important; }
        }
        @media(min-width:769px){ #ham-btn{ display:none!important; } }
      `}</style>
    </>
  )
}
