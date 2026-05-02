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

  const fromDb = await listProducts({ brand, limit, skip })

  if (!fromDb) {
    return NextResponse.json(
      {
        source: 'no_database',
        products: [],
        total: 0,
        brands: ['All brands'],
        message: 'Set MONGODB_URI and run npm run db:seed to load the catalog.',
      },
      { headers: CACHE_HEADER },
    )
  }

  return NextResponse.json(
    {
      source: 'mongodb',
      products: fromDb.products,
      total: fromDb.total,
      brands: fromDb.brands,
    },
    { headers: CACHE_HEADER },
  )
}
