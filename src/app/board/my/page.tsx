'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Post, getCommentCount, formatRelativeTime, colorClass } from '@/lib/types'
import { useCategories } from '@/hooks/useCategories'

export default function MyPostsPage() {
  const { user } = useAuth()
  const { getCategoryLabel, getCategoryColor } = useCategories()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data } = await supabase
        .from('posts')
        .select('id,author_id,title,content,category,created_at,profiles(nickname),comments(count)')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setPosts(data as unknown as Post[])
      setLoading(false)
    }
    fetch()
  }, [user])

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const handleDelete = async (postId: number) => {
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
    setDeleteTarget(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">내 글 목록</h1>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-slideUp">
            <p className="text-gray-700 mb-6">게시글을 삭제하시겠습니까?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 shadow-sm"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">작성한 글이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 hover:shadow-sm transition-shadow">
              <Link href={`/board/${post.id}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${colorClass(getCategoryColor(post.category))}`}>
                    {getCategoryLabel(post.category)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.content}</p>
              </Link>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{formatRelativeTime(post.created_at)}</span>
                  {getCommentCount(post) > 0 && (
                    <span className="flex items-center gap-1 text-blue-500 font-medium">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {getCommentCount(post)}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Link
                    href={`/board/${post.id}/edit`}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    수정
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(post.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
