import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { COL } from '@/lib/db/collections'
import { getAdminDb } from '@/lib/admin/db'
import { requireAdmin } from '@/lib/admin/guard'
import { slugify } from '@/lib/admin/slug'
import type { CategoryDoc, ModelDoc, ProductDoc } from '@/lib/db/product-doc'
import { MAX_FEATURED, MAX_SHOP_DISPLAY } from '@/lib/server/categories'
import { revalidateCatalogCache } from '@/lib/server/revalidate-catalog'

function oid(id: string): ObjectId | null {
  try { return new ObjectId(id) } catch { return null }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const block = await requireAdmin()
  if (block) return block
  const { id } = await ctx.params
  const _id = oid(id)
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  try {
    const db = await getAdminDb()
    const cat = await db.collection<CategoryDoc>(COL.categories).findOne({ _id })
    if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      category: {
        id: (cat._id as ObjectId).toString(),
        slug: cat.slug,
        name: cat.name,
        image: cat.image || null,
        featured: !!cat.featured,
        shopDisplay: !!cat.shopDisplay,
        shopDisplayOrder: cat.shopDisplayOrder ?? 999,
        headerPageId: cat.headerPageId ?? null,
        matchType: cat.matchType || 'brand',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const block = await requireAdmin()
  if (block) return block
  const { id } = await ctx.params
  const _id = oid(id)
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  let body: {
    name?: string
    image?: string | null
    featured?: boolean
    shopDisplay?: boolean
    shopDisplayOrder?: number
    headerPageId?: string | null
    matchType?: 'brand' | 'products'
  } = {}
  try { body = (await req.json()) as typeof body } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const update: Record<string, unknown> = { updatedAt: new Date() }
  let renamed: string | null = null
  if (typeof body.name === 'string' && body.name.trim()) {
    update.name = body.name.trim()
    update.slug = slugify(body.name)
    renamed = body.name.trim()
  }
  if ('image' in body) update.image = body.image && typeof body.image === 'string' ? body.image.trim() : null
  if ('featured' in body) update.featured = !!body.featured
  if ('shopDisplay' in body) update.shopDisplay = !!body.shopDisplay
  if (typeof body.shopDisplayOrder === 'number' && Number.isFinite(body.shopDisplayOrder)) {
    update.shopDisplayOrder = body.shopDisplayOrder
  }
  if ('headerPageId' in body) {
    update.headerPageId =
      typeof body.headerPageId === 'string' && body.headerPageId.trim() ? body.headerPageId.trim() : null
  }
  if ('matchType' in body) {
    update.matchType = body.matchType === 'products' ? 'products' : 'brand'
  }

  try {
    const db = await getAdminDb()
    const col = db.collection<CategoryDoc>(COL.categories)

    if (update.featured === true) {
      const count = await col.countDocuments({ featured: true, _id: { $ne: _id } })
      if (count >= MAX_FEATURED) {
        return NextResponse.json(
          { error: `You can feature up to ${MAX_FEATURED} categories. Unfeature one first.` },
          { status: 409 },
        )
      }
    }
    if (update.shopDisplay === true) {
      const count = await col.countDocuments({ shopDisplay: true, _id: { $ne: _id } })
      if (count >= MAX_SHOP_DISPLAY) {
        return NextResponse.json(
          { error: `You can showcase up to ${MAX_SHOP_DISPLAY} categories in the shop. Remove one first.` },
          { status: 409 },
        )
      }
      if (!('shopDisplayOrder' in update)) {
        update.shopDisplayOrder = count + 1
      }
    }
    if (update.shopDisplay === false) {
      update.shopDisplayOrder = 999
    }

    await col.updateOne({ _id }, { $set: update })

    if (renamed) {
      const oldCat = await col.findOne({ _id })
      const isProductsMode = (update.matchType || oldCat?.matchType) === 'products'
      if (isProductsMode) {
        const oldName = oldCat?.name || ''
        if (oldName) {
          await db.collection<ProductDoc>(COL.products).updateMany(
            { categories: oldName },
            { $set: { "categories.$": renamed, updatedAt: new Date() } }
          )
        }
      } else {
        await db.collection<ProductDoc>(COL.products).updateMany(
          { categoryId: id },
          { $set: { brand: renamed, primaryCategory: renamed, categories: [renamed], updatedAt: new Date() } },
        )
      }
    }

    revalidateCatalogCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const block = await requireAdmin()
  if (block) return block
  const { id } = await ctx.params
  const _id = oid(id)
  if (!_id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  try {
    const db = await getAdminDb()
    const modelCount = await db.collection<ModelDoc>(COL.models).countDocuments({ categoryId: id })
    if (modelCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${modelCount} model(s) still belong to this category.` },
        { status: 409 },
      )
    }
    const productCount = await db.collection<ProductDoc>(COL.products).countDocuments({ categoryId: id })
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${productCount} product(s) are still assigned to this category. Unassign or hide products first.` },
        { status: 409 },
      )
    }
    const r = await db.collection<CategoryDoc>(COL.categories).deleteOne({ _id })
    if (r.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    revalidateCatalogCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
