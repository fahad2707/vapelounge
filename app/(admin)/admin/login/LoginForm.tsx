'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) {
        setErr(j.error || 'Could not sign in.')
        setBusy(false)
        return
      }
      router.replace(redirectTo.startsWith('/admin') ? redirectTo : '/admin/products')
      router.refresh()
    } catch {
      setErr('Network error. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <div className="adm-login-brand">
          <span className="adm-brand-dot">VL</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>VapeLounge</div>
            <div style={{ fontSize: 11, color: '#64748B', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Admin Panel
            </div>
          </div>
        </div>

        <h1 className="adm-login-h1">Sign in</h1>
        <p className="adm-login-sub">Use your administrator credentials to access the catalogue manager.</p>

        <form onSubmit={submit} className="adm-form-grid" noValidate>
          <div>
            <label htmlFor="adm-email" className="adm-label">Email</label>
            <input
              id="adm-email"
              type="email"
              autoComplete="username"
              required
              className="adm-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@vapelounge.example"
            />
          </div>
          <div>
            <label htmlFor="adm-pw" className="adm-label">Password</label>
            <input
              id="adm-pw"
              type="password"
              autoComplete="current-password"
              required
              className="adm-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {err && <div className="adm-error" role="alert">{err}</div>}

          <button type="submit" className="adm-btn adm-btn-primary" disabled={busy} style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', marginTop: 4 }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="adm-login-foot">© VapeLounge · Authorised personnel only</div>
      </div>
    </div>
  )
}
