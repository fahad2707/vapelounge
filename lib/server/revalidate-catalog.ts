import { revalidateTag } from 'next/cache'
import { CATALOG_CACHE_TAG } from '@/lib/server/catalog-cache'
import { clearShopBrandsCache } from '@/lib/server/shop-brands'

/** Call after admin changes products so the public catalog refreshes on next request. */
export function revalidateCatalogCache(): void {
  const g = globalThis as unknown as { vlCatalog?: unknown }
  delete g.vlCatalog
  clearShopBrandsCache()
  try {
    revalidateTag(CATALOG_CACHE_TAG)
  } catch {
    /* ignore when called outside Next request context */
  }
}
