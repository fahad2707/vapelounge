'use client'
import { useRef } from 'react'

const CLOUDS = [
  { w:320,h:160,top:'18%',left:'8%',  dur:'7s',  delay:'0s'   },
  { w:260,h:120,top:'55%',left:'72%', dur:'9s',  delay:'2s'   },
  { w:200,h:100,top:'30%',left:'58%', dur:'6s',  delay:'4s'   },
  { w:180,h:90, top:'72%',left:'20%', dur:'11s', delay:'1.5s' },
]

export default function Hero() {
  const gridRef = useRef<HTMLDivElement>(null)
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)

  const onMouseMove = (e: React.MouseEvent) => {
    const dx = e.clientX / window.innerWidth - .5
    const dy = e.clientY / window.innerHeight - .5
    if (orb1Ref.current) orb1Ref.current.style.transform = `translate(${dx*18}px,${dy*18}px)`
    if (orb2Ref.current) orb2Ref.current.style.transform = `translate(${-dx*12}px,${-dy*12}px)`
    if (gridRef.current) gridRef.current.style.transform = `translate(${dx*6}px,${dy*6}px)`
  }

  return (
    <section id="hero" onMouseMove={onMouseMove} style={{
      minHeight:'100svh',display:'flex',alignItems:'center',justifyContent:'center',
      position:'relative',overflow:'hidden',paddingTop:80,
    }}>
      {/* BG */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 62% 38%,rgba(201,168,94,.08) 0%,transparent 65%),radial-gradient(ellipse 42% 48% at 12% 78%,rgba(201,168,94,.05) 0%,transparent 55%)'}}/>
      <div ref={gridRef} id="hGrid" style={{
        position:'absolute',inset:0,
        backgroundImage:'linear-gradient(rgba(201,168,94,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,94,.028) 1px,transparent 1px)',
        backgroundSize:'66px 66px',
      }}/>

      {/* Animated vape clouds */}
      {CLOUDS.map((c, i) => (
        <div key={i} className="vape-cloud" style={{
          width:c.w,height:c.h,top:c.top,left:c.left,
          '--dur':c.dur,animationDelay:c.delay,
        } as React.CSSProperties}/>
      ))}

      <div ref={orb1Ref} style={{position:'absolute',width:520,height:520,top:-160,right:-60,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(circle,rgba(201,168,94,.12),transparent 70%)',pointerEvents:'none'}}/>
      <div ref={orb2Ref} style={{position:'absolute',width:340,height:340,bottom:-80,left:-60,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(circle,rgba(201,168,94,.06),transparent 70%)',pointerEvents:'none'}}/>

      {/* Content */}
      <div style={{position:'relative',zIndex:2,padding:'0 56px',maxWidth:1000,textAlign:'center',margin:'0 auto',width:'100%'}}>
        <div className="hero-label" style={{
          display:'inline-flex',alignItems:'center',gap:12,fontSize:10,
          letterSpacing:'.26em',textTransform:'uppercase',color:'var(--gold)',marginBottom:32,justifyContent:'center',
        }}>
          <span style={{width:30,height:1,background:'var(--gold)',opacity:.55,display:'block'}}/>
          Est. 2018 · Premium Vape Store Canada
          <span style={{width:30,height:1,background:'var(--gold)',opacity:.55,display:'block'}}/>
        </div>

        <h1 className="hero-h1" style={{fontFamily:'var(--serif)',fontSize:'clamp(48px,7.5vw,104px)',fontWeight:400,lineHeight:.94,letterSpacing:'-.015em',marginBottom:26}}>
          <em style={{color:'var(--gold)',fontStyle:'italic',display:'block'}}>Cloud</em>
          <span style={{display:'block'}}>Chasing</span>
          <span style={{display:'block',fontWeight:700}}>Perfected</span>
        </h1>

        <p className="hero-sub" style={{fontSize:'clamp(14px,1.4vw,16px)',fontWeight:300,lineHeight:1.75,color:'var(--fog)',maxWidth:480,margin:'0 auto 44px'}}>
          Canada&apos;s go-to vape shop — huge flavour selection, honest advice, and fast shipping nationwide. Whether you&apos;re switching from smoking or chasing clouds, we&apos;ve got you.
        </p>

        <div className="hero-ctas" style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
          <button className="btn-fill" onClick={()=>document.getElementById('shop')?.scrollIntoView({behavior:'smooth'})}>
            <span>Shop Now →</span>
          </button>
          <button className="btn-ghost" onClick={()=>document.getElementById('about')?.scrollIntoView({behavior:'smooth'})}>
            Who we are
          </button>
        </div>
      </div>

      <div className="hero-scroll-hint" style={{position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',display:'flex',alignItems:'center',gap:12,fontSize:9,letterSpacing:'.22em',textTransform:'uppercase',color:'var(--fog)',whiteSpace:'nowrap'}}>
        <div className="scroll-bar"/>
        <span>Scroll</span>
      </div>

      <style>{`@media(max-width:768px){#hero .hero-inner-pad{padding:0 20px!important}}`}</style>
    </section>
  )
}
