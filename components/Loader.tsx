'use client'
import { useEffect, useState } from 'react'

export default function Loader() {
  const [pct, setPct]   = useState(0)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 18 + 2
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => setGone(true), 380) }
      setPct(Math.round(p))
    }, 65)
    return () => clearInterval(iv)
  }, [])

  if (gone) return null

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:8000,background:'var(--ink)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,
    }}>
      <div style={{fontSize:28,marginBottom:4}}>💨</div>
      <div className="ld-brand">VAPE LOUNGE</div>
      <div style={{width:160,height:1,background:'rgba(255,255,255,.06)'}}>
        <div className="ld-fill" style={{width:pct+'%'}}/>
      </div>
      <div className="ld-pct">{pct}%</div>
    </div>
  )
}
