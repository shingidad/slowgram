import { auth, currentUser } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { familyGroups, groupMembers, users } from '@/lib/db/schema'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, description } = await req.json()
    if (!name?.trim()) {
      return Response.json({ error: 'Name required' }, { status: 400 })
    }

    const db = getDb()
    const clerkUser = await currentUser()

    // Upsert user
    if (clerkUser) {
      await db.insert(users).values({
        id: clerkUser.id,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName ?? ''}`.trim()
          : clerkUser.username ?? '사용자',
        imageUrl: clerkUser.imageUrl,
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName ?? ''}`.trim()
            : clerkUser.username ?? '사용자',
          imageUrl: clerkUser.imageUrl,
        },
      })
    }

    const [group] = await db
      .insert(familyGroups)
      .values({ name: name.trim(), description: description?.trim() || null, createdBy: userId })
      .returning()

    // Creator becomes admin
    await db.insert(groupMembers).values({ groupId: group.id, userId, role: 'admin' })

    console.log(JSON.stringify({ level: 'info', msg: 'group_created', groupId: group.id }))
    return Response.json({ id: group.id })
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'group_create_failed', error: String(err) }))
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
