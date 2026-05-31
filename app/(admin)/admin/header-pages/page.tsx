import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/guard'
import AdminShell from '../_components/AdminShell'
import HeaderPagesClient from './HeaderPagesClient'

export default async function AdminHeaderPagesPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login?redirect=/admin/header-pages')
  return (
    <AdminShell email={session.email}>
      <HeaderPagesClient />
    </AdminShell>
  )
}
