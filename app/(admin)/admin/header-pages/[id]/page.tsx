import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import AdminShell from '../../_components/AdminShell'
import HeaderPageDetailClient from './HeaderPageDetailClient'

export default async function AdminHeaderPageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  const { id } = await params
  return (
    <AdminShell email={session.email}>
      <HeaderPageDetailClient headerPageId={id} />
    </AdminShell>
  )
}
