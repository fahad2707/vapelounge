import type { ShopNavFilter } from '@/lib/catalog/shop-utils'
import type { NavMenuHeaderPage } from '@/lib/server/nav-menu'

export function shopNavHref(
  pageSlug: string,
  categorySlug?: string,
  modelSlug?: string,
): string {
  const q = new URLSearchParams({ page: pageSlug })
  if (categorySlug) q.set('cat', categorySlug)
  if (modelSlug) q.set('model', modelSlug)
  return `#shop?${q.toString()}`
}

export function navFilterFromSlugs(
  menu: NavMenuHeaderPage[],
  pageSlug?: string,
  catSlug?: string,
  modelSlug?: string,
): ShopNavFilter | null {
  if (!pageSlug) return null
  const page = menu.find(p => p.slug === pageSlug)
  if (!page) return null

  const categoryIds = page.categories.map(c => c.id)

  if (!catSlug) {
    return {
      headerPageId: page.id,
      categoryIds,
      label: page.name,
    }
  }

  const cat = page.categories.find(c => c.slug === catSlug)
  if (!cat) {
    return { headerPageId: page.id, categoryIds, label: page.name }
  }

  if (!modelSlug) {
    return { categoryId: cat.id, headerPageId: page.id, categoryIds, label: cat.name }
  }

  for (const entry of cat.entries) {
    if (entry.type === 'item' && entry.slug === modelSlug) {
      return {
        categoryId: cat.id,
        modelId: entry.id,
        headerPageId: page.id,
        categoryIds,
        label: entry.name,
      }
    }
    if (entry.type === 'group') {
      const m = entry.models.find(x => x.slug === modelSlug)
      if (m) {
        return {
          categoryId: cat.id,
          modelId: m.id,
          headerPageId: page.id,
          categoryIds,
          label: m.name,
        }
      }
    }
  }

  return { categoryId: cat.id, headerPageId: page.id, categoryIds, label: cat.name }
}
