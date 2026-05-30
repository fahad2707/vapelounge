import { NextResponse } from 'next/server'
import { listProducts } from '@/lib/server/products'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
}

function parseIntSafe(v: string | null, fallback: number, min: number, max: number) {
  const n = Number.parseInt(v ?? '', 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')
  const limit = parseIntSafe(searchParams.get('limit'), 1000, 1, 2000)
  const skip = parseIntSafe(searchParams.get('skip'), 0, 0, 50_000)
  const skipBrands = searchParams.get('skipBrands') === '1'

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
    const fromDb = await listProducts({
      brand,
      limit,
      skip,
      includeBrands: !skipBrands,
    })
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

    const brands = fromDb.brands ?? ['All brands']
    const noBrandFilter = !brand?.trim() || brand === 'All brands'
    if (!noBrandFilter && fromDb.total === 0) {
      return NextResponse.json(
        {
          source: 'mongodb' as const,
          products: [],
          total: 0,
          brands,
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
          brands,
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
        hasMore: fromDb.hasMore,
        brands,
      },
      { headers: CACHE_HEADER },
    )
  } catch (err) {
    console.error('[api/products]', err)
    const msg = err instanceof Error ? err.message : String(err)
    const sortLimit = /sort exceeded memory limit/i.test(msg)
    const timeout = /timed out|timeout/i.test(msg)
    const auth = /authentication failed|bad auth|invalid.*password/i.test(msg)
    const network = /ENOTFOUND|ECONNREFUSED|Server selection|failed to connect/i.test(msg)

    let hint =
      'Catalog query failed. Check Vercel → Logs for the exact error, then redeploy after fixing.'
    if (sortLimit) {
      hint =
        'Catalog query exceeded MongoDB memory limits. Redeploy the latest build (slim product list) or reduce ?limit= on /api/products.'
    } else if (timeout) {
      hint = 'MongoDB timed out. Confirm Atlas cluster is running and MONGODB_URI is set on Vercel (Production).'
    } else if (auth) {
      hint =
        'MongoDB rejected the credentials. In Vercel, update MONGODB_URI with the correct Atlas user/password (URL-encode special characters in the password).'
    } else if (network) {
      hint =
        'Could not reach MongoDB. In Atlas: Network Access → allow 0.0.0.0/0 (all IPs) or Vercel’s ranges; confirm MONGODB_URI is correct and the password is URL-encoded if it contains @ : / ? # etc.'
    }

    return NextResponse.json(
      {
        source: 'error' as const,
        products: [],
        total: 0,
        brands: ['All brands'],
        message: hint,
      },
      { status: 503, headers: CACHE_HEADER },
    )
  }
}
