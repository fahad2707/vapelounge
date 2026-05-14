import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import AdminShell from '../_components/AdminShell'
import VariantsClient from './VariantsClient'

export default async function AdminVariantsPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?redirect=/admin/variants')
  return (
    <AdminShell email={session.email}>
      <VariantsClient />
    </AdminShell>
  )
}
