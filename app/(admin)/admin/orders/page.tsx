import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import AdminShell from '../_components/AdminShell'
import OrdersClient from './OrdersClient'

export default async function AdminOrdersPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?redirect=/admin/orders')
  return (
    <AdminShell email={session.email}>
      <OrdersClient />
    </AdminShell>
  )
}
