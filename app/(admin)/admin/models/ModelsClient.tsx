'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../_components/Modal'

interface Category { id: string; name: string }
interface Model { id: string; slug: string; name: string; categoryId: string }

export default function ModelsClient() {
  const [models, setModels] = useState<Model[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Model | null>(null)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const [c, m] = await Promise.all([
        fetch('/api/admin/categories', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/admin/models', { cache: 'no-store' }).then(r => r.json()),
      ])
      setCategories(Array.isArray(c?.categories) ? c.categories : [])
      setModels(Array.isArray(m?.models) ? m.models : [])
    } catch { setErr('Network error.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const catName = useMemo(() => {
    const map = new Map(categories.map(c => [c.id, c.name]))
    return (id: string) => map.get(id) || '—'
  }, [categories])

  const filtered = useMemo(
    () => (filterCat ? models.filter(m => m.categoryId === filterCat) : models),
    [models, filterCat],
  )

  const openAdd = () => { setEditing(null); setName(''); setCategoryId(filterCat); setFormErr(null); setOpen(true) }
  const openEdit = (m: Model) => { setEditing(m); setName(m.name); setCategoryId(m.categoryId); setFormErr(null); setOpen(true) }

  const save = useCallback(async () => {
    setFormErr(null); setSubmitting(true)
    try {
      const url = editing ? `/api/admin/models/${editing.id}` : '/api/admin/models'
      const method = editing ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, categoryId }),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) { setFormErr(j.error || 'Could not save.'); setSubmitting(false); return }
      setOpen(false); void load()
    } catch { setFormErr('Network error.') }
    finally { setSubmitting(false) }
  }, [editing, name, categoryId, load])

  const remove = useCallback(async (m: Model) => {
    if (!window.confirm(`Delete model "${m.name}"?`)) return
    try {
      const r = await fetch(`/api/admin/models/${m.id}`, { method: 'DELETE' })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) { setErr(j.error || 'Could not delete.'); return }
      void load()
    } catch { setErr('Network error.') }
  }, [load])

  return (
    <>
      <div className="adm-page-head">
        <div>
          <div className="adm-page-title">Models</div>
          <div className="adm-page-sub">Sub-lines under a category — e.g. Elf Bar BC5000, STLTH Pro.</div>
        </div>
        <button type="button" className="adm-btn adm-btn-primary" onClick={openAdd} disabled={categories.length === 0}>
          + Add model
        </button>
      </div>

      {categories.length === 0 && (
        <div className="adm-card adm-card-pad" style={{ marginBottom: 14, color: '#92400E', background: '#FEF3C7', borderColor: '#FCD34D' }}>
          Add at least one category first before creating models.
        </div>
      )}

      <div className="adm-toolbar">
        <select className="adm-search" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {err && <div className="adm-error" style={{ marginBottom: 14 }}>{err}</div>}

      <div className="adm-card">
        {loading ? (
          <div className="adm-card-pad" style={{ color: '#64748B' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="adm-card-pad" style={{ color: '#64748B', textAlign: 'center' }}>No models here yet.</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Slug</th>
                <th style={{ width: 200, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 500 }}>
                    <Link href={`/admin/models/${m.id}`} style={{ color: '#0F172A' }}>{m.name}</Link>
                  </td>
                  <td>{catName(m.categoryId)}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 12.5, color: '#475569' }}>{m.slug}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/admin/models/${m.id}`} className="adm-btn adm-btn-ghost adm-btn-sm" style={{ marginRight: 6 }}>Open</Link>
                    <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => openEdit(m)}>Edit</button>
                    <button className="adm-btn adm-btn-danger adm-btn-sm" style={{ marginLeft: 6 }} onClick={() => remove(m)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Modal
          title={editing ? 'Edit model' : 'Add model'}
          onClose={() => !submitting && setOpen(false)}
          maxWidth={460}
          footer={
            <>
              <button type="button" className="adm-btn adm-btn-ghost" disabled={submitting} onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className="adm-btn adm-btn-primary" disabled={submitting || !name.trim() || !categoryId} onClick={save}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <div className="adm-form-grid">
            <div>
              <label className="adm-label" htmlFor="mod-cat">Category<span className="req">*</span></label>
              <select id="mod-cat" className="adm-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">— select —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="adm-label" htmlFor="mod-name">Model name<span className="req">*</span></label>
              <input
                id="mod-name"
                className="adm-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. BC5000"
                autoFocus
              />
            </div>
            {formErr && <div className="adm-error">{formErr}</div>}
          </div>
        </Modal>
      )}
    </>
  )
}
