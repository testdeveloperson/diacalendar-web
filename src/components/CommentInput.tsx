'use client'

import { Comment } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface CommentInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  replyTarget: Comment | null
  onCancelReply: () => void
  loading: boolean
}

export default function CommentInput({
  value,
  onChange,
  onSubmit,
  replyTarget,
  onCancelReply,
  loading,
}: CommentInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) onSubmit()
    }
  }

  return (
    <div className="border-t bg-background/95 backdrop-blur-md p-4 sm:p-5">
      {replyTarget && (
        <div className="flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2.5 mb-3 text-sm">
          <span className="text-primary">
            <span className="font-semibold">{replyTarget.profiles?.nickname}</span>에게 답글
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancelReply}
            className="h-6 w-6 text-primary/60 hover:text-primary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2 sm:gap-3">
        <Input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="댓글을 입력하세요"
          className="flex-1"
        />
        <Button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
        >
          {loading ? '...' : '전송'}
        </Button>
      </div>
    </div>
  )
}
