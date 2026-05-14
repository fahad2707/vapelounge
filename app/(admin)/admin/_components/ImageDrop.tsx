'use client'
import { useCallback, useRef, useState } from 'react'

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
  max?: number
}

export default function ImageDrop({ value, onChange, max = 6 }: Props) {
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [pasteUrl, setPasteUrl] = useState('')

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setErr(null)
      const room = max - value.length
      if (room <= 0) {
        setErr(`You can attach up to ${max} images.`)
        return
      }
      const list = Array.from(files).slice(0, room)
      if (list.length === 0) return
      setBusy(true)
      const added: string[] = []
      for (const file of list) {
        if (!file.type.startsWith('image/')) continue
        try {
          const fd = new FormData()
          fd.append('file', file)
          const r = await fetch('/api/admin/upload', { method: 'POST', body: fd })
          const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string }
          if (!r.ok || !j.url) {
            setErr(j.error || 'Upload failed.')
            break
          }
          added.push(j.url)
        } catch {
          setErr('Network error during upload.')
          break
        }
      }
      if (added.length) onChange([...value, ...added])
      setBusy(false)
    },
    [max, onChange, value],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDrag(false)
      if (e.dataTransfer?.files?.length) {
        void uploadFiles(e.dataTransfer.files)
      }
    },
    [uploadFiles],
  )

  const remove = (i: number) => {
    const next = value.slice()
    next.splice(i, 1)
    onChange(next)
  }

  const addUrl = () => {
    const u = pasteUrl.trim()
    if (!u) return
    if (!/^https?:\/\//i.test(u)) {
      setErr('Please paste a full https:// image URL.')
      return
    }
    if (value.length >= max) {
      setErr(`You can attach up to ${max} images.`)
      return
    }
    setErr(null)
    onChange([...value, u])
    setPasteUrl('')
  }

  return (
    <div>
      <div
        className={`adm-drop${drag ? ' active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      >
        <div className="adm-drop-icon">🖼</div>
        <div className="adm-drop-title">
          {busy ? 'Uploading…' : drag ? 'Drop to upload' : 'Drag & drop product photos'}
        </div>
        <div className="adm-drop-hint">PNG / JPG / WEBP up to 4 MB · or click to browse</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => {
            if (e.target.files) void uploadFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      <div className="adm-drop-or">Or paste a URL</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="url"
          className="adm-input"
          placeholder="https://…"
          value={pasteUrl}
          onChange={e => setPasteUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
        />
        <button type="button" className="adm-btn adm-btn-ghost" onClick={addUrl}>Add</button>
      </div>

      {err && <div className="adm-error">{err}</div>}

      {value.length > 0 && (
        <div className="adm-thumbs">
          {value.map((src, i) => (
            <div key={i} className="adm-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Image ${i + 1}`} />
              <button
                type="button"
                className="adm-thumb-x"
                onClick={() => remove(i)}
                aria-label={`Remove image ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
