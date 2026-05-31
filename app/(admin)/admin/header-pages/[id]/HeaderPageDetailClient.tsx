'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface HeaderPage {
  id: string
  slug: string
  name: string
  showInNav: boolean
}

interface CatRow {
  id: string
  slug: string
  name: string
}

interface AvailCat extends CatRow {
  headerPageId: string | null
}

export default function HeaderPageDetailClient({ headerPageId }: { headerPageId: string }) {
  const [page, setPage] = useState<HeaderPage | null>(null)
  const [assigned, setAssigned] = useState<CatRow[]>([])
  const [available, setAvailable] = useState<AvailCat[]>([])
  const [pickId, setPickId] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch(`/api/admin/header-pages/${headerPageId}`, { cache: 'no-store' })
      const j = (await r.json()) as {
        headerPage?: HeaderPage
        categories?: CatRow[]
        availableCategories?: AvailCat[]
        error?: string
      }
      if (!r.ok) {
        setErr(j.error || 'Not found')
        return
      }
      setPage(j.headerPage || null)
      setAssigned(j.categories || [])
      setAvailable(j.availableCategories || [])
    } catch {
      setErr('Network error.')
    } finally {
      setLoading(false)
    }
  }, [headerPageId])

  useEffect(() => {
    void load()
  }, [load])

  const pickOptions = useMemo(
    () => available.filter(c => c.headerPageId !== headerPageId),
    [available, headerPageId],
  )

  const addCategory = useCallback(async () => {
    if (!pickId) return
    setBusy(true)
    try {
      const r = await fetch(`/api/admin/header-pages/${headerPageId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: pickId, action: 'add' }),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) {
        setErr(j.error || 'Could not add category.')
        return
      }
      setPickId('')
      void load()
    } catch {
      setErr('Network error.')
    } finally {
      setBusy(false)
    }
  }, [headerPageId, pickId, load])

  const removeCategory = useCallback(
    async (categoryId: string, name: string) => {
      if (!window.confirm(`Remove "${name}" from this header page?`)) return
      setBusy(true)
      try {
        const r = await fetch(`/api/admin/header-pages/${headerPageId}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId, action: 'remove' }),
        })
        const j = (await r.json().catch(() => ({}))) as { error?: string }
        if (!r.ok) {
          setErr(j.error || 'Could not remove.')
          return
        }
        void load()
      } catch {
        setErr('Network error.')
      } finally {
        setBusy(false)
      }
    },
    [headerPageId, load],
  )

  if (loading) {
    return <div className="adm-card-pad" style={{ color: '#64748B' }}>Loading…</div>
  }

  if (!page) {
    return (
      <div className="adm-card-pad">
        <p>{err || 'Header page not found.'}</p>
        <Link href="/admin/header-pages">← Back</Link>
      </div>
    )
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <Link href="/admin/header-pages" style={{ fontSize: 12, color: '#64748B' }}>
            ← Header pages
          </Link>
          <div className="adm-page-title" style={{ marginTop: 8 }}>
            {page.name}
          </div>
          <div className="adm-page-sub">
            Categories listed here appear under <strong>{page.name}</strong> in the site header.
            Add models under each category in{' '}
            <Link href="/admin/models">Models</Link> or open the category to assign products.
          </div>
        </div>
      </div>

      {err && <div className="adm-error" style={{ marginBottom: 14 }}>{err}</div>}

      <div className="adm-card" style={{ marginBottom: 20 }}>
        <div className="adm-card-pad">
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Add category to this header page</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="adm-select"
              style={{ minWidth: 260, flex: 1 }}
              value={pickId}
              onChange={e => setPickId(e.target.value)}
              disabled={busy}
            >
              <option value="">Choose a category…</option>
              {pickOptions.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.headerPageId && c.headerPageId !== headerPageId ? ' (moves from another page)' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="adm-btn adm-btn-primary"
              disabled={busy || !pickId}
              onClick={() => void addCategory()}
            >
              Add
            </button>
            <Link href="/admin/categories" className="adm-btn adm-btn-ghost">
              Manage all categories
            </Link>
          </div>
          <p style={{ fontSize: 12, color: '#64748B', marginTop: 10, marginBottom: 0 }}>
            Tip: create categories in{' '}
            <Link href="/admin/categories">Categories</Link> (or Sync catalogue), then add them here.
            Do not use the same name as the header page unless it is a separate brand line.
          </p>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-pad" style={{ paddingBottom: 0 }}>
          <div style={{ fontWeight: 600 }}>Categories on this page ({assigned.length})</div>
        </div>
        {assigned.length === 0 ? (
          <div className="adm-card-pad" style={{ color: '#64748B' }}>
            No categories yet. Add STLTH, Elfbar, Boosted, etc. using the dropdown above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ width: 200, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assigned.map(c => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/categories/${c.id}`} style={{ fontWeight: 500, color: '#0F172A' }}>
                        {c.name}
                      </Link>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/admin/categories/${c.id}`}
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        style={{ marginRight: 6 }}
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        className="adm-btn adm-btn-danger adm-btn-sm"
                        disabled={busy}
                        onClick={() => void removeCategory(c.id, c.name)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
