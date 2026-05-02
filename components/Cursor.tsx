'use client'
import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      if (dotRef.current) { dotRef.current.style.left = mx + 'px'; dotRef.current.style.top = my + 'px' }
    }
    const raf = () => {
      rx += (mx - rx) * .1; ry += (my - ry) * .1
      if (ringRef.current) { ringRef.current.style.left = rx + 'px'; ringRef.current.style.top = ry + 'px' }
      requestAnimationFrame(raf)
    }
    document.addEventListener('mousemove', onMove)
    raf()
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      <div id="dot"  ref={dotRef}  />
      <div id="ring" ref={ringRef} />
    </>
  )
}
