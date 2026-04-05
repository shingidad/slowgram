import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { comments, posts, groupMembers, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { content } = await req.json()
    if (!content?.trim()) {
      return Response.json({ error: 'Content required' }, { status: 400 })
    }

    const db = getDb()

    const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1)
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 })

    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, post.groupId), eq(groupMembers.userId, userId)))
      .limit(1)
    if (!membership) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const [comment] = await db
      .insert(comments)
      .values({ postId, authorId: userId, content: content.trim() })
      .returning()

    return Response.json({ id: comment.id })
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'comment_failed', error: String(err) }))
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
