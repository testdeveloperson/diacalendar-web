'use client'

import { Comment } from '@/lib/types'

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
    <div className="border-t border-gray-200/80 bg-white/95 backdrop-blur-md p-4 sm:p-5">
      {replyTarget && (
        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2.5 mb-3 text-sm">
          <span className="text-blue-600">
            <span className="font-semibold">{replyTarget.profiles?.nickname}</span>에게 답글
          </span>
          <button onClick={onCancelReply} className="text-blue-400 hover:text-blue-600 p-0.5 rounded hover:bg-blue-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex gap-2 sm:gap-3">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="댓글을 입력하세요"
          className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm placeholder-gray-400"
        />
        <button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 shadow-sm"
        >
          {loading ? '...' : '전송'}
        </button>
      </div>
    </div>
  )
}
