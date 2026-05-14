import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'

/**
 * Image upload endpoint.
 *
 * Behaviour:
 *  - If CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET are set, the file is
 *    forwarded to Cloudinary via their unsigned upload endpoint and the
 *    `secure_url` is returned. (Swap to signed uploads later if needed.)
 *  - Otherwise the file is encoded as a base64 data URL so the admin remains
 *    fully functional during development. Replace this fallback once
 *    Cloudinary keys are provisioned.
 */
const MAX_BYTES = 4 * 1024 * 1024 // 4 MB

export async function POST(req: Request) {
  const block = await requireAdmin()
  if (block) return block

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File too large (>${MAX_BYTES / 1024 / 1024} MB).` }, { status: 413 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 })
  }

  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim()

  if (cloud && preset) {
    try {
      const upstream = new FormData()
      upstream.append('file', file)
      upstream.append('upload_preset', preset)
      const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
        method: 'POST',
        body: upstream,
      })
      const j = (await r.json()) as { secure_url?: string; error?: { message?: string } }
      if (!r.ok || !j.secure_url) {
        return NextResponse.json(
          { error: j.error?.message || 'Cloudinary rejected the upload.' },
          { status: 502 },
        )
      }
      return NextResponse.json({ url: j.secure_url, provider: 'cloudinary' })
    } catch (err) {
      console.error('[admin/upload cloudinary]', err)
      return NextResponse.json({ error: 'Cloudinary upload failed.' }, { status: 502 })
    }
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const dataUrl = `data:${file.type};base64,${buf.toString('base64')}`
  return NextResponse.json({ url: dataUrl, provider: 'data-url' })
}
