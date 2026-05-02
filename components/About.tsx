'use client'
import { useEffect, useRef } from 'react'

const STATS = [
  { v: '6+',    k: 'Years Trading'    },
  { v: '50K+',  k: 'Happy Customers'  },
  { v: '500+',  k: 'Flavours in Stock'},
  { v: '4.9★',  k: 'Average Rating'   },
]

export default function About() {
  const mosaicRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mosaicRef.current
    if (!el) return
    el.innerHTML = ''
    for (let i = 0; i < 80; i++) {
      const c = document.createElement('div')
      c.className = 'mc'
      if (Math.random() > .85) {
        c.classList.add('lit')
        c.style.animationDelay = (Math.random() * 4) + 's'
        c.style.animationDuration = (3 + Math.random() * 3) + 's'
      }
      el.appendChild(c)
    }
  }, [])

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('.stat-v').forEach(el => {
      const obs = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return
        const raw = el.textContent?.trim() || ''
        const match = raw.match(/^([\d.]+)(K?\+?★?)$/)
        if (!match) { obs.disconnect(); return }
        const num = parseFloat(match[1]), sfx = match[2]
        let cur = 0; const step = num / 52
        const iv = setInterval(() => {
          cur += step
          if (cur >= num) { cur = num; clearInterval(iv) }
          el.textContent = (Number.isInteger(num) ? Math.round(cur) : cur.toFixed(1)) + sfx
        }, 20)
        obs.disconnect()
      }, { threshold: .5 })
      obs.observe(el)
    })
  }, [])

  useEffect(() => {
    const ro = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') })
    }, { threshold: .1, rootMargin: '0px 0px -44px 0px' })
    document.querySelectorAll('.rv,.rvl,.rvr').forEach(el => ro.observe(el))
    return () => ro.disconnect()
  }, [])

  return (
    <section id="about" style={{padding:'120px 56px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'center'}}>
      <div className="rvl">
        <div style={{fontSize:10,letterSpacing:'.24em',textTransform:'uppercase',color:'var(--gold)',display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
          <span style={{width:26,height:1,background:'var(--gold)',display:'block'}}/>
          Who We Are
        </div>
        <h2 style={{fontFamily:'var(--serif)',fontSize:'clamp(36px,4.5vw,60px)',fontWeight:400,lineHeight:1.06,marginBottom:22}}>
          More than a<br/><em style={{color:'var(--gold)',fontStyle:'italic'}}>vape shop</em>
        </h2>
        <p style={{fontSize:14,fontWeight:300,lineHeight:1.85,color:'var(--fog)',marginBottom:36,maxWidth:440}}>
          VapeLounge was built by vapers, for vapers. We stock only products we&apos;ve tested ourselves, offer genuine advice with no upsell pressure, and ship fast across Canada. Walk in, or order online — the experience is the same.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'var(--line2)'}}>
          {STATS.map(s => (
            <div key={s.k} style={{background:'var(--ink)',padding:'22px 18px',transition:'background .3s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(201,168,94,.10)')}
              onMouseLeave={e=>(e.currentTarget.style.background='var(--ink)')}>
              <div className="stat-v" style={{fontFamily:'var(--serif)',fontSize:40,fontWeight:400,color:'var(--gold)',lineHeight:1,marginBottom:4}}>{s.v}</div>
              <div style={{fontSize:10,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--fog)'}}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rvr" style={{position:'relative'}}>
        <div ref={mosaicRef} style={{
          width:'100%',aspectRatio:'4/5',background:'var(--ink2)',border:'1px solid var(--line2)',
          display:'grid',gridTemplateColumns:'repeat(8,1fr)',gridTemplateRows:'repeat(10,1fr)',
          gap:2,padding:14,position:'relative',overflow:'hidden',
        }}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 55% 48% at 65% 35%,rgba(201,168,94,.07),transparent 65%)',zIndex:1,pointerEvents:'none'}}/>
        </div>
        <div className="about-float">
          <div style={{fontSize:9,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--fog)',marginBottom:5}}>Trustpilot Rating</div>
          <div style={{fontFamily:'var(--serif)',fontSize:26,fontWeight:400,color:'var(--gold)'}}>4.9 ★</div>
        </div>
      </div>

      <style>{`@media(max-width:768px){#about{grid-template-columns:1fr!important;padding:70px 20px!important;gap:44px!important}}`}</style>
    </section>
  )
}
