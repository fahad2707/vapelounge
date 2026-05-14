'use client'
import { useEffect } from 'react'

export default function Modal({
  title,
  onClose,
  children,
  footer,
  maxWidth = 720,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: number
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="adm-modal-ov" role="presentation" onClick={onClose}>
      <div
        className="adm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-modal-title"
        style={{ width: `min(${maxWidth}px, 100%)` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="adm-modal-head">
          <div id="adm-modal-title" className="adm-modal-title">{title}</div>
          <button type="button" className="adm-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
