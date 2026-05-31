'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import Modal from '../_components/Modal'

interface HeaderPage {
  id: string
  slug: string
  name: string
  showInNav: boolean
  navOrder: number
  categoryCount: number
}

export default function HeaderPagesClient() {
  const [items, setItems] = useState<HeaderPage[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<HeaderPage | null>(null)
  const [name, setName] = useState('')
  const [showInNav, setShowInNav] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch('/api/admin/header-pages', { cache: 'no-store' })
      const j = (await r.json()) as { headerPages?: HeaderPage[]; error?: string }
      if (!r.ok) {
        setErr(j.error || 'Failed to load header pages.')
        setItems([])
      } else {
        setItems(j.headerPages || [])
      }
    } catch {
      setErr('Network error.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openAdd = () => {
    setEditing(null)
    setName('')
    setShowInNav(true)
    setFormErr(null)
    setOpen(true)
  }

  const openEdit = (p: HeaderPage) => {
    setEditing(p)
    setName(p.name)
    setShowInNav(p.showInNav)
    setFormErr(null)
    setOpen(true)
  }

  const save = useCallback(async () => {
    setFormErr(null)
    setSubmitting(true)
    try {
      const url = editing ? `/api/admin/header-pages/${editing.id}` : '/api/admin/header-pages'
      const method = editing ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, showInNav }),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) {
        setFormErr(j.error || 'Could not save.')
        return
      }
      setOpen(false)
      void load()
    } catch {
      setFormErr('Network error.')
    } finally {
      setSubmitting(false)
    }
  }, [editing, name, showInNav, load])

  const remove = useCallback(
    async (p: HeaderPage) => {
      if (!window.confirm(`Delete header page "${p.name}"? Categories will be unlinked (not deleted).`)) {
        return
      }
      try {
        const r = await fetch(`/api/admin/header-pages/${p.id}`, { method: 'DELETE' })
        const j = (await r.json().catch(() => ({}))) as { error?: string }
        if (!r.ok) {
          setErr(j.error || 'Could not delete.')
          return
        }
        void load()
      } catch {
        setErr('Network error.')
      }
    },
    [load],
  )

  return (
    <>
      <div className="adm-page-head">
        <div>
          <div className="adm-page-title">Header pages</div>
          <div className="adm-page-sub">
            Top-level site menu tabs (e.g. <strong>Disposable Vapes</strong>, <strong>E-liquids</strong>).
            Open a page to add <strong>categories</strong> under it (STLTH, Elfbar, Boosted, …). Models stay
            under each category in <Link href="/admin/models">Models</Link>.
          </div>
        </div>
        <button type="button" className="adm-btn adm-btn-primary" onClick={openAdd}>
          + Add header page
        </button>
      </div>

      {err && <div className="adm-error" style={{ marginBottom: 14 }}>{err}</div>}

      <div className="adm-card">
        {loading ? (
          <div className="adm-card-pad" style={{ color: '#64748B' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="adm-card-pad" style={{ color: '#64748B', textAlign: 'center' }}>
            No header pages yet. Create one (e.g. Disposable Vapes), then assign categories to it.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ width: 100 }}>Categories</th>
                  <th style={{ width: 110 }}>In header</th>
                  <th style={{ width: 220, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>
                      <Link href={`/admin/header-pages/${p.id}`} style={{ color: '#0F172A' }}>
                        {p.name}
                      </Link>
                      <div
                        style={{
                          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                          fontSize: 11,
                          color: '#94A3B8',
                        }}
                      >
                        {p.slug}
                      </div>
                    </td>
                    <td>{p.categoryCount}</td>
                    <td>
                      <span className={`adm-pill ${p.showInNav ? 'visible' : 'muted'}`}>
                        {p.showInNav ? 'On' : 'Off'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Link
                        href={`/admin/header-pages/${p.id}`}
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        style={{ marginRight: 6 }}
                      >
                        Manage categories
                      </Link>
                      <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => openEdit(p)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-danger adm-btn-sm"
                        style={{ marginLeft: 6 }}
                        onClick={() => void remove(p)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <Modal
          title={editing ? 'Edit header page' : 'Add header page'}
          onClose={() => !submitting && setOpen(false)}
          footer={
            <>
              <button type="button" className="adm-btn adm-btn-ghost" disabled={submitting} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-primary"
                disabled={submitting || !name.trim()}
                onClick={() => void save()}
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <div className="adm-form-grid">
            <div>
              <label className="adm-label" htmlFor="hp-name">
                Name<span className="req">*</span>
              </label>
              <input
                id="hp-name"
                className="adm-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Disposable Vapes"
                autoFocus
              />
            </div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={showInNav} onChange={e => setShowInNav(e.target.checked)} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>Show in site header</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Requires at least one category assigned to this page.
                </div>
              </div>
            </label>
            {formErr && <div className="adm-error">{formErr}</div>}
          </div>
        </Modal>
      )}
    </>
  )
}
