'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function CreateGroupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      })
      if (!res.ok) throw new Error('그룹 생성에 실패했어요')
      const { id } = await res.json()
      router.push(`/groups/${id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했어요')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">그룹 이름 *</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="예: 우리 가족"
          maxLength={50}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">설명 (선택)</Label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="그룹에 대한 소개를 적어보세요"
          rows={3}
          maxLength={200}
          className="resize-none text-sm"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={!name.trim() || submitting} className="w-full h-11">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            만드는 중...
          </>
        ) : (
          '그룹 만들기'
        )}
      </Button>
    </form>
  )
}
