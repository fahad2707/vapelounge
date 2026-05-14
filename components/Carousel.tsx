'use client'
import { useEffect, useRef, useState } from 'react'
import { CAROUSEL_DATA } from '@/lib/data'

interface FeaturedCategory {
  id: string
  slug: string
  name: string
  image: string | null
  productCount: number
}

interface WheelCard {
  key: string
  title: string
  sub: string
  image: string | null
  emoji: string | null
  cta: string
  glow: string
  /** Triggers brand filter in the Shop section when present. */
  filterBrand?: string
}

const GOLD_GLOW = '#C9A85E'
const EMOJI_FALLBACK = ['💨', '🥭', '🍓', '🍇', '🍋', '🍉']

function getRadius(count: number) {
  if (typeof window === 'undefined') return 300
  if (window.innerWidth <= 480) return 150
  if (window.innerWidth <= 768) return 190
  // Tighter ring when there are few cards so they don't sit far apart.
  if (count <= 4) return 240
  return 300
}

export default function Carousel() {
  const wheelRef  = useRef<HTMLDivElement>(null)
  const angleRef  = useRef(0)
  const idxRef    = useRef(0)
  const autoRef   = useRef<ReturnType<typeof setInterval>>(undefined)
  const [idx, setIdx] = useState(0)
  const [cards, setCards] = useState<WheelCard[]>(() =>
    CAROUSEL_DATA.map((d, i) => ({
      key: `static-${i}`,
      title: d.name,
      sub: d.cat,
      image: null,
      emoji: d.emoji,
      cta: 'Featured',
      glow: d.glow || GOLD_GLOW,
    })),
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/categories/featured', { cache: 'no-store' })
        if (!r.ok) return
        const j = (await r.json()) as { categories?: FeaturedCategory[] }
        if (cancelled) return
        if (Array.isArray(j.categories) && j.categories.length >= 3) {
          setCards(
            j.categories.map((c, i) => ({
              key: c.id,
              title: c.name,
              sub: 'Shop the line',
              image: c.image,
              emoji: c.image ? null : EMOJI_FALLBACK[i % EMOJI_FALLBACK.length],
              cta: c.productCount > 0 ? `${c.productCount} products` : 'Explore',
              glow: GOLD_GLOW,
              filterBrand: c.name,
            })),
          )
        }
      } catch {
        /* keep static fallback */
      }
    })()
    return () => { cancelled = true }
  }, [])

  const count = cards.length
  const step = count > 0 ? 360 / count : 360

  const positionCards = () => {
    const r = getRadius(count)
    cards.forEach((_, i) => {
      const card = document.getElementById('hlc' + i)
      if (card) card.style.transform = `rotateY(${i * step}deg) translateZ(${r}px)`
    })
  }

  const spin = (animate: boolean) => {
    const w = wheelRef.current; if (!w) return
    w.style.transition = animate ? 'transform .75s cubic-bezier(.4,0,.2,1)' : 'none'
    w.style.transform  = `rotateY(${-angleRef.current}deg)`
    const cur = idxRef.current
    cards.forEach((_, i) => {
      const face = document.querySelector<HTMLElement>(`#hlc${i} .hl-card-face`)
      if (!face) return
      face.style.borderColor = i === cur ? 'rgba(201,168,94,.35)' : ''
      face.style.boxShadow   = i === cur ? '0 24px 72px rgba(0,0,0,.55),0 0 40px rgba(201,168,94,.12)' : ''
    })
  }

  const goNext = () => {
    if (count === 0) return
    angleRef.current += step
    idxRef.current = (idxRef.current + 1) % count
    setIdx(idxRef.current); spin(true)
  }
  const goPrev = () => {
    if (count === 0) return
    angleRef.current -= step
    idxRef.current = (idxRef.current - 1 + count) % count
    setIdx(idxRef.current); spin(true)
  }
  const goTo = (t: number) => {
    if (count === 0) return
    let diff = t - idxRef.current
    if (diff >  count / 2) diff -= count
    if (diff < -count / 2) diff += count
    angleRef.current += diff * step
    idxRef.current = ((t % count) + count) % count
    setIdx(idxRef.current); spin(true)
  }

  const startAuto = () => { autoRef.current = setInterval(goNext, 3600) }
  const stopAuto  = () => clearInterval(autoRef.current)

  useEffect(() => {
    if (count === 0) return
    idxRef.current = 0
    angleRef.current = 0
    positionCards()
    spin(false)
    stopAuto()
    startAuto()
    const onResize = () => { positionCards(); spin(false) }
    window.addEventListener('resize', onResize)
    return () => {
      stopAuto()
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, step])

  const handleCardClick = (c: WheelCard) => {
    if (c.filterBrand) {
      window.dispatchEvent(new CustomEvent('vp:filter-brand', { detail: c.filterBrand }))
    }
    const el = document.getElementById('shop')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="highlights" style={{padding:'80px 0 60px'}}>
      <div style={{padding:'0 56px',marginBottom:0,display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:16}}>
        <h2 className="rv" style={{fontFamily:'var(--serif)',fontSize:'clamp(34px,4.5vw,58px)',fontWeight:400,lineHeight:1.06}}>
          Our <em style={{color:'var(--gold)',fontStyle:'italic'}}>Featured</em><br/>Product Lines
        </h2>
      </div>

      <div className="hl-scene">
        <div className="hl-wheel" ref={wheelRef} id="hlWheel"
          onMouseEnter={stopAuto} onMouseLeave={startAuto}>
          {cards.map((d, i) => (
            <div key={d.key} className="hl-card" id={`hlc${i}`}>
              <button
                type="button"
                className="hl-card-face"
                onClick={() => handleCardClick(d)}
                style={{ display: 'block', width: '100%', height: '100%', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                aria-label={`View ${d.title}`}
              >
                <div style={{height:126,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:110,height:110,borderRadius:'50%',filter:'blur(40px)',opacity:.3,background:`radial-gradient(circle,${d.glow}40,transparent 70%)`}}/>
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:44,background:'linear-gradient(transparent,rgba(10,10,13,.45))', zIndex: 2}}/>
                  {d.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={d.image}
                      alt={d.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                    />
                  ) : (
                    <span style={{ position: 'relative', zIndex: 1 }}>{d.emoji}</span>
                  )}
                </div>
                <div style={{padding:'12px 14px 14px'}}>
                  <div style={{fontSize:8,letterSpacing:'.22em',textTransform:'uppercase',color:'var(--gold)',marginBottom:5}}>{d.sub}</div>
                  <div style={{fontFamily:'var(--serif)',fontSize:15,fontWeight:400,lineHeight:1.2,marginBottom:10,color:'var(--cream)'}}>{d.title}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontFamily:'var(--body)',fontSize:11,color:'var(--fog)',letterSpacing:'.06em',textTransform:'uppercase'}}>
                      {d.cta}
                    </span>
                    <span style={{width:26,height:26,border:'1px solid rgba(201,168,94,.3)',color:'var(--gold)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>→</span>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rv" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:22,marginTop:44,padding:'0 56px'}}>
        <button onClick={goPrev} style={{width:44,height:44,border:'1px solid var(--line)',color:'rgba(246,242,234,.5)',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .3s'}}>←</button>
        <div style={{display:'flex',gap:7}}>
          {cards.map((_, i) => <button key={i} onClick={()=>goTo(i)} className={`hl-dot${idx===i?' on':''}`}/>)}
        </div>
        <button onClick={goNext} style={{width:44,height:44,border:'1px solid var(--line)',color:'rgba(246,242,234,.5)',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .3s'}}>→</button>
      </div>

      <style>{`
        @media(max-width:768px){
          #highlights{padding:70px 0 60px!important}
          #highlights>div:first-child{padding:0 20px!important;flex-direction:column!important;align-items:flex-start!important}
        }
      `}</style>
    </section>
  )
}
