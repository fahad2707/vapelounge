import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import AdminShell from '../../_components/AdminShell'
import ModelDetailClient from './ModelDetailClient'

export default async function AdminModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?redirect=/admin/models')
  const { id } = await params
  return (
    <AdminShell email={session.email}>
      <ModelDetailClient modelId={id} />
    </AdminShell>
  )
}
