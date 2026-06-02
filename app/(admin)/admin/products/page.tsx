import { redirect } from 'next/navigation'
import { getAdminDb } from '@/lib/admin/db'
import { getAdminSession } from '@/lib/admin/guard'
import { formatMongoError } from '@/lib/mongodb'
import { listAdminProductsForGrid } from '@/lib/server/admin-products'
import { warmAdminDb } from '@/lib/server/warm-db'
import AdminShell from '../_components/AdminShell'
import ProductsClient from './ProductsClient'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export default async function AdminProductsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?redirect=/admin/products')

  await warmAdminDb()

  let initialProducts: Awaited<ReturnType<typeof listAdminProductsForGrid>>['products'] = []
  let initialHasMore = false
  let initialError: string | null = null

  try {
    const db = await getAdminDb()
    const result = await listAdminProductsForGrid(db, { skip: 0, limit: 36, q: '' })
    initialProducts = result.products
    initialHasMore = result.hasMore
  } catch (err) {
    initialError = formatMongoError(err)
  }

  return (
    <AdminShell email={session.email}>
      <ProductsClient
        initialProducts={initialProducts}
        initialHasMore={initialHasMore}
        initialError={initialError}
      />
    </AdminShell>
  )
}
