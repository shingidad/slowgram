import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { reactions, groupMembers, posts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const ALLOWED_EMOJIS = ['❤️', '🥰', '😂', '👍']

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { emoji } = await req.json()
    if (!ALLOWED_EMOJIS.includes(emoji)) {
      return Response.json({ error: 'Invalid emoji' }, { status: 400 })
    }

    const db = getDb()

    // Verify user can access this post's group
    const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1)
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 })

    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, post.groupId), eq(groupMembers.userId, userId)))
      .limit(1)
    if (!membership) return Response.json({ error: 'Forbidden' }, { status: 403 })

    // Toggle: remove if exists, add if not
    const [existing] = await db
      .select()
      .from(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId), eq(reactions.emoji, emoji)))
      .limit(1)

    if (existing) {
      await db.delete(reactions).where(eq(reactions.id, existing.id))
      return Response.json({ action: 'removed' })
    } else {
      await db.insert(reactions).values({ postId, userId, emoji })
      return Response.json({ action: 'added' })
    }
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'reaction_failed', error: String(err) }))
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
