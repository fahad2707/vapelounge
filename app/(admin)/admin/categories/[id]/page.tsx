import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import AdminShell from '../../_components/AdminShell'
import CategoryDetailClient from './CategoryDetailClient'

export default async function AdminCategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?redirect=/admin/categories')
  const { id } = await params
  return (
    <AdminShell email={session.email}>
      <CategoryDetailClient categoryId={id} />
    </AdminShell>
  )
}
