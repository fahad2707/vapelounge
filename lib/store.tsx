'use client'
import { createContext, useContext, useReducer, ReactNode } from 'react'

export interface CartItem {
  id: string
  emoji: string
  name: string
  cat: string
  price: number
  label: string
  qty: number
}

interface CartState {
  items: CartItem[]
  open: boolean
}

type Action =
  | { type: 'ADD'; item: Omit<CartItem, 'qty'> }
  | { type: 'REMOVE'; id: string }
  | { type: 'QTY'; id: string; delta: number }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find(i => i.id === action.item.id)
      if (existing) {
        return { ...state, items: state.items.map(i => i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i) }
      }
      return { ...state, items: [...state.items, { ...action.item, qty: 1 }] }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'QTY': {
      const updated = state.items.map(i => i.id === action.id ? { ...i, qty: i.qty + action.delta } : i).filter(i => i.qty > 0)
      return { ...state, items: updated }
    }
    case 'OPEN':  return { ...state, open: true }
    case 'CLOSE': return { ...state, open: false }
    default: return state
  }
}

const CartContext = createContext<{ state: CartState; dispatch: React.Dispatch<Action> } | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false })
  return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
