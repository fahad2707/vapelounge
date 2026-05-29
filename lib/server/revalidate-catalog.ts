import { revalidateTag } from 'next/cache'
import { CATALOG_CACHE_TAG } from '@/lib/server/catalog-cache'

/** Call after admin changes products so the public catalog refreshes on next request. */
export function revalidateCatalogCache(): void {
  const g = globalThis as unknown as { vlCatalog?: unknown }
  delete g.vlCatalog
  try {
    revalidateTag(CATALOG_CACHE_TAG)
  } catch {
    /* ignore when called outside Next request context */
  }
}
