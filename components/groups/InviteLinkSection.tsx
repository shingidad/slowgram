'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link2, Copy, RefreshCw, Check } from 'lucide-react'

interface InviteLinkSectionProps {
  groupId: string
  initialToken: string | null
}

export default function InviteLinkSection({ groupId, initialToken }: InviteLinkSectionProps) {
  const [token, setToken] = useState(initialToken)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const inviteUrl = token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${token}`
    : null

  async function generateLink() {
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, { method: 'POST' })
      const data = await res.json()
      setToken(data.token)
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        <Link2 className="h-3.5 w-3.5" />
        초대 링크
      </h3>

      {inviteUrl ? (
        <div className="flex gap-2">
          <Input
            value={inviteUrl}
            readOnly
            className="text-xs h-9 font-mono bg-muted border-0"
          />
          <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={copyLink}>
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={generateLink} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full h-10" onClick={generateLink} disabled={loading}>
          {loading ? '생성 중...' : '초대 링크 만들기'}
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        이 링크를 가족에게 공유하면 그룹에 참여할 수 있어요
      </p>
    </div>
  )
}
