import { NextResponse } from 'next/server'
import { getCachedCatalog } from '@/lib/server/catalog-cache'

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
}

export async function GET() {
  try {
    const catalog = await getCachedCatalog()
    return NextResponse.json({ brands: catalog.brands }, { headers: CACHE_HEADER })
  } catch {
    return NextResponse.json({ brands: ['All brands'] }, { headers: CACHE_HEADER })
  }
}
