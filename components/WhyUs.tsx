import { WHY_TILES } from '@/lib/data'

const WHY_ITEMS = [
  'All products third-party lab tested for safety & quality',
  'Age verified — we never sell below the age of majority',
  'Fast shipping on orders placed before cutoff (see checkout)',
  'Free shipping on Canadian orders over $50 CAD',
  'Genuine expert advice — no commission, no upsell',
]

export default function WhyUs() {
  return (
    <section id="why" style={{padding:'100px 0',position:'relative',overflow:'hidden',display:'flex',alignItems:'center',minHeight:0}}>
      <div id="whyBg" style={{position:'absolute',inset:'-18%',background:'radial-gradient(ellipse 52% 68% at 16% 50%,rgba(201,168,94,.065),transparent 58%),linear-gradient(180deg,var(--ink) 0%,var(--ink2) 50%,var(--ink) 100%)'}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(90deg,rgba(201,168,94,.02) 0,rgba(201,168,94,.02) 1px,transparent 1px,transparent 100px)'}}/>

      <div className="rvl" style={{position:'relative',zIndex:2,padding:'60px 56px',maxWidth:580}}>
        <div style={{fontSize:10,letterSpacing:'.24em',textTransform:'uppercase',color:'var(--gold)',display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
          <span style={{width:26,height:1,background:'var(--gold)',display:'block'}}/>
          Why VapeLounge
        </div>
        <h2 style={{fontFamily:'var(--serif)',fontSize:'clamp(40px,5vw,72px)',fontWeight:400,lineHeight:.96,letterSpacing:'-.018em',marginBottom:22}}>
          Canada&apos;s <em style={{color:'var(--gold)',fontStyle:'italic'}}>best</em><br/>vape experience.
        </h2>
        <p style={{fontSize:14,fontWeight:300,color:'var(--fog)',lineHeight:1.85,marginBottom:36,maxWidth:420}}>
          We don&apos;t just sell vapes. We help people make the switch, find their flavour, and stay satisfied — every step of the way.
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {WHY_ITEMS.map(item => (
            <div key={item} style={{display:'flex',alignItems:'center',gap:12,fontSize:13,fontWeight:300,color:'var(--cream2)'}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:'var(--gold)',flexShrink:0,display:'block'}}/>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div id="whyTiles" className="why-tiles-block" style={{position:'absolute',right:56,top:'50%',transform:'translateY(-50%)',width:360,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {WHY_TILES.map((t, i) => (
          <div key={t.title} className="why-tile rv" style={{gridColumn:i===0?'1/-1':undefined,transitionDelay:i===0?'0s':i===1?'.1s':'.2s'}}>
            <div style={{fontSize:22,marginBottom:10}}>{t.icon}</div>
            <div style={{fontFamily:'var(--serif)',fontSize:15,fontWeight:400,marginBottom:4}}>{t.title}</div>
            <div style={{fontSize:11.5,fontWeight:300,color:'var(--fog)',lineHeight:1.6}}>{t.body}</div>
          </div>
        ))}
      </div>

      <style>{`@media(max-width:768px){#why{padding:70px 0!important}}`}</style>
    </section>
  )
}
