'use client'

import { Comment, formatRelativeTime } from '@/lib/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

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
    <div className={`${isReply ? 'ml-6 sm:ml-10 border-l-2 border-primary/20 pl-4' : ''}`}>
      <div className="py-3.5">
        {comment.is_deleted ? (
          <p className="text-sm text-muted-foreground italic">삭제된 메시지입니다</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                    {(comment.profiles?.nickname ?? '?')[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-foreground">
                  {comment.profiles?.nickname ?? '알 수 없음'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(comment.created_at)}
                </span>
              </div>

              {currentUserId && (
                <div className="flex items-center gap-1">
                  {isOwn ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(comment.id)}
                      className="text-xs text-muted-foreground hover:text-destructive h-auto px-2 py-1"
                    >
                      삭제
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReport('comment', comment.id, comment.author_id)}
                        className="text-xs text-muted-foreground hover:text-destructive h-auto px-2 py-1"
                      >
                        신고
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onBlock(comment.author_id)}
                        className="text-xs text-muted-foreground hover:text-destructive h-auto px-2 py-1"
                      >
                        차단
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed pl-8">{comment.content}</p>

            {!isReply && currentUserId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment)}
                className="text-xs text-primary mt-1.5 ml-8 font-medium h-auto px-2 py-1"
              >
                답글
              </Button>
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
