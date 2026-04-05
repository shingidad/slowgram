import { auth } from '@clerk/nextjs/server'
import { put } from '@vercel/blob'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file' }, { status: 400 })

  // Validate: image only, max 20MB
  if (!file.type.startsWith('image/')) {
    return Response.json({ error: 'Only images are allowed' }, { status: 400 })
  }
  if (file.size > 20 * 1024 * 1024) {
    return Response.json({ error: 'File too large (max 20MB)' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const blob = await put(`slowgram/${userId}/${Date.now()}.${ext}`, file, {
    access: 'public',
    contentType: file.type,
  })

  return Response.json({ url: blob.url })
}
