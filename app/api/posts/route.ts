import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { posts, postImages, groupMembers, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { after } from 'next/server'

export async function POST(req: Request) {
  const start = Date.now()
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { groupId, caption, imageUrls } = await req.json()
    if (!groupId || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return Response.json({ error: 'groupId and imageUrls required' }, { status: 400 })
    }

    const db = getDb()

    // Verify user is a member of the group
    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId))
      .limit(1)

    if (!membership || membership.groupId !== groupId) {
      return Response.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Upsert user record (sync from Clerk)
    const { currentUser } = await import('@clerk/nextjs/server')
    const clerkUser = await currentUser()
    if (clerkUser) {
      await db
        .insert(users)
        .values({
          id: clerkUser.id,
          name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName ?? ''}`.trim()
            : clerkUser.username ?? '사용자',
          imageUrl: clerkUser.imageUrl,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: clerkUser.firstName
              ? `${clerkUser.firstName} ${clerkUser.lastName ?? ''}`.trim()
              : clerkUser.username ?? '사용자',
            imageUrl: clerkUser.imageUrl,
          },
        })
    }

    const [newPost] = await db
      .insert(posts)
      .values({ groupId, authorId: userId, caption: caption || null })
      .returning()

    const imageValues = imageUrls.map((url: string, i: number) => ({
      postId: newPost.id,
      url,
      order: i,
    }))

    await db.insert(postImages).values(imageValues)

    console.log(JSON.stringify({ level: 'info', msg: 'post_created', postId: newPost.id, ms: Date.now() - start }))

    return Response.json({ id: newPost.id })
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'post_create_failed', error: String(err), ms: Date.now() - start }))
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
