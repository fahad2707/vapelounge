'use client'
import type { ReactNode } from 'react'
import { CartProvider } from '@/lib/store'
import { WishlistProvider } from '@/lib/wishlist'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </CartProvider>
  )
}
