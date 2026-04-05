'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import type { FamilyGroup } from '@/lib/db/schema'

interface CreatePostFormProps {
  groups: FamilyGroup[]
}

export default function CreatePostForm({ groups }: CreatePostFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleFiles(files: FileList) {
    const newFiles = Array.from(files).slice(0, 10 - selectedFiles.length)
    const newPreviews = newFiles.map(f => URL.createObjectURL(f))
    setSelectedFiles(prev => [...prev, ...newFiles])
    setPreviews(prev => [...prev, ...newPreviews])
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index])
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!groupId || selectedFiles.length === 0) {
      setError('그룹을 선택하고 사진을 추가해주세요')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      // Upload images
      const uploadedUrls: string[] = []
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('업로드 실패')
        const { url } = await res.json()
        uploadedUrls.push(url)
      }

      // Create post
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, caption: caption.trim(), imageUrls: uploadedUrls }),
      })
      if (!res.ok) throw new Error('게시물 생성 실패')

      router.push('/feed')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했어요')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-5">
      {/* Image picker */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">사진 추가 (최대 10장)</Label>

        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              <Image src={src} alt={`미리보기 ${i + 1}`} fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center text-white"
                aria-label="이미지 삭제"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {selectedFiles.length < 10 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[11px] font-medium">추가</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Group selector */}
      {groups.length > 1 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">공유할 그룹</Label>
          <Select value={groupId} onValueChange={(v) => v && setGroupId(v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="그룹 선택" />
            </SelectTrigger>
            <SelectContent>
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Caption */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">캡션 (선택)</Label>
        <Textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="이 순간을 표현해보세요..."
          rows={3}
          maxLength={500}
          className="resize-none text-sm"
        />
        <p className="text-xs text-muted-foreground text-right font-mono">{caption.length}/500</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={submitting || selectedFiles.length === 0 || !groupId}
        className="w-full h-11"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            올리는 중...
          </>
        ) : (
          '게시물 올리기'
        )}
      </Button>
    </form>
  )
}
