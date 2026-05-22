const ADDRESS = '17 Chalmers St S Unit B, Cambridge, ON N1R 5A9'
const MAP_QUERY = encodeURIComponent(ADDRESS)
const MAP_EMBED = `https://maps.google.com/maps?q=${MAP_QUERY}&t=&z=15&ie=UTF8&iwloc=&output=embed`
const PHONE_1 = '+13828851370'
const PHONE_2 = '+12262183411'
const PHONE_1_DISPLAY = '+1 (382) 885-1370'
const PHONE_2_DISPLAY = '+1 (226) 218-3411'
const EMAIL = 'vape.lounge92@gmail.com'
const INSTAGRAM = 'https://www.instagram.com/vapeloungepro?igsh=MXNsdzdrOGtoZ3Vlcw=='

function GmailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer id="contact" className="site-footer" style={{ padding: '60px 56px 30px', borderTop: '1px solid var(--line2)' }}>
      <div className="footer-grid">
        <div className="footer-brand-col">
          <p style={{ fontSize: 12.5, fontWeight: 300, color: 'var(--fog)', lineHeight: 1.75, maxWidth: 280, marginBottom: 16 }}>
            Canada&apos;s vape destination. Huge flavour selection, honest advice, and fast shipping nationwide since 2018. Prices in CAD.
          </p>
          <p style={{ fontSize: 10, color: 'var(--fog2)', lineHeight: 1.6 }}>
            🔞 Adults only. This site contains nicotine products. You must be the age of majority in your province or territory to purchase.
          </p>
        </div>

        <div className="footer-contact-col">
          <h5 className="footer-heading">Contact us</h5>
          <a href={`tel:${PHONE_1}`} className="footer-link">{PHONE_1_DISPLAY}</a>
          <a href={`tel:${PHONE_2}`} className="footer-link">{PHONE_2_DISPLAY}</a>
          <p style={{ fontSize: 12, color: 'var(--fog)', margin: '14px 0 10px', lineHeight: 1.6 }}>{ADDRESS}</p>
          <div className="footer-social">
            <a
              href={`mailto:${EMAIL}`}
              className="footer-social-btn"
              aria-label={`Email ${EMAIL}`}
              title={EMAIL}
            >
              <GmailIcon />
            </a>
            <a
              href={INSTAGRAM}
              className="footer-social-btn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Vape Lounge on Instagram"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>

        <div className="footer-map-col">
          <h5 className="footer-heading">Find us</h5>
          <div className="footer-map-wrap">
            <iframe
              title="Vape Lounge location map"
              src={MAP_EMBED}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            style={{ marginTop: 10, display: 'inline-block' }}
          >
            Open in Google Maps →
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid var(--line2)', fontSize: 10.5, color: 'var(--fog2)', letterSpacing: '.04em', flexWrap: 'wrap', gap: 8 }}>
        <span>© {new Date().getFullYear()} Vape Lounge. All rights reserved. | For adults 18+ only.</span>
        <span>Vape responsibly. Not for sale to minors.</span>
      </div>

      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1.2fr;
          gap: 40px;
          margin-bottom: 44px;
          align-items: start;
        }
        .footer-heading {
          font-size: 9px;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 16px;
          font-weight: 400;
        }
        .footer-link {
          display: block;
          font-size: 13px;
          font-weight: 300;
          color: var(--fog);
          margin-bottom: 8px;
          transition: color .28s;
        }
        .footer-link:hover { color: var(--cream2); }
        .footer-social {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }
        .footer-social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid var(--line2);
          color: var(--gold);
          transition: border-color .28s, background .28s, color .28s;
        }
        .footer-social-btn:hover {
          border-color: var(--gold);
          background: var(--gold-a10);
          color: var(--cream);
        }
        .footer-map-wrap {
          width: 100%;
          aspect-ratio: 16 / 10;
          min-height: 180px;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--line2);
          background: var(--ink3);
        }
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
          .footer-map-col {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 768px) {
          .site-footer { padding: 48px 18px 24px !important; }
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .footer-map-wrap { min-height: 200px; }
        }
      `}</style>
    </footer>
  )
}
