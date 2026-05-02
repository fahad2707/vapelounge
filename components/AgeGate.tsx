'use client'
import { useState, useEffect } from 'react'

export default function AgeGate() {
  const [verified, setVerified] = useState(true) // start hidden until check

  useEffect(() => {
    const ok = sessionStorage.getItem('vl_age_ok')
    if (!ok) setVerified(false)
  }, [])

  const confirm = () => {
    sessionStorage.setItem('vl_age_ok', '1')
    setVerified(true)
  }

  if (verified) return null

  return (
    <div className="age-gate">
      <div style={{fontSize:44}}>💨</div>
      <div style={{fontFamily:'var(--serif)',fontSize:'clamp(28px,6vw,48px)',fontWeight:400,lineHeight:1.1}}>
        Are you the <em style={{color:'var(--gold)',fontStyle:'italic'}}>age of majority</em> in your province?
      </div>
      <p style={{fontSize:14,fontWeight:300,color:'var(--fog)',maxWidth:380,lineHeight:1.75}}>
        VapeLounge sells nicotine and age-restricted products. In Canada you must meet the legal age in your province or territory (18 or 19) to enter this site.
      </p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
        <button className="btn-fill" onClick={confirm}><span>Yes, I meet the legal age</span></button>
        <a href="https://www.google.com" className="btn-ghost" style={{display:'inline-flex',alignItems:'center',padding:'12px 36px',fontSize:11,letterSpacing:'.16em',textTransform:'uppercase'}}>No, take me back</a>
      </div>
      <p style={{fontSize:10,color:'var(--fog2)',marginTop:8,letterSpacing:'.04em'}}>
        By entering you accept our Terms &amp; Privacy Policy. Please vape responsibly.
      </p>
    </div>
  )
}
