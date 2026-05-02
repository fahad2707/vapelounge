import { stripHtml } from '@/lib/catalog/html'
import { parseImageList } from '@/lib/catalog/wix-media'
import type { CatalogVariant, CatalogVariantChoice } from '@/lib/catalog/types'

export type WixCsvRow = Record<string, string>

function parseChoices(optionType: string, raw: string): CatalogVariantChoice[] {
  if (!raw?.trim()) return []
  const type = (optionType || '').toUpperCase()
  const parts = raw
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)

  if (type === 'COLOR') {
    return parts.map(p => {
      const m = p.match(/^#([0-9a-fA-F]{3,8}):(.+)$/i)
      if (m) return { label: m[2].trim(), swatch: `#${m[1]}` }
      return { label: p }
    })
  }

  return parts.map(label => ({ label }))
}

function collectVariants(row: WixCsvRow): CatalogVariant[] {
  const out: CatalogVariant[] = []
  for (let i = 1; i <= 6; i++) {
    const name = row[`productOptionName${i}`]?.trim()
    const type = row[`productOptionType${i}`]?.trim() || 'DROP_DOWN'
    const desc = row[`productOptionDescription${i}`]?.trim()
    if (!name || !desc) continue
    const choices = parseChoices(type, desc)
    if (choices.length) out.push({ name, type, choices })
  }
  return out
}

function splitCollections(raw: string): string[] {
  if (!raw?.trim()) return ['Uncategorized']
  return raw
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
}

function accentFromVariants(variants: CatalogVariant[], name: string): string {
  for (const v of variants) {
    if (v.type.toUpperCase() === 'COLOR') {
      const sw = v.choices.find(c => c.swatch)?.swatch
      if (sw) return sw
    }
  }
  let h = 0
  for (let i = 0; i < name.length; i++) h = (name.charCodeAt(i) + ((h << 5) - h)) | 0
  const hue = Math.abs(h) % 360
  return `hsl(${hue} 38% 46%)`
}

function mapRibbonToBadge(ribbon: string): string | null {
  const r = ribbon?.trim()
  if (!r) return null
  const l = r.toLowerCase()
  if (l.includes('sale')) return 'sale'
  if (l.includes('hot') || l.includes('best')) return 'hot'
  if (l.includes('new')) return 'new'
  return r.slice(0, 24)
}

function parseCompareAt(
  price: number,
  discountMode: string,
  discountValue: string,
): number | null {
  const dv = Number.parseFloat(discountValue)
  const dm = (discountMode || '').toUpperCase()
  if (!Number.isFinite(dv) || dv <= 0) return null
  if (dm === 'PERCENT' && dv < 100 && price > 0) {
    return Math.round((price / (1 - dv / 100)) * 100) / 100
  }
  return null
}

/** Map one Wix Stores CSV row → MongoDB product document fields. */
export function wixRowToProductDoc(row: WixCsvRow) {
  const handleId = row.handleId?.trim()
  if (!handleId) return null

  const name = row.name?.trim() || 'Untitled'
  const descriptionHtml = row.description?.trim() || ''
  const descriptionPlain = stripHtml(descriptionHtml)
  const images = parseImageList(row.productImageUrl || '')
  const image = images[0] || ''
  const categories = splitCollections(row.collection || '')
  const primaryCategory = categories[0] || 'Uncategorized'

  const price = Number.parseFloat(String(row.price).replace(/,/g, '')) || 0
  const compareAtPrice = parseCompareAt(price, row.discountMode || '', row.discountValue || '')

  const variants = collectVariants(row)
  const accentColor = accentFromVariants(variants, name)

  const visible = String(row.visible ?? 'true').toLowerCase() === 'true'
  const inv = (row.inventory || '').trim()
  const inStock = inv.toLowerCase() !== 'outofstock'

  return {
    handleId,
    name,
    descriptionHtml,
    descriptionPlain,
    images,
    image,
    primaryCategory,
    categories,
    price,
    compareAtPrice,
    badge: mapRibbonToBadge(row.ribbon || ''),
    inStock,
    variants,
    sku: row.sku?.trim() || null,
    brand: row.brand?.trim() || null,
    collectionRaw: row.collection?.trim() || '',
    visible,
    accentColor,
    updatedAt: new Date(),
  }
}
