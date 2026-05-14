import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import AdminShell from '../_components/AdminShell'
import ProductsClient from './ProductsClient'

export default async function AdminProductsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?redirect=/admin/products')
  return (
    <AdminShell email={session.email}>
      <ProductsClient />
    </AdminShell>
  )
}
