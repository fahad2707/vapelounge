import AgeGate       from '@/components/AgeGate'
import Cursor        from '@/components/Cursor'
import Loader        from '@/components/Loader'
import Nav           from '@/components/Nav'
import CartDrawer    from '@/components/CartDrawer'
import Hero          from '@/components/Hero'
import Ticker        from '@/components/Ticker'
import About         from '@/components/About'
import Carousel      from '@/components/Carousel'
import Shop          from '@/components/Shop'
import Testimonials  from '@/components/Testimonials'
import CTA           from '@/components/CTA'
import Footer        from '@/components/Footer'
import ScrollManager from '@/components/ScrollManager'
import { ToastProvider } from '@/components/Toast'

function Divider() {
  return (
    <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,168,94,.22),transparent)' }} />
  )
}

export default function Home() {
  return (
    <ToastProvider>
      <AgeGate />
      <Cursor />
      <Loader />
      <Nav />
      <CartDrawer />
      <ScrollManager />
      <main>
        <Hero />
        <Ticker />
        <Divider />
        <Carousel />
        <Divider />
        <Shop />
        <Divider />
        <About />
        <Divider />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </ToastProvider>
  )
}
