'use client'
import { useEffect } from 'react'

export default function ScrollManager() {
  useEffect(() => {
    let rafPending = false

    const processScroll = () => {
      rafPending = false
      const sy = window.scrollY

      const hGrid = document.getElementById('hGrid')
      if (hGrid) {
        hGrid.style.transform = `translateY(${sy * .18}px)`
        hGrid.style.opacity   = Math.max(0, 1 - sy / 460) + ''
      }
    }

    const onScroll = () => {
      if (!rafPending) { rafPending = true; requestAnimationFrame(processScroll) }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    processScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return null
}
