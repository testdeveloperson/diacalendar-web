'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Post, Comment, ReportReason, formatRelativeTime, colorClass } from '@/lib/types'
import { useCategories } from '@/hooks/useCategories'
import CommentItem from '@/components/CommentItem'
import CommentInput from '@/components/CommentInput'
import ReportDialog from '@/components/ReportDialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  Loader2, Frown, X, MoreVertical, Pencil, Trash2,
  TriangleAlert, Ban, Eye, ThumbsUp, ThumbsDown, MessageCircle,
} from 'lucide-react'

const URL_REGEX = /https?:\/\/[^\s<]+/g

function LinkableText({ text }: { text: string }) {
  const parts = text.split(URL_REGEX)
  const urls = text.match(URL_REGEX) || []

  const elements: React.ReactNode[] = []
  parts.forEach((part, i) => {
    elements.push(part)
    if (urls[i]) {
      elements.push(
        <a
          key={i}
          href={urls[i]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          {urls[i]}
        </a>
      )
    }
  })

  return <>{elements}</>
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, anonId } = useAuth()
  const { getCategoryLabel, getCategoryColor } = useCategories()
  const router = useRouter()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: number; authorId: string } | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  const [confirmAction, setConfirmAction] = useState<{ message: string; action: () => void } | null>(null)

  const [viewCount, setViewCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [dislikeCount, setDislikeCount] = useState(0)
  const [myReaction, setMyReaction] = useState<'LIKE' | 'DISLIKE' | null>(null)
  const [reactionLoading, setReactionLoading] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const fetchPost = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('id,author_id,title,content,category,created_at,image_urls,profiles(nickname),comments(count)')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      toast.error('게시글을 불러오지 못했습니다')
    }
    if (data) setPost(data as unknown as Post)
    setLoading(false)
  }, [id])

  const recordView = useCallback(async () => {
    if (!anonId) return
    await supabase.from('post_views').insert({ post_id: Number(id), user_id: anonId })
  }, [id, anonId])

  const fetchCounts = useCallback(async () => {
    const [{ count: views }, { count: likes }, { count: dislikes }] = await Promise.all([
      supabase.from('post_views').select('*', { count: 'exact', head: true }).eq('post_id', id),
      supabase.from('post_reactions').select('*', { count: 'exact', head: true }).eq('post_id', id).eq('reaction', 'LIKE'),
      supabase.from('post_reactions').select('*', { count: 'exact', head: true }).eq('post_id', id).eq('reaction', 'DISLIKE'),
    ])
    setViewCount(views ?? 0)
    setLikeCount(likes ?? 0)
    setDislikeCount(dislikes ?? 0)

    if (anonId) {
      const { data } = await supabase
        .from('post_reactions')
        .select('reaction')
        .eq('post_id', id)
        .eq('user_id', anonId)
        .maybeSingle()
      setMyReaction((data?.reaction as 'LIKE' | 'DISLIKE') ?? null)
    }
  }, [id, anonId])

  const handleReaction = async (type: 'LIKE' | 'DISLIKE') => {
    if (!anonId) { toast.error('로그인이 필요합니다'); return }
    setReactionLoading(true)
    if (myReaction === type) {
      await supabase.from('post_reactions').delete().eq('post_id', id).eq('user_id', anonId)
      setMyReaction(null)
    } else {
      await supabase.from('post_reactions').upsert({ post_id: Number(id), user_id: anonId, reaction: type })
      setMyReaction(type)
    }
    await fetchCounts()
    setReactionLoading(false)
  }

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*,profiles(nickname)')
      .eq('post_id', id)
      .order('created_at', { ascending: true })

    if (error) { toast.error('댓글을 불러오지 못했습니다'); return }
    if (data) {
      const topLevel: Comment[] = []
      const replyMap = new Map<number, Comment[]>()

      for (const c of data as Comment[]) {
        if (c.parent_id) {
          const replies = replyMap.get(c.parent_id) || []
          replies.push(c)
          replyMap.set(c.parent_id, replies)
        } else {
          topLevel.push({ ...c, replies: [] })
        }
      }

      for (const c of topLevel) {
        c.replies = replyMap.get(c.id) || []
      }

      setComments(topLevel)
    }
  }, [id])

  useEffect(() => {
    fetchPost()
    fetchComments()
    fetchCounts()
    recordView()
  }, [fetchPost, fetchComments, fetchCounts, recordView])

  const handleSendComment = async () => {
    if (!user || !commentText.trim()) return
    setSending(true)

    const { error } = await supabase.from('comments').insert({
      post_id: Number(id),
      parent_id: replyTarget?.id ?? null,
      author_id: anonId!,
      content: commentText.trim(),
    })

    if (error) {
      toast.error('댓글 작성에 실패했습니다')
    } else {
      setCommentText('')
      setReplyTarget(null)
      fetchComments()
      fetchPost()
    }
    setSending(false)
  }

  const handleDeletePost = async () => {
    setConfirmAction({
      message: '게시글을 삭제하시겠습니까?',
      action: async () => {
        await supabase.from('posts').delete().eq('id', id)
        router.push('/board')
      },
    })
  }

  const handleDeleteComment = async (commentId: number) => {
    setConfirmAction({
      message: '댓글을 삭제하시겠습니까?',
      action: async () => {
        await supabase
          .from('comments')
          .update({ is_deleted: true })
          .eq('id', commentId)
        fetchComments()
        setConfirmAction(null)
      },
    })
  }

  const handleReport = async (reason: ReportReason) => {
    if (!user || !reportTarget) return
    setReportLoading(true)

    const { error } = await supabase.from('reports').insert({
      reporter_id: anonId!,
      content_type: reportTarget.type,
      content_id: reportTarget.id,
      target_author_id: reportTarget.authorId,
      reason,
    })

    if (error?.code === '23505') {
      toast.error(reportTarget.type === 'post' ? '이미 신고한 게시글입니다' : '이미 신고한 댓글입니다')
    } else if (!error) {
      toast.success('신고가 접수되었습니다')
    }

    setReportLoading(false)
    setReportTarget(null)
  }

  const handleBlock = async (blockedId: string) => {
    if (!user) return
    setConfirmAction({
      message: '이 사용자를 차단하시겠습니까? 차단 시 해당 사용자의 글이 보이지 않습니다.',
      action: async () => {
        const { error } = await supabase.from('blocks').insert({
          blocker_id: anonId!,
          blocked_id: blockedId,
        })
        if (error?.code === '23505') {
          toast.error('이미 차단한 사용자입니다')
        } else if (!error) {
          toast.success('사용자를 차단했습니다')
          router.push('/board')
        }
        setConfirmAction(null)
      },
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }
  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Frown className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">게시글을 찾을 수 없습니다</p>
      </div>
    )
  }

  const isOwn = anonId === post.author_id
  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)

  return (
    <div className="pb-24">
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxUrl(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setLightboxUrl(null)}
            aria-label="닫기"
          >
            <X className="w-8 h-8" />
          </Button>
          <div className="relative max-w-3xl max-h-[90vh] w-full h-full" onClick={e => e.stopPropagation()}>
            <Image
              src={lightboxUrl}
              alt="원본 이미지"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>확인</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction?.action}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report dialog */}
      {reportTarget && (
        <ReportDialog
          onSubmit={handleReport}
          onClose={() => setReportTarget(null)}
          loading={reportLoading}
        />
      )}

      {/* Post */}
      <div className="bg-card rounded-2xl border p-5 sm:p-7 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${colorClass(getCategoryColor(post.category))}`}>
            {getCategoryLabel(post.category)}
          </span>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwn ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/board/${post.id}/edit`} className="flex items-center gap-2">
                        <Pencil className="w-4 h-4" />
                        수정
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDeletePost}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => setReportTarget({ type: 'post', id: post.id, authorId: post.author_id })}
                    >
                      <TriangleAlert className="w-4 h-4 mr-2" />
                      신고
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBlock(post.author_id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      차단
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-3">{post.title}</h1>

        <div className="flex items-center gap-2.5 mb-5 pb-5 border-b">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold">
              {(post.profiles?.nickname ?? '?')[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{post.profiles?.nickname ?? '알 수 없음'}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{formatRelativeTime(post.created_at)}</span>
              {viewCount > 0 && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3.5 h-3.5" />
                    조회 {viewCount}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-foreground/80 whitespace-pre-wrap leading-relaxed text-[15px] mb-6">
          <LinkableText text={post.content} />
        </div>

        {/* Image gallery */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.image_urls.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightboxUrl(url)}
                className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden border hover:opacity-90 transition-opacity"
              >
                <Image
                  src={url}
                  alt={`이미지 ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 112px, 144px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Like / Dislike */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            variant={myReaction === 'LIKE' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => handleReaction('LIKE')}
            disabled={reactionLoading}
            className="gap-1.5"
          >
            <ThumbsUp className="w-4 h-4" fill={myReaction === 'LIKE' ? 'currentColor' : 'none'} />
            좋아요 {likeCount > 0 && <span>{likeCount}</span>}
          </Button>
          <Button
            variant={myReaction === 'DISLIKE' ? 'destructive' : 'secondary'}
            size="sm"
            onClick={() => handleReaction('DISLIKE')}
            disabled={reactionLoading}
            className="gap-1.5"
          >
            <ThumbsDown className="w-4 h-4" fill={myReaction === 'DISLIKE' ? 'currentColor' : 'none'} />
            싫어요 {dislikeCount > 0 && <span>{dislikeCount}</span>}
          </Button>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-card rounded-2xl border p-5 sm:p-7">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <MessageCircle className="w-4.5 h-4.5 text-muted-foreground" />
          댓글 {totalComments}개
        </h2>

        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">첫 번째 댓글을 남겨보세요</p>
          </div>
        ) : (
          <div className="divide-y">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={anonId ?? null}
                onReply={setReplyTarget}
                onDelete={handleDeleteComment}
                onReport={(type, contentId, authorId) =>
                  setReportTarget({ type, id: contentId, authorId })
                }
                onBlock={handleBlock}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment input (fixed bottom) */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0">
          <div className="max-w-4xl mx-auto">
            <CommentInput
              value={commentText}
              onChange={setCommentText}
              onSubmit={handleSendComment}
              replyTarget={replyTarget}
              onCancelReply={() => setReplyTarget(null)}
              loading={sending}
            />
          </div>
        </div>
      )}
    </div>
  )
}
