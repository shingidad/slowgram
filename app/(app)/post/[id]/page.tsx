import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import Image from 'next/image'
import { getDb } from '@/lib/db'
import { posts, postImages, comments, users, reactions, groupMembers } from '@/lib/db/schema'
import { eq, asc, inArray } from 'drizzle-orm'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import CommentSection from '@/components/post/CommentSection'
import ReactionBar from '@/components/feed/ReactionBar'
import BackButton from '@/components/nav/BackButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params
  const user = await currentUser()
  const db = getDb()

  const [postRow] = await db
    .select({ post: posts, author: users })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id))
    .limit(1)

  if (!postRow) notFound()

  // Verify user is in the group
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.groupId, postRow.post.groupId))
    .limit(1)

  if (!membership || membership.userId !== user!.id) {
    // Check if user is in this group
    const userMembership = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, user!.id))

    const groupIds = userMembership.map(m => m.groupId)
    if (!groupIds.includes(postRow.post.groupId)) notFound()
  }

  const [images, postReactions, postComments] = await Promise.all([
    db.select().from(postImages).where(eq(postImages.postId, id)),
    db.select().from(reactions).where(eq(reactions.postId, id)),
    db
      .select({ comment: comments, author: users })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, id))
      .orderBy(asc(comments.createdAt)),
  ])

  const sortedImages = images.sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <BackButton />
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarImage src={postRow.author.imageUrl ?? undefined} />
            <AvatarFallback className="text-xs">{postRow.author.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{postRow.author.name}</span>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Images */}
        {sortedImages.length > 0 && (
          <div className="space-y-2">
            {sortedImages.map((img, i) => (
              <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                <Image
                  src={img.url}
                  alt={`이미지 ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 512px) 100vw, 512px"
                />
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        <ReactionBar
          postId={id}
          reactions={postReactions}
          currentUserId={user!.id}
        />

        {/* Caption */}
        {postRow.post.caption && (
          <p className="text-sm leading-6">
            <span className="font-medium mr-1.5">{postRow.author.name}</span>
            {postRow.post.caption}
          </p>
        )}

        <p className="text-xs text-muted-foreground font-mono">
          {formatDistanceToNow(new Date(postRow.post.createdAt), { addSuffix: true, locale: ko })}
        </p>
      </div>

      {/* Comments */}
      <CommentSection
        postId={id}
        initialComments={postComments.map(({ comment, author }) => ({
          ...comment,
          author,
        }))}
        currentUserId={user!.id}
        currentUserName={user!.firstName || user!.username || '나'}
        currentUserImage={user!.imageUrl}
      />
    </div>
  )
}
