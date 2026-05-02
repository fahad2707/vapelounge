const WIX_MEDIA_BASE = 'https://static.wixstatic.com/media/'

/** Wix export stores filenames only; resolve to CDN URL. */
export function toWixMediaUrl(fileRef: string): string {
  const t = fileRef.trim()
  if (!t) return ''
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  return `${WIX_MEDIA_BASE}${t.replace(/^\//, '')}`
}

export function parseImageList(raw: string): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(';')
    .map(s => toWixMediaUrl(s))
    .filter(Boolean)
}
