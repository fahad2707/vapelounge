const COLS = [
  { title: 'Shop',       links: ['Disposables', 'Pod Systems', 'Box Mods', 'E-Liquids', 'Accessories'] },
  { title: 'Company',    links: ['About Us', 'Careers', 'Press'] },
  { title: 'Help',       links: ['FAQ', 'Shipping Info', 'Returns', 'Contact Us'] },
]

export default function Footer() {
  return (
    <footer style={{ padding: '60px 56px 30px', borderTop: '1px solid var(--line2)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 44, marginBottom: 44 }}>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💨</span>
            Vape<span style={{ color: 'var(--gold)' }}>Lounge</span>
          </div>
          <p style={{ fontSize: 12.5, fontWeight: 300, color: 'var(--fog)', lineHeight: 1.75, maxWidth: 240, marginBottom: 16 }}>
            Canada&apos;s vape destination. Huge flavour selection, honest advice, and fast shipping nationwide since 2018. Prices in CAD.
          </p>
          <p style={{ fontSize: 10, color: 'var(--fog2)', lineHeight: 1.6 }}>
            🔞 Adults only. This site contains nicotine products. You must be the age of majority in your province or territory to purchase.
          </p>
        </div>
        {COLS.map(col => (
          <div key={col.title}>
            <h5 style={{ fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18, fontWeight: 400 }}>{col.title}</h5>
            {col.links.map(l => (
              <a
                key={l}
                href="#"
                className="footer-col-link"
                style={{ display: 'block', fontSize: 12.5, fontWeight: 300, color: 'var(--fog)', marginBottom: 9, transition: 'color .28s' }}
              >
                {l}
              </a>
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid var(--line2)', fontSize: 10.5, color: 'var(--fog2)', letterSpacing: '.04em', flexWrap: 'wrap', gap: 8 }}>
        <span>© 2024 VapeLounge. All rights reserved. | For adults 18+ only.</span>
        <span>Vape responsibly. Not for sale to minors.</span>
      </div>

      <style>{`
        .footer-col-link:hover { color: var(--cream2); }
        @media(max-width:768px){
          footer > div:first-child { grid-template-columns:1fr 1fr!important; gap:24px!important }
          footer { padding:48px 20px 24px!important }
        }
      `}</style>
    </footer>
  )
}
