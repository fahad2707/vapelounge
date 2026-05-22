'use client'
import { createContext, useCallback, useContext, useEffect, useReducer, type ReactNode } from 'react'

export interface WishlistItem {
  id: string
  name: string
  cat: string
  price: number
  image: string
}

interface WishlistState {
  items: WishlistItem[]
  open: boolean
}

type Action =
  | { type: 'HYDRATE'; items: WishlistItem[] }
  | { type: 'TOGGLE'; item: WishlistItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }

const STORAGE_KEY = 'vp_wishlist_v1'

function reducer(state: WishlistState, action: Action): WishlistState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, items: action.items }
    case 'TOGGLE': {
      const exists = state.items.some(i => i.id === action.item.id)
      if (exists) return { ...state, items: state.items.filter(i => i.id !== action.item.id) }
      return { ...state, items: [...state.items, action.item] }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'OPEN':
      return { ...state, open: true }
    case 'CLOSE':
      return { ...state, open: false }
    default:
      return state
  }
}

const WishlistContext = createContext<{
  state: WishlistState
  dispatch: React.Dispatch<Action>
  isSaved: (id: string) => boolean
} | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as WishlistItem[]
      if (Array.isArray(parsed)) dispatch({ type: 'HYDRATE', items: parsed })
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      /* ignore */
    }
  }, [state.items])

  const isSaved = useCallback((id: string) => state.items.some(i => i.id === id), [state.items])

  return (
    <WishlistContext.Provider value={{ state, dispatch, isSaved }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}

export function catalogToWishlist(p: {
  id: string
  name: string
  primaryCategory: string
  price: number
  image: string
}): WishlistItem {
  return {
    id: p.id,
    name: p.name,
    cat: p.primaryCategory,
    price: p.price,
    image: p.image || '',
  }
}
