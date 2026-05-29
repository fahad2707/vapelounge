'use client'
import { useEffect, useState } from 'react'

/** Brief splash only — catalog loads underneath. */
export default function Loader() {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setGone(true), 900)
    return () => window.clearTimeout(t)
  }, [])

  if (gone) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 8000,
        background: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 28 }}>💨</div>
      <div className="ld-brand">VAPE LOUNGE</div>
    </div>
  )
}
