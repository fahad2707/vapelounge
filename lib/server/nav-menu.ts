import type { ObjectId } from 'mongodb'
import { getDb } from '@/lib/db/get-db'
import { COL } from '@/lib/db/collections'
import type { CategoryDoc, HeaderPageDoc, ModelDoc } from '@/lib/db/product-doc'

export interface NavMenuModelLink {
  id: string
  slug: string
  name: string
}

export interface NavMenuBrandGroup {
  type: 'group'
  name: string
  models: NavMenuModelLink[]
}

export interface NavMenuModelItem {
  type: 'item'
  id: string
  slug: string
  name: string
}

export type NavMenuEntry = NavMenuBrandGroup | NavMenuModelItem

/** Brand line under a header page (STLTH, Elfbar, …). */
export interface NavMenuCategoryColumn {
  id: string
  slug: string
  name: string
  entries: NavMenuEntry[]
}

/** Top-level header tab (Disposable Vapes, E-liquids, …). */
export interface NavMenuHeaderPage {
  id: string
  slug: string
  name: string
  categories: NavMenuCategoryColumn[]
}

/** @deprecated Use NavMenuHeaderPage — kept for type migration. */
export type NavMenuCategory = NavMenuCategoryColumn

export function groupModelsForNav(models: NavMenuModelLink[]): NavMenuEntry[] {
  const buckets = new Map<string, NavMenuModelLink[]>()

  for (const m of models) {
    const parts = m.name.trim().split(/\s+/).filter(Boolean)
    if (parts.length < 2) {
      buckets.set(`__id:${m.id}`, [m])
      continue
    }
    const key = parts[0]!.toLowerCase()
    const list = buckets.get(key) ?? []
    list.push(m)
    buckets.set(key, list)
  }

  const entries: NavMenuEntry[] = []

  for (const [, items] of buckets) {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name))
    if (sorted.length === 1) {
      const m = sorted[0]!
      entries.push({ type: 'item', id: m.id, slug: m.slug, name: m.name })
      continue
    }
    const brandName = sorted[0]!.name.trim().split(/\s+/)[0]!
    entries.push({ type: 'group', name: brandName, models: sorted })
  }

  return entries.sort((a, b) => {
    const na = a.type === 'group' ? a.name : a.name
    const nb = b.type === 'group' ? b.name : b.name
    return na.localeCompare(nb)
  })
}

const globalNav = globalThis as unknown as {
  vlNavMenu?: { data: NavMenuHeaderPage[]; at: number }
}

const NAV_TTL_MS = 300_000

export async function getNavMenu(): Promise<NavMenuHeaderPage[]> {
  const now = Date.now()
  const hit = globalNav.vlNavMenu
  if (hit && hit.data.length > 0 && now - hit.at < NAV_TTL_MS) {
    return hit.data
  }

  const db = await getDb()
  if (!db) return []

  const [pageDocs, categoryDocs, modelDocs] = await Promise.all([
    db
      .collection<HeaderPageDoc>(COL.headerPages)
      .find({ showInNav: { $ne: false } })
      .sort({ navOrder: 1, name: 1 })
      .toArray(),
    db.collection<CategoryDoc>(COL.categories).find({}).sort({ navOrder: 1, name: 1 }).toArray(),
    db.collection<ModelDoc>(COL.models).find({}).sort({ name: 1 }).toArray(),
  ])

  const modelsByCategory = new Map<string, NavMenuModelLink[]>()
  for (const m of modelDocs) {
    const id = (m._id as ObjectId).toString()
    const link: NavMenuModelLink = { id, slug: m.slug, name: m.name }
    const list = modelsByCategory.get(m.categoryId) ?? []
    list.push(link)
    modelsByCategory.set(m.categoryId, list)
  }

  const categoriesByPage = new Map<string, NavMenuCategoryColumn[]>()
  for (const c of categoryDocs) {
    const pageId = c.headerPageId?.trim()
    if (!pageId) continue
    const catId = (c._id as ObjectId).toString()
    const models = modelsByCategory.get(catId) ?? []
    const col: NavMenuCategoryColumn = {
      id: catId,
      slug: c.slug,
      name: c.name,
      entries: models.length ? groupModelsForNav(models) : [],
    }
    const list = categoriesByPage.get(pageId) ?? []
    list.push(col)
    categoriesByPage.set(pageId, list)
  }

  const menu: NavMenuHeaderPage[] = []

  for (const p of pageDocs) {
    const pageId = (p._id as ObjectId).toString()
    const categories = categoriesByPage.get(pageId) ?? []
    if (!categories.length) continue
    menu.push({
      id: pageId,
      slug: p.slug,
      name: p.name,
      categories,
    })
  }

  if (menu.length > 0) {
    globalNav.vlNavMenu = { data: menu, at: now }
  }

  return menu
}

export function clearNavMenuCache(): void {
  delete globalNav.vlNavMenu
}
