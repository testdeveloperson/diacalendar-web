'use client'

import { Comment, formatRelativeTime } from '@/lib/types'

interface CommentItemProps {
  comment: Comment
  currentUserId: string | null
  isReply?: boolean
  onReply: (comment: Comment) => void
  onDelete: (commentId: number) => void
  onReport: (contentType: 'comment', contentId: number, authorId: string) => void
  onBlock: (authorId: string) => void
}

export default function CommentItem({
  comment,
  currentUserId,
  isReply = false,
  onReply,
  onDelete,
  onReport,
  onBlock,
}: CommentItemProps) {
  const isOwn = currentUserId === comment.author_id

  return (
    <div className={`${isReply ? 'ml-6 sm:ml-10 border-l-2 border-blue-100 dark:border-blue-900 pl-4' : ''}`}>
      <div className="py-3.5">
        {comment.is_deleted ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">삭제된 메시지입니다</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  {(comment.profiles?.nickname ?? '?')[0]}
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {comment.profiles?.nickname ?? '알 수 없음'}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatRelativeTime(comment.created_at)}
                </span>
              </div>

              {currentUserId && (
                <div className="flex items-center gap-1">
                  {isOwn ? (
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                    >
                      삭제
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onReport('comment', comment.id, comment.author_id)}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      >
                        신고
                      </button>
                      <button
                        onClick={() => onBlock(comment.author_id)}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      >
                        차단
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pl-8">{comment.content}</p>

            {!isReply && currentUserId && (
              <button
                onClick={() => onReply(comment)}
                className="text-xs text-blue-500 mt-1.5 ml-8 hover:text-blue-700 font-medium"
              >
                답글
              </button>
            )}
          </>
        )}
      </div>

      {comment.replies?.map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply}
          currentUserId={currentUserId}
          isReply
          onReply={onReply}
          onDelete={onDelete}
          onReport={onReport}
          onBlock={onBlock}
        />
      ))}
    </div>
  )
}
