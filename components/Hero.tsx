'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

const ROTATE_MS = 3500
const SLIDE_COUNT = 3

const SLIDES = [
  {
    src: '/hero/kraze-mega-x.png',
    alt: 'Kraze Mega X — new release, up to 48K puffs',
  },
  {
    src: '/hero/drip-n-daily.png',
    alt: "Drip'n Daily by ENVI — up to 100K puffs, designed in Canada",
  },
  {
    src: '/hero/flavour-drop.png',
    alt: 'Flavour Drop — premium e-liquid, just arrived',
  },
] as const

export default function Hero() {
  const [active, setActive] = useState(0)
  const [exiting, setExiting] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const activeRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  const goToSlide = useCallback((nextIndex: number) => {
    const target = ((nextIndex % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT
    setActive(prev => {
      if (prev === target) return prev
      setExiting(prev)
      activeRef.current = target
      return target
    })
  }, [])

  const advanceSlide = useCallback(() => {
    setActive(prev => {
      const next = (prev + 1) % SLIDE_COUNT
      setExiting(prev)
      activeRef.current = next
      return next
    })
  }, [])

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    if (exiting === null) return
    const t = window.setTimeout(() => setExiting(null), 1000)
    return () => window.clearTimeout(t)
  }, [exiting])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    timerRef.current = window.setInterval(advanceSlide, ROTATE_MS)
  }, [advanceSlide, clearTimer])

  useEffect(() => {
    if (paused) {
      clearTimer()
      return
    }
    startTimer()
    return clearTimer
  }, [paused, startTimer, clearTimer])

  const handleDotClick = (index: number) => {
    goToSlide(index)
    if (!paused) startTimer()
  }

  return (
    <section id="hero" className="hero-section" aria-label="New arrivals">
      <div className="hero-section__bg" aria-hidden />

      <div className="hero-section__inner">
        <p className="hero-section__eyebrow">
          <span className="hero-section__eyebrow-line" />
          New arrivals
          <span className="hero-section__eyebrow-line" />
        </p>

        <div
          className="hero-carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false)
          }}
        >
          <div className="hero-carousel__frame">
            {SLIDES.map((slide, i) => {
              const isActive = i === active
              const isExiting = i === exiting && exiting !== active
              return (
                <div
                  key={slide.src}
                  className={[
                    'hero-carousel__slide',
                    isActive ? 'is-active' : '',
                    isExiting ? 'is-exiting' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden={!isActive}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 768px) 92vw, (max-width: 1200px) 88vw, 1120px"
                    className="hero-carousel__img"
                  />
                </div>
              )
            })}
          </div>

          <div className="hero-carousel__controls" role="tablist" aria-label="Banner slides">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Show slide ${i + 1} of ${SLIDE_COUNT}`}
                className={`hero-carousel__dot${i === active ? ' is-active' : ''}`}
                onClick={() => handleDotClick(i)}
              />
            ))}
          </div>
        </div>

        <div className="hero-section__ctas">
          <button
            type="button"
            className="btn-fill"
            onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span>Shop Now →</span>
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Who we are
          </button>
        </div>
      </div>

      <div className="hero-scroll-hint">
        <div className="scroll-bar" />
        <span>Scroll</span>
      </div>
    </section>
  )
}
