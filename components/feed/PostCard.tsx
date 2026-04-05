'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Post, PostImage, Reaction, User } from '@/lib/db/schema'
import ReactionBar from './ReactionBar'

interface PostCardProps {
  post: Post
  author: User
  images: PostImage[]
  reactions: Reaction[]
  commentCount: number
  currentUserId: string
}

const EMOJIS = ['❤️', '🥰', '😂', '👍'] as const

export default function PostCard({
  post,
  author,
  images,
  reactions,
  commentCount,
  currentUserId,
}: PostCardProps) {
  const [imgIndex, setImgIndex] = useState(0)

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })

  return (
    <article className="py-5 px-4">
      {/* Author header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={author.imageUrl ?? undefined} alt={author.name} />
          <AvatarFallback className="text-xs bg-accent text-accent-foreground">
            {author.name.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-none">{author.name}</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{timeAgo}</p>
        </div>
      </div>

      {/* Image slider */}
      {images.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden bg-muted mb-3">
          <div className="relative aspect-square">
            <Image
              src={images[imgIndex].url}
              alt={`게시물 이미지 ${imgIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
            />
          </div>

          {images.length > 1 && (
            <>
              {imgIndex > 0 && (
                <button
                  onClick={() => setImgIndex(i => i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center text-white"
                  aria-label="이전 이미지"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {imgIndex < images.length - 1 && (
                <button
                  onClick={() => setImgIndex(i => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center text-white"
                  aria-label="다음 이미지"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {/* Dots indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === imgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                    aria-label={`이미지 ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Reactions */}
      <ReactionBar
        postId={post.id}
        reactions={reactions}
        currentUserId={currentUserId}
      />

      {/* Caption */}
      {post.caption && (
        <p className="text-sm text-foreground leading-6 mt-2">
          <span className="font-medium mr-1.5">{author.name}</span>
          {post.caption}
        </p>
      )}

      {/* Comment link */}
      <Link
        href={`/post/${post.id}`}
        className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {commentCount > 0 ? `댓글 ${commentCount}개 보기` : '댓글 달기'}
      </Link>
    </article>
  )
}
