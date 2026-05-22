import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import AdminShell from '../_components/AdminShell'
import UsersClient from './UsersClient'

export default async function AdminUsersPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?redirect=/admin/users')
  return (
    <AdminShell email={session.email}>
      <UsersClient />
    </AdminShell>
  )
}
