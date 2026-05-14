'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

const NAV = [
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/models', label: 'Models' },
  { href: '/admin/variants', label: 'Variants' },
]

export default function AdminShell({
  email,
  children,
}: {
  email: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const onLogout = useCallback(async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    router.replace('/admin/login')
    router.refresh()
  }, [router])

  const initial = (email[0] || 'A').toUpperCase()

  return (
    <div className="adm-shell">
      <aside className="adm-aside">
        <div className="adm-brand">
          <span className="adm-brand-dot">VL</span>
          <span>VapeLounge Admin</span>
        </div>

        <div className="adm-nav-h">Catalogue</div>
        {NAV.map(n => {
          const active = pathname === n.href || pathname.startsWith(n.href + '/')
          return (
            <Link key={n.href} href={n.href} className={`adm-nav-link${active ? ' on' : ''}`}>
              <span aria-hidden style={{ width: 18 }}>{labelIcon(n.label)}</span>
              {n.label}
            </Link>
          )
        })}

        <div className="adm-aside-foot">
          <div className="adm-user">
            <div className="adm-user-av">{initial}</div>
            <div>
              <div className="adm-user-em">{email}</div>
              <div className="adm-user-r">Administrator</div>
            </div>
          </div>
          <button type="button" className="adm-logout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  )
}

function labelIcon(label: string): string {
  switch (label) {
    case 'Products':   return '📦'
    case 'Categories': return '🗂'
    case 'Models':     return '🧩'
    case 'Variants':   return '🎨'
    default:           return '•'
  }
}
