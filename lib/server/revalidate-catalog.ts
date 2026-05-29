import { revalidateTag } from 'next/cache'
import { CATALOG_CACHE_TAG } from '@/lib/server/catalog-cache'

/** Call after admin changes products so the public catalog refreshes within ~2 min (or next request). */
export function revalidateCatalogCache(): void {
  try {
    revalidateTag(CATALOG_CACHE_TAG)
  } catch {
    /* ignore when called outside Next request context */
  }
}
