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
          className="text-blue-600 underline hover:text-blue-800"
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: number; authorId: string } | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  const [confirmAction, setConfirmAction] = useState<{ message: string; action: () => void } | null>(null)

  const [viewCount, setViewCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [dislikeCount, setDislikeCount] = useState(0)
  const [myReaction, setMyReaction] = useState<'LIKE' | 'DISLIKE' | null>(null)
  const [reactionLoading, setReactionLoading] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const showSnackbar = (msg: string) => {
    setSnackbar(msg)
    setTimeout(() => setSnackbar(null), 3000)
  }

  const fetchPost = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('id,author_id,title,content,category,created_at,image_urls,profiles(nickname),comments(count)')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = 게시글 없음(정상적 404), 그 외는 네트워크/서버 오류
      showSnackbar('게시글을 불러오지 못했습니다')
    }
    if (data) setPost(data as unknown as Post)
    setLoading(false)
  }, [id])

  const recordView = useCallback(async () => {
    if (!anonId) return
    // 중복 시 unique 제약으로 자동 무시
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
    if (!anonId) { showSnackbar('로그인이 필요합니다'); return }
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

    if (error) { showSnackbar('댓글을 불러오지 못했습니다'); return }
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
      showSnackbar('댓글 작성에 실패했습니다')
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
      showSnackbar(reportTarget.type === 'post' ? '이미 신고한 게시글입니다' : '이미 신고한 댓글입니다')
    } else if (!error) {
      showSnackbar('신고가 접수되었습니다')
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
          showSnackbar('이미 차단한 사용자입니다')
        } else if (!error) {
          showSnackbar('사용자를 차단했습니다')
          router.push('/board')
        }
        setConfirmAction(null)
      },
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }
  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-400 font-medium">게시글을 찾을 수 없습니다</p>
      </div>
    )
  }

  const isOwn = anonId === post.author_id
  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)

  return (
    <div className="pb-24">
      {/* Snackbar */}
      {snackbar && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm z-50 shadow-xl animate-slideUp">
          {snackbar}
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightboxUrl(null)}
            aria-label="닫기"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-slideUp">
            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">{confirmAction.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300"
              >
                취소
              </button>
              <button
                onClick={confirmAction.action}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 shadow-sm"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report dialog */}
      {reportTarget && (
        <ReportDialog
          onSubmit={handleReport}
          onClose={() => setReportTarget(null)}
          loading={reportLoading}
        />
      )}

      {/* Post */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-white/10 p-5 sm:p-7 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${colorClass(getCategoryColor(post.category))}`}>
            {getCategoryLabel(post.category)}
          </span>

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-10 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200/60 dark:border-white/10 py-2 z-50 min-w-[140px] animate-slideUp">
                    {isOwn ? (
                      <>
                        <Link
                          href={`/board/${post.id}/edit`}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => setMenuOpen(false)}
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          수정
                        </Link>
                        <button
                          onClick={() => { setMenuOpen(false); handleDeletePost() }}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          삭제
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setMenuOpen(false)
                            setReportTarget({ type: 'post', id: post.id, authorId: post.author_id })
                          }}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          신고
                        </button>
                        <button
                          onClick={() => { setMenuOpen(false); handleBlock(post.author_id) }}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          차단
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{post.title}</h1>

        <div className="flex items-center gap-2.5 mb-5 pb-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-bold">
            {(post.profiles?.nickname ?? '?')[0]}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{post.profiles?.nickname ?? '알 수 없음'}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              <span>{formatRelativeTime(post.created_at)}</span>
              {viewCount > 0 && (
                <>
                  <span className="text-gray-200 dark:text-gray-700">·</span>
                  <span className="flex items-center gap-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    조회 {viewCount}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-[15px] mb-6">
          <LinkableText text={post.content} />
        </div>

        {/* 이미지 갤러리 */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.image_urls.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightboxUrl(url)}
                className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity"
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

        {/* 좋아요 / 싫어요 */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => handleReaction('LIKE')}
            disabled={reactionLoading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              myReaction === 'LIKE'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600'
            } disabled:opacity-60`}
          >
            <svg className="w-4 h-4" fill={myReaction === 'LIKE' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={myReaction === 'LIKE' ? 0 : 2} viewBox="0 0 24 24">
              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
              <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
            </svg>
            좋아요 {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button
            onClick={() => handleReaction('DISLIKE')}
            disabled={reactionLoading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              myReaction === 'DISLIKE'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-500'
            } disabled:opacity-60`}
          >
            <svg className="w-4 h-4" fill={myReaction === 'DISLIKE' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={myReaction === 'DISLIKE' ? 0 : 2} viewBox="0 0 24 24">
              <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
              <path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
            </svg>
            싫어요 {dislikeCount > 0 && <span>{dislikeCount}</span>}
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-white/10 p-5 sm:p-7">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          댓글 {totalComments}개
        </h2>

        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 dark:text-gray-500">첫 번째 댓글을 남겨보세요</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
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
