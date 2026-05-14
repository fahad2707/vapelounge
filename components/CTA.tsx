export default function CTA() {
  return (
    <section id="cta" style={{ padding: '100px 56px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(201,168,94,.08),transparent 68%)' }} />
      <div className="cta-frame" style={{ position: 'absolute', inset: 44, border: '1px solid var(--line)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto' }}>
        <div className="rv" style={{ fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
          <span style={{ width: 26, height: 1, background: 'var(--gold)', display: 'block' }} />
          Get Started
        </div>

        <h2 className="cta-title rv" style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(42px,5.5vw,76px)', fontWeight: 400, lineHeight: .95, letterSpacing: '-.018em', marginBottom: 18 }}>
          Find your{' '}
          <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>perfect</em>
          <br />vape today.
        </h2>

        <p className="cta-copy rv" style={{ fontSize: 14.5, fontWeight: 300, color: 'var(--fog)', lineHeight: 1.75, marginBottom: 42 }}>
          Not sure where to start? Book a free in-store or virtual walkthrough with one of our vape experts — zero pressure, genuine advice.
        </p>

        <div className="cta-btns rv" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-fill"><span>Schedule a Walkthrough</span></button>
          <button className="btn-ghost">Browse All Products</button>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          #cta{ padding:64px 20px!important; }
          #cta .cta-frame{ inset:18px!important; }
          #cta .cta-title{ font-size:34px!important; line-height:1.02!important; margin-bottom:14px!important; }
          #cta .cta-copy{ font-size:13.5px!important; line-height:1.65!important; margin-bottom:28px!important; padding:0 4px; }
          #cta .cta-btns{ flex-direction:column!important; align-items:stretch!important; gap:10px!important; padding:0 4px; }
          #cta .cta-btns .btn-fill,
          #cta .cta-btns .btn-ghost{
            width:100%; justify-content:center;
            padding:13px 16px!important;
            font-size:10.5px!important;
            letter-spacing:.14em!important;
          }
        }
      `}</style>
    </section>
  )
}
