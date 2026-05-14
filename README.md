# 💨 VapeLounge — Next.js

Premium vape store website built with Next.js 15, TypeScript, and Tailwind CSS.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React 19**
- No external UI libraries — pure custom CSS + inline styles

## Features

- 🔞 Age gate (18+ verification, session-based)
- 💨 Animated vape cloud hero section
- 🎠 True 3D rotary carousel (rotateY cylinder)
- 🛒 Full cart with drawer, qty controls, toast notifications
- 🔍 Product filter by category (9 categories, 36 products)
- 📖 Scrollytelling story section (3 panels, sticky scroll)
- ⚡ Single RAF scroll loop — smooth 60fps
- 📱 Fully responsive (mobile nav, 2-col grids, touch-friendly)
- 🎯 Custom cursor with lag ring

---

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# → http://localhost:3000

# Build for production
npm run build

# Start production server
npm start
```

---

## Deploy to Vercel (3 steps)

### Option A — Vercel CLI (fastest)

```bash
npm install -g vercel
vercel
# Follow prompts — auto-detects Next.js, deploys in ~60 seconds
```

### Option B — GitHub + Vercel Dashboard

1. Push this folder to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial VapeLounge site"
   git remote add origin https://github.com/YOUR_USERNAME/vapelounge.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **Add New Project**

3. Import your GitHub repo → click **Deploy**
   - Framework: **Next.js** (auto-detected)
   - Build command: `next build` (auto-filled)
   - No env vars needed

That's it — live in ~2 minutes ✅

---

## Project Structure

```
vapelounge/
├── app/
│   ├── layout.tsx       # Root layout, fonts, metadata
│   ├── page.tsx         # Main page — all sections assembled
│   └── globals.css      # All CSS — design tokens, animations, components
├── components/
│   ├── AgeGate.tsx      # 18+ verification modal
│   ├── Nav.tsx          # Sticky nav + mobile drawer
│   ├── Hero.tsx         # Full-screen hero with vape clouds
│   ├── Ticker.tsx       # Infinite scroll marquee
│   ├── About.tsx        # Stats, mosaic art, counter animation
│   ├── Carousel.tsx     # True 3D rotary wheel carousel
│   ├── Shop.tsx         # 36-product grid with filters + cart
│   ├── WhyUs.tsx        # Why choose us section
│   ├── Story.tsx        # Scrollytelling — 3 sticky panels
│   ├── Testimonials.tsx # Customer reviews
│   ├── CTA.tsx          # Call to action
│   ├── Footer.tsx       # Footer with links
│   ├── CartDrawer.tsx   # Slide-in cart with full CRUD
│   ├── Loader.tsx       # Loading screen with progress bar
│   ├── Cursor.tsx       # Custom cursor + lag ring
│   ├── Toast.tsx        # Toast notifications (context)
│   └── ScrollManager.tsx# Single RAF scroll loop
├── lib/
│   ├── data.ts          # All static data (products, carousel, etc.)
│   └── store.ts         # Cart state (React useReducer + Context)
├── vercel.json          # Vercel deployment config
└── package.json
```

---

## Customisation

### Change brand colours
Edit CSS variables at the top of `app/globals.css`:
```css
:root {
  --gold: #9B7FE8;   /* Main accent — currently purple */
  --ink:  #0A0A0D;   /* Background */
  --cream:#F0EEF8;   /* Text */
}
```

### Add / edit products
Edit `lib/data.ts` → `PRODUCTS` array. Each product has:
```ts
{ id, e (emoji), c (category), n (name), d (desc), p (price), op (old price), b (badge), s (stars), g (glow color) }
```

### Change currency
Search and replace `£` with `$` (or any currency) in `Shop.tsx` and `CartDrawer.tsx`.


cd /Users/tahminachoudhury/Desktop/vapelounge