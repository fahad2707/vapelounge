export interface CarouselItem {
  emoji: string
  cat: string
  name: string
  desc: string
  price: string
  glow: string
}

export type { CatalogProduct, CatalogVariant, CatalogVariantChoice } from '@/lib/catalog/types'

export const CAROUSEL_DATA: CarouselItem[] = [
  { emoji: '💨', cat: 'Disposables',  name: 'Puff Series',        desc: 'Premium disposable vapes — up to 10,000 puffs per device.',    price: 'From $12',     glow: '#a78bfa' },
  { emoji: '🔋', cat: 'Pod Systems',  name: 'Pod Kits',           desc: 'Compact, refillable pod systems for smooth all-day vaping.',   price: 'From $29',     glow: '#60a5fa' },
  { emoji: '🌬️', cat: 'Box Mods',     name: 'Mod Kits',           desc: 'High-wattage box mods for clouds and flavour chasers.',       price: 'From $49',     glow: '#f97316' },
  { emoji: '🍭', cat: 'E-Liquids',    name: 'Juice Collection',   desc: 'Hundreds of flavours — salt nic, freebase, and CDL.',         price: 'From $8',      glow: '#4ade80' },
  { emoji: '🧴', cat: 'Nicotine Salt',name: 'Salt Nic Range',     desc: 'Smooth throat hit with rapid nicotine absorption.',           price: 'From $9',      glow: '#fbbf24' },
  { emoji: '🛠️', cat: 'Accessories',  name: 'Coils & Tanks',      desc: 'Replacement coils, tanks, drip tips and more.',               price: 'From $5',      glow: '#34d399' },
]

export const TICKER_ITEMS = [
  'Premium Vape Store Canada', 'Fast Shipping Nationwide', '500+ Flavours', 'Age Verified',
  'Free Shipping $50+ CAD', 'Lab Tested Products', 'Expert Staff', '1000+ Happy Vapers',
]

export const TESTIMONIALS = [
  { initial: 'J', name: 'Jamie R.',      role: 'Vape Lounge Customer, Toronto',       text: 'VapeLounge is the only place I shop now. The flavour selection is insane, shipping across Canada is quick, and the staff actually know what they\'re talking about.' },
  { initial: 'S', name: 'Sara M.',       role: 'Switched from Smoking, 2 years ago', text: 'I tried three other vape shops before finding VapeLounge. The starter kit advice was spot on and I haven\'t touched a cigarette since. Life-changing honestly.' },
  { initial: 'K', name: 'Karl T.',       role: 'Cloud Chaser & Regular Customer',    text: 'The mod selection here is unreal. Got the Aegis Legend 3 for a price I couldn\'t find anywhere else. Customer service sorted a coil issue same day.' },
]

export const WHY_TILES = [
  { icon: '🚚', title: 'Fast Shipping', body: 'Reliable delivery across Canada — track your order from our door to yours.' },
  { icon: '🔬', title: 'Lab Tested',        body: 'All products third-party tested for quality & safety.' },
  { icon: '💬', title: 'Expert Support',    body: 'Real vapers on live chat — genuine advice, always.' },
]

export const STORY_PANELS = [
  { n: '01', h1: 'Born from', italic: 'passion', h2: 'not profit', p: 'VapeLounge started in 2018 in a small shopfront. Two friends who switched from smoking and couldn\'t find a store that genuinely cared about helping people quit. So they built one.' },
  { n: '02', h1: 'Community', italic: 'first,', h2: 'always', p: 'We grew by word of mouth — vapers telling other vapers. No billboards, no influencer deals. Just honest products, real advice, and a lounge where customers became regulars.' },
  { n: '03', h1: 'Canada\'s', italic: 'trusted', h2: 'vape destination', p: 'Today VapeLounge ships to customers coast to coast, stocks 500+ flavours and 200+ devices — and that small shop ethos never changed.' },
]
