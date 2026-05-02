'use client'
import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react'

const ToastCtx = createContext<(msg: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg]   = useState('')
  const [show, setShow] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const showToast = useCallback((m: string) => {
    setMsg(m); setShow(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(false), 2800)
  }, [])

  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      <div className={`toast-el${show ? ' show' : ''}`}>
        <span style={{ color: 'var(--gold)' }}>✓</span>
        <span>{msg}</span>
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() { return useContext(ToastCtx) }
