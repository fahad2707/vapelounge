import { TESTIMONIALS } from '@/lib/data'

export default function Testimonials() {
  return (
    <section id="testi" style={{ padding: '100px 56px 80px' }}>
      <div className="rv" style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
          <span style={{ width: 26, height: 1, background: 'var(--gold)', display: 'block' }} />
          Customer Reviews
        </div>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(34px,4.5vw,56px)', fontWeight: 400, marginBottom: 10 }}>
          Real vapers,{' '}
          <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>real reviews</em>
        </h2>
        <p style={{ fontSize: 13, color: 'var(--fog)', fontWeight: 300 }}>
          Don&apos;t take our word for it — here&apos;s what our customers say
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--line2)' }}>
        {TESTIMONIALS.map((t, i) => (
          <div key={t.name} className="tc rv" style={{ transitionDelay: `${.06 + i * .08}s` }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 44, color: 'var(--gold)', opacity: .3, lineHeight: 1, marginBottom: 16 }}>&ldquo;</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.85, color: 'var(--cream2)', marginBottom: 28 }}>
              {t.text}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--gold-a10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--gold)' }}>
                {t.initial}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: 'var(--fog)', letterSpacing: '.04em' }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media(max-width:768px){
          #testi { padding:70px 20px 60px!important }
          #testi > div:last-child { grid-template-columns:1fr!important }
        }
      `}</style>
    </section>
  )
}
