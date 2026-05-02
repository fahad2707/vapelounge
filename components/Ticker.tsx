import { TICKER_ITEMS } from '@/lib/data'

export default function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div style={{overflow:'hidden',padding:'14px 0',borderTop:'1px solid var(--line2)',borderBottom:'1px solid var(--line2)',background:'rgba(201,168,94,.04)'}}>
      <div className="ticker-track">
        {items.map((t, i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:24,padding:'0 24px',fontSize:10,letterSpacing:'.2em',textTransform:'uppercase',color:'var(--fog)',whiteSpace:'nowrap'}}>
            {t}
            <span style={{width:3,height:3,borderRadius:'50%',background:'var(--gold)',opacity:.5,flexShrink:0,display:'inline-block'}}/>
          </div>
        ))}
      </div>
    </div>
  )
}
