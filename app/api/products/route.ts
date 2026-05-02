import { NextResponse } from 'next/server'
import { listProducts } from '@/lib/server/products'

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
}

function parseIntSafe(v: string | null, fallback: number, min: number, max: number) {
  const n = Number.parseInt(v ?? '', 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')
  const limit = parseIntSafe(searchParams.get('limit'), 800, 1, 1000)
  const skip = parseIntSafe(searchParams.get('skip'), 0, 0, 50_000)

  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    return NextResponse.json(
      {
        source: 'no_database' as const,
        products: [],
        total: 0,
        brands: ['All brands'],
        message:
          'MONGODB_URI is not set on the server. In Vercel: Project → Settings → Environment Variables → add MONGODB_URI for Production (and Preview if you use preview URLs), then Redeploy.',
      },
      { headers: CACHE_HEADER },
    )
  }

  try {
    const fromDb = await listProducts({ brand, limit, skip })
    if (!fromDb) {
      return NextResponse.json(
        {
          source: 'no_database' as const,
          products: [],
          total: 0,
          brands: ['All brands'],
          message: 'MongoDB client could not be created. Check MONGODB_URI.',
        },
        { headers: CACHE_HEADER },
      )
    }

    const noBrandFilter = !brand?.trim() || brand === 'All brands'
    if (!noBrandFilter && fromDb.total === 0) {
      return NextResponse.json(
        {
          source: 'mongodb' as const,
          products: [],
          total: 0,
          brands: fromDb.brands,
          message: `No products in “${brand}”. Try another line or All brands.`,
        },
        { headers: CACHE_HEADER },
      )
    }

    if (fromDb.total === 0) {
      return NextResponse.json(
        {
          source: 'empty' as const,
          products: [],
          total: 0,
          brands: fromDb.brands,
          message:
            'The database has no products yet. On your machine, set the same MONGODB_URI (and MONGODB_DB_NAME if you use it) as in Vercel, then run: npm run db:seed',
        },
        { headers: CACHE_HEADER },
      )
    }

    return NextResponse.json(
      {
        source: 'mongodb' as const,
        products: fromDb.products,
        total: fromDb.total,
        brands: fromDb.brands,
      },
      { headers: CACHE_HEADER },
    )
  } catch (err) {
    console.error('[api/products]', err)
    return NextResponse.json(
      {
        source: 'error' as const,
        products: [],
        total: 0,
        brands: ['All brands'],
        message:
          'Could not reach MongoDB. In Atlas: Network Access → allow 0.0.0.0/0 (all IPs) or Vercel’s ranges; confirm the password in MONGODB_URI is URL-encoded if it contains @ : / ? # etc.',
      },
      { status: 503, headers: CACHE_HEADER },
    )
  }
}
