'use client'

import { useState, useOptimistic } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Send } from 'lucide-react'
import type { Comment, User } from '@/lib/db/schema'

interface CommentWithAuthor extends Comment {
  author: User
}

interface CommentSectionProps {
  postId: string
  initialComments: CommentWithAuthor[]
  currentUserId: string
  currentUserName: string
  currentUserImage?: string
}

export default function CommentSection({
  postId,
  initialComments,
  currentUserId,
  currentUserName,
  currentUserImage,
}: CommentSectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnToFeed = searchParams.get('from') === 'feed'

  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [optimisticComments, addOptimistic] = useOptimistic(
    initialComments,
    (state: CommentWithAuthor[], newComment: CommentWithAuthor) => [...state, newComment]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || submitting) return

    const optimistic: CommentWithAuthor = {
      id: `opt-${Date.now()}`,
      postId,
      authorId: currentUserId,
      content: text.trim(),
      createdAt: new Date(),
      author: {
        id: currentUserId,
        name: currentUserName,
        imageUrl: currentUserImage ?? null,
        createdAt: new Date(),
      },
    }

    addOptimistic(optimistic)
    setText('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: optimistic.content }),
      })
      if (!res.ok) {
        setText(optimistic.content)
        router.refresh()
        return
      }
      if (returnToFeed) {
        router.push('/feed')
        router.refresh()
        return
      }
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border-t border-border">
      {optimisticComments.length > 0 && (
        <div className="px-4 py-3 space-y-4">
          {optimisticComments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarImage src={comment.author.imageUrl ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {comment.author.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium mr-1.5">{comment.author.name}</span>
                  {comment.content}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator className="opacity-50" />

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3">
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage src={currentUserImage} />
          <AvatarFallback className="text-[10px]">{currentUserName.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="따뜻한 댓글을 남겨요..."
          className="flex-1 h-9 text-sm bg-muted border-0 focus-visible:ring-1"
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={!text.trim() || submitting}
          className="h-9 w-9 text-primary"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
