import { NextResponse } from 'next/server'
import { getCachedCatalog } from '@/lib/server/catalog-cache'

export const dynamic = 'force-dynamic'

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
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
          message: 'No visible products in the database. Check MongoDB or run npm run db:seed.',
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
        message: (err as Error).message || 'Could not load catalog.',
      },
      { status: 503, headers: CACHE_HEADER },
    )
  }
}
