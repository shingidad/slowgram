'use client'

import { useState, useOptimistic } from 'react'
import { Button } from '@/components/ui/button'
import type { Reaction } from '@/lib/db/schema'

interface ReactionBarProps {
  postId: string
  reactions: Reaction[]
  currentUserId: string
}

const EMOJIS = ['❤️', '🥰', '😂', '👍'] as const
type Emoji = typeof EMOJIS[number]

export default function ReactionBar({ postId, reactions, currentUserId }: ReactionBarProps) {
  const [optimisticReactions, addOptimistic] = useOptimistic(
    reactions,
    (state: Reaction[], action: { type: 'toggle'; emoji: Emoji }) => {
      const existing = state.find(
        r => r.userId === currentUserId && r.emoji === action.emoji
      )
      if (existing) {
        return state.filter(r => r.id !== existing.id)
      }
      return [
        ...state,
        {
          id: `opt-${Date.now()}`,
          postId,
          userId: currentUserId,
          emoji: action.emoji,
          createdAt: new Date(),
        } as Reaction,
      ]
    }
  )

  async function toggleReaction(emoji: Emoji) {
    addOptimistic({ type: 'toggle', emoji })
    await fetch(`/api/posts/${postId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
  }

  const countsByEmoji = EMOJIS.reduce<Record<string, number>>((acc, e) => {
    acc[e] = optimisticReactions.filter(r => r.emoji === e).length
    return acc
  }, {} as Record<string, number>)

  const myEmojis = new Set(
    optimisticReactions.filter(r => r.userId === currentUserId).map(r => r.emoji)
  )

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {EMOJIS.map(emoji => {
        const count = countsByEmoji[emoji]
        const mine = myEmojis.has(emoji)
        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all ${
              mine
                ? 'bg-primary/15 ring-1 ring-primary/40 scale-105'
                : count > 0
                ? 'bg-accent hover:bg-accent/80'
                : 'bg-transparent hover:bg-accent/60 opacity-60 hover:opacity-100'
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className="font-mono text-xs text-foreground tabular-nums">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
