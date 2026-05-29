import { NextResponse } from 'next/server'
import { getCachedCatalog } from '@/lib/server/catalog-cache'

/** Full shop catalog — cached on the server (one DB read per ~2 min per region). */
export const revalidate = 120

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
}

export async function GET() {
  if (!process.env.MONGODB_URI?.trim()) {
    return NextResponse.json(
      {
        source: 'no_database' as const,
        products: [],
        brands: ['All brands'],
        total: 0,
        message: 'MONGODB_URI is not set on the server.',
      },
      { headers: CACHE_HEADER },
    )
  }

  try {
    const catalog = await getCachedCatalog()
    if (catalog.total === 0) {
      return NextResponse.json(
        {
          source: 'empty' as const,
          products: [],
          brands: catalog.brands,
          total: 0,
          message: 'Database is connected but has no visible products.',
        },
        { headers: CACHE_HEADER },
      )
    }

    return NextResponse.json(
      {
        source: 'mongodb' as const,
        products: catalog.products,
        brands: catalog.brands,
        total: catalog.total,
        cachedAt: catalog.cachedAt,
      },
      { headers: CACHE_HEADER },
    )
  } catch (err) {
    console.error('[api/catalog]', err)
    return NextResponse.json(
      {
        source: 'error' as const,
        products: [],
        brands: ['All brands'],
        total: 0,
        message: 'Could not load catalog. Check MongoDB connection and Vercel logs.',
      },
      { status: 503, headers: CACHE_HEADER },
    )
  }
}
