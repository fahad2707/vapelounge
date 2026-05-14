import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import AdminShell from '../_components/AdminShell'
import ModelsClient from './ModelsClient'

export default async function AdminModelsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?redirect=/admin/models')
  return (
    <AdminShell email={session.email}>
      <ModelsClient />
    </AdminShell>
  )
}
