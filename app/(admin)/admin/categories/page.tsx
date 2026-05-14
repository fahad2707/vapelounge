import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import AdminShell from '../_components/AdminShell'
import CategoriesClient from './CategoriesClient'

export default async function AdminCategoriesPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?redirect=/admin/categories')
  return (
    <AdminShell email={session.email}>
      <CategoriesClient />
    </AdminShell>
  )
}
