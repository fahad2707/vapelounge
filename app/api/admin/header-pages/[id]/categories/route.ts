import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import type { CategoryDoc, HeaderPageDoc } from '@/lib/db/product-doc'
import { revalidateCatalogCache } from '@/lib/server/revalidate-catalog'

function oid(id: string): ObjectId | null {
  try {
    return new ObjectId(id)
  } catch {
    return null
  }
}

/** Assign or remove categories on a header page. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const block = await requireAdmin()
  if (block) return block
  const { id: headerPageId } = await ctx.params
  const pageOid = oid(headerPageId)
  if (!pageOid) return NextResponse.json({ error: 'Invalid header page id' }, { status: 400 })

  let body: { categoryId?: string; action?: 'add' | 'remove' } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const categoryId = (body.categoryId || '').trim()
  if (!categoryId) return NextResponse.json({ error: 'categoryId is required' }, { status: 400 })
  const catOid = oid(categoryId)
  if (!catOid) return NextResponse.json({ error: 'Invalid category id' }, { status: 400 })

  try {
    const db = await getAdminDb()
    const page = await db.collection<HeaderPageDoc>(COL.headerPages).findOne({ _id: pageOid })
    if (!page) return NextResponse.json({ error: 'Header page not found' }, { status: 404 })

    const col = db.collection<CategoryDoc>(COL.categories)

    if (body.action === 'remove') {
      await col.updateOne(
        { _id: catOid, headerPageId },
        { $set: { headerPageId: null, updatedAt: new Date() } },
      )
    } else {
      const assigned = await col.countDocuments({ headerPageId })
      await col.updateOne(
        { _id: catOid },
        {
          $set: {
            headerPageId,
            navOrder: assigned + 1,
            updatedAt: new Date(),
          },
        },
      )
    }

    revalidateCatalogCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/header-pages categories POST]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
