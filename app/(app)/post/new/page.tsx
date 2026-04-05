import { currentUser } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { groupMembers, familyGroups } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import CreatePostForm from '@/components/post/CreatePostForm'
import BackButton from '@/components/nav/BackButton'

export default async function NewPostPage() {
  const user = await currentUser()
  const db = getDb()

  const memberships = await db
    .select({ group: familyGroups })
    .from(groupMembers)
    .innerJoin(familyGroups, eq(groupMembers.groupId, familyGroups.id))
    .where(eq(groupMembers.userId, user!.id))

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <BackButton />
        <h1 className="text-base font-medium">새 게시물</h1>
      </header>
      <CreatePostForm groups={memberships.map(m => m.group)} />
    </div>
  )
}
