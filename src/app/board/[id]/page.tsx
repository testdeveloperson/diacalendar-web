'use client'

export const runtime = 'edge'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Post, Comment, ReportReason, getCategoryLabel, formatRelativeTime } from '@/lib/types'
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
  const { user } = useAuth()
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

  const showSnackbar = (msg: string) => {
    setSnackbar(msg)
    setTimeout(() => setSnackbar(null), 3000)
  }

  const fetchPost = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('id,author_id,title,content,category,created_at,profiles(nickname),comments(count)')
      .eq('id', id)
      .single()

    if (data) setPost(data as unknown as Post)
    setLoading(false)
  }, [id])

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*,profiles(nickname)')
      .eq('post_id', id)
      .order('created_at', { ascending: true })

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
  }, [fetchPost, fetchComments])

  const handleSendComment = async () => {
    if (!user || !commentText.trim()) return
    setSending(true)

    const { error } = await supabase.from('comments').insert({
      post_id: Number(id),
      parent_id: replyTarget?.id ?? null,
      author_id: user.id,
      content: commentText.trim(),
    })

    if (!error) {
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
      reporter_id: user.id,
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
          blocker_id: user.id,
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

  const isOwn = user?.id === post.author_id
  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)

  return (
    <div className="pb-24">
      {/* Snackbar */}
      {snackbar && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm z-50 shadow-xl animate-slideUp">
          {snackbar}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-slideUp">
            <p className="text-gray-700 mb-6 leading-relaxed">{confirmAction.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
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
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-7 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            post.category === 'FREE'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-violet-50 text-violet-600'
          }`}>
            {getCategoryLabel(post.category)}
          </span>

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
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
                  <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-200/60 py-2 z-50 min-w-[140px] animate-slideUp">
                    {isOwn ? (
                      <>
                        <Link
                          href={`/board/${post.id}/edit`}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
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
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
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

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{post.title}</h1>

        <div className="flex items-center gap-2.5 mb-5 pb-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-bold">
            {(post.profiles?.nickname ?? '?')[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{post.profiles?.nickname ?? '알 수 없음'}</p>
            <p className="text-xs text-gray-400">{formatRelativeTime(post.created_at)}</p>
          </div>
        </div>

        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-[15px]">
          <LinkableText text={post.content} />
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-7">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-4.5 h-4.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          댓글 {totalComments}개
        </h2>

        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">첫 번째 댓글을 남겨보세요</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={user?.id ?? null}
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
