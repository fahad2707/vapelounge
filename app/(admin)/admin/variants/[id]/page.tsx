import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import AdminShell from '../../_components/AdminShell'
import VariantDetailClient from './VariantDetailClient'

export default async function AdminVariantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?redirect=/admin/variants')
  const { id } = await params
  return (
    <AdminShell email={session.email}>
      <VariantDetailClient groupId={id} />
    </AdminShell>
  )
}
