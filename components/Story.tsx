'use client'
import { useEffect, useRef } from 'react'

const PANELS = [
  { n: '01', h1: 'Born from', italic: 'passion,', rest: 'not profit',   p: 'VapeLounge started in 2018 in a small shopfront. Two friends who switched from smoking and couldn\'t find a store that genuinely cared about helping people quit. So they built one.' },
  { n: '02', h1: 'Community', italic: 'first,',   rest: 'always',        p: 'We grew by word of mouth — vapers telling other vapers. No billboards, no influencer deals. Just honest products, real advice, and a lounge where customers became regulars.' },
  { n: '03', h1: 'Canada\'s', italic: 'trusted', rest: 'vape destination', p: 'Today VapeLounge ships to customers coast to coast, stocks 500+ flavours and 200+ devices — and that small shop ethos never changed.' },
]
const WORDS = ['PASSION', 'COMMUNITY', 'FUTURE']

export default function Story() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const wordRef   = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    let rafPending = false
    const tick = () => {
      const scroll = scrollRef.current
      const word   = wordRef.current
      if (!scroll || !word) return
      const sr = scroll.getBoundingClientRect()
      const scrollable = scroll.offsetHeight - window.innerHeight
      if (scrollable <= 0) return
      const prog = Math.max(0, Math.min(1, -sr.top / scrollable))

      panelRefs.current.forEach((p, i) => {
        if (!p) return
        const segStart = i / 3
        const segEnd   = (i + 1) / 3
        const segProg  = Math.max(0, Math.min(1, (prog - segStart) / (1 / 3)))
        const isActive = prog >= segStart && (i === 2 ? prog <= 1 : prog < segEnd)
        const inner    = p.querySelector<HTMLElement>('.sp-inner')
        if (isActive) {
          p.classList.add('show')
          if (inner) {
            const fadeIn  = Math.min(1, segProg / 0.25)
            const fadeOut = i < 2 ? Math.max(0, 1 - (segProg - 0.75) / 0.25) : 1
            inner.style.opacity   = Math.min(fadeIn, fadeOut) + ''
            inner.style.transform = `translateY(${(segProg - .5) * 22}px)`
          }
        } else {
          p.classList.remove('show')
        }
      })

      word.textContent = WORDS[Math.min(2, Math.floor(prog * 3))] || 'FUTURE'
      word.style.transform = `translateX(-50%) translateY(${prog * 50 - 6}px)`
    }

    const onScroll = () => {
      if (!rafPending) { rafPending = true; requestAnimationFrame(() => { rafPending = false; tick() }) }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    tick()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section id="story" style={{ position: 'relative' }}>
      <div className="story-scroll" ref={scrollRef}>
        <div className="story-pin">
          <div className="story-word" ref={wordRef}>STORY</div>

          {PANELS.map((panel, i) => (
            <div key={i} className="story-panel" ref={el => { panelRefs.current[i] = el }}>
              <div className="sp-inner" style={{ maxWidth: 620, textAlign: 'center', padding: '0 32px' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 88, fontWeight: 400, color: 'rgba(201,168,94,.08)', lineHeight: 1, display: 'block', marginBottom: -8 }}>
                  {panel.n}
                </span>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px,4.5vw,54px)', fontWeight: 400, lineHeight: 1.08, marginBottom: 16 }}>
                  {panel.h1}{' '}
                  <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{panel.italic}</em>
                  {panel.rest && <><br />{panel.rest}</>}
                </h2>
                <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--fog)', lineHeight: 1.85 }}>{panel.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
