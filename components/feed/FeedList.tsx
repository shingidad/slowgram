import { getDb } from '@/lib/db'
import { posts, postImages, reactions, comments, users } from '@/lib/db/schema'
import { desc, eq, inArray } from 'drizzle-orm'
import PostCard from './PostCard'

interface FeedListProps {
  userId: string
  cursor?: string
  limit?: number
}

export default async function FeedList({ userId, cursor, limit = 20 }: FeedListProps) {
  const db = getDb()

  // 홈 피드: 그룹 가입 여부와 관계없이 모든 게시물 표시
  const feedPosts = await db
    .select({
      post: posts,
      author: users,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(limit)

  if (feedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="text-5xl mb-4">📷</div>
        <h2 className="text-lg font-medium text-foreground mb-2">아직 게시물이 없어요</h2>
        <p className="text-sm text-muted-foreground leading-6">
          첫 번째 사진을 올려보세요
        </p>
      </div>
    )
  }

  const postIds = feedPosts.map(p => p.post.id)

  // Batch fetch images, reactions, comments
  const [images, allReactions, allComments] = await Promise.all([
    db.select().from(postImages).where(inArray(postImages.postId, postIds)),
    db.select().from(reactions).where(inArray(reactions.postId, postIds)),
    db.select({ id: comments.id, postId: comments.postId }).from(comments).where(inArray(comments.postId, postIds)),
  ])

  const imagesByPost = images.reduce<Record<string, typeof images>>((acc, img) => {
    if (!acc[img.postId]) acc[img.postId] = []
    acc[img.postId].push(img)
    return acc
  }, {})

  const reactionsByPost = allReactions.reduce<Record<string, typeof allReactions>>((acc, r) => {
    if (!acc[r.postId]) acc[r.postId] = []
    acc[r.postId].push(r)
    return acc
  }, {})

  const commentCountByPost = allComments.reduce<Record<string, number>>((acc, c) => {
    acc[c.postId] = (acc[c.postId] || 0) + 1
    return acc
  }, {})

  return (
    <div className="divide-y divide-border/50">
      {feedPosts.map(({ post, author }) => (
        <PostCard
          key={post.id}
          post={post}
          author={author}
          images={(imagesByPost[post.id] || []).sort((a, b) => a.order - b.order)}
          reactions={reactionsByPost[post.id] || []}
          commentCount={commentCountByPost[post.id] || 0}
          currentUserId={userId}
        />
      ))}
    </div>
  )
}
