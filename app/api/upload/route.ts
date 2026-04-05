import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const BUCKET = 'slowgram-media'

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
  const path = `${userId}/${Date.now()}.${ext}`
  const buffer = await file.arrayBuffer()

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return Response.json({ url: data.publicUrl })
}
