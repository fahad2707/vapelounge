'use client'
import { useEffect, useRef, useState } from 'react'
import { CAROUSEL_DATA } from '@/lib/data'
import { useCart } from '@/lib/store'
import { useToast } from './Toast'

const HN   = CAROUSEL_DATA.length
const STEP = 360 / HN

function getRadius() {
  if (typeof window === 'undefined') return 300
  if (window.innerWidth <= 480) return 200
  if (window.innerWidth <= 768) return 240
  return 300
}

export default function Carousel() {
  const wheelRef  = useRef<HTMLDivElement>(null)
  const angleRef  = useRef(0)
  const idxRef    = useRef(0)
  const autoRef   = useRef<ReturnType<typeof setInterval>>(undefined)
  const [idx, setIdx] = useState(0)
  const { dispatch } = useCart()
  const toast = useToast()

  const positionCards = () => {
    const r = getRadius()
    CAROUSEL_DATA.forEach((_, i) => {
      const card = document.getElementById('hlc' + i)
      if (card) card.style.transform = `rotateY(${i * STEP}deg) translateZ(${r}px)`
    })
  }

  const spin = (animate: boolean) => {
    const w = wheelRef.current; if (!w) return
    w.style.transition = animate ? 'transform .75s cubic-bezier(.4,0,.2,1)' : 'none'
    w.style.transform  = `rotateY(${-angleRef.current}deg)`
    const cur = idxRef.current
    CAROUSEL_DATA.forEach((_, i) => {
      const face = document.querySelector<HTMLElement>(`#hlc${i} .hl-card-face`)
      if (!face) return
      face.style.borderColor = i === cur ? 'rgba(201,168,94,.35)' : ''
      face.style.boxShadow   = i === cur ? '0 24px 72px rgba(0,0,0,.55),0 0 40px rgba(201,168,94,.12)' : ''
    })
  }

  const goNext = () => { angleRef.current += STEP; idxRef.current = (idxRef.current+1)%HN; setIdx(idxRef.current); spin(true) }
  const goPrev = () => { angleRef.current -= STEP; idxRef.current = (idxRef.current-1+HN)%HN; setIdx(idxRef.current); spin(true) }
  const goTo   = (t: number) => {
    let diff = t - idxRef.current
    if (diff >  HN/2) diff -= HN
    if (diff < -HN/2) diff += HN
    angleRef.current += diff * STEP
    idxRef.current = ((t%HN)+HN)%HN
    setIdx(idxRef.current); spin(true)
  }

  const startAuto = () => { autoRef.current = setInterval(goNext, 3600) }
  const stopAuto  = () => clearInterval(autoRef.current)

  useEffect(() => {
    positionCards(); spin(false)
    startAuto()
    window.addEventListener('resize', () => { positionCards(); spin(false) })
    return stopAuto
  }, [])

  return (
    <section id="highlights" style={{padding:'80px 0 60px'}}>
      <div style={{padding:'0 56px',marginBottom:0,display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:16}}>
        <h2 className="rv" style={{fontFamily:'var(--serif)',fontSize:'clamp(34px,4.5vw,58px)',fontWeight:400,lineHeight:1.06}}>
          Our <em style={{color:'var(--gold)',fontStyle:'italic'}}>Featured</em><br/>Product Lines
        </h2>
        <p className="rv" style={{fontSize:13,fontWeight:300,color:'var(--fog)',maxWidth:230,textAlign:'right',lineHeight:1.7}}>
          Curated for flavour chasers, cloud lovers, and those quitting smoking.
        </p>
      </div>

      <div className="hl-scene">
        <div className="hl-wheel" ref={wheelRef} id="hlWheel"
          onMouseEnter={stopAuto} onMouseLeave={startAuto}>
          {CAROUSEL_DATA.map((d, i) => (
            <div key={i} className="hl-card" id={`hlc${i}`}>
              <div className="hl-card-face">
                <div style={{height:126,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,position:'relative'}}>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:110,height:110,borderRadius:'50%',filter:'blur(40px)',opacity:.3,background:`radial-gradient(circle,${d.glow}40,transparent 70%)`}}/>
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:44,background:'linear-gradient(transparent,rgba(10,10,13,.45))'}}/>
                  {d.emoji}
                </div>
                <div style={{padding:'12px 14px 14px'}}>
                  <div style={{fontSize:8,letterSpacing:'.22em',textTransform:'uppercase',color:'var(--gold)',marginBottom:5}}>{d.cat}</div>
                  <div style={{fontFamily:'var(--serif)',fontSize:15,fontWeight:400,lineHeight:1.2,marginBottom:5}}>{d.name}</div>
                  <div style={{fontSize:10,fontWeight:300,color:'var(--fog)',lineHeight:1.5,marginBottom:10}}>{d.desc}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontFamily:'var(--serif)',fontSize:14,color:'var(--gold)',fontWeight:400}}>{d.price}</span>
                    <button className="hl-add" onClick={()=>{
                      dispatch({type:'ADD',item:{id:`h${i}`,emoji:d.emoji,name:d.name,cat:d.cat,price:0,label:d.price}})
                      toast(`${d.name} added to cart`)
                    }} style={{width:26,height:26,border:'1px solid rgba(201,168,94,.3)',color:'var(--gold)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .28s'}}>+</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rv" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:22,marginTop:44,padding:'0 56px'}}>
        <button onClick={goPrev} style={{width:44,height:44,border:'1px solid var(--line)',color:'rgba(246,242,234,.5)',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .3s'}}>←</button>
        <div style={{display:'flex',gap:7}}>
          {CAROUSEL_DATA.map((_, i) => <button key={i} onClick={()=>goTo(i)} className={`hl-dot${idx===i?' on':''}`}/>)}
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
