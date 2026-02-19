'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCategoryLabel, formatRelativeTime } from '@/lib/types'

interface AdminPost {
  id: number
  title: string
  category: string
  created_at: string
  profiles: { nickname: string } | null
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const showSnackbar = (msg: string) => {
    setSnackbar(msg)
    setTimeout(() => setSnackbar(null), 3000)
  }

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select('id,title,category,created_at,profiles(nickname)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (categoryFilter) query = query.eq('category', categoryFilter)
    if (search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,content.ilike.%${search.trim()}%`)
    }

    const { data } = await query
    setPosts((data as unknown as AdminPost[]) ?? [])
    setLoading(false)
  }, [search, categoryFilter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDelete = async (postId: number) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      showSnackbar('삭제 실패: ' + error.message)
    } else {
      showSnackbar('게시글이 삭제되었습니다')
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
    setConfirmDelete(null)
  }

  const handleCategoryChange = async (postId: number, newCategory: string) => {
    const { error } = await supabase.from('posts').update({ category: newCategory }).eq('id', postId)
    if (!error) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, category: newCategory } : p))
      showSnackbar('카테고리가 변경되었습니다')
    }
  }

  return (
    <div>
      {snackbar && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm z-50 shadow-xl">
          {snackbar}
        </div>
      )}

      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <p className="text-gray-700 mb-6">이 게시글을 삭제하시겠습니까? 댓글도 함께 삭제됩니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">취소</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 검색 + 필터 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchPosts()}
          placeholder="제목 검색..."
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체</option>
          <option value="FREE">자유게시판</option>
          <option value="QA">Q&A</option>
        </select>
        <button onClick={fetchPosts} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          검색
        </button>
      </div>

      {/* 게시글 목록 */}
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold text-gray-500 bg-gray-50 px-4 py-3 border-b border-gray-100">
          <span>제목</span>
          <span className="px-3">카테고리</span>
          <span className="px-3">작성자</span>
          <span className="px-3">날짜</span>
          <span className="px-3">삭제</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">게시글이 없습니다</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map(post => (
              <div key={post.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-0 px-4 py-3 hover:bg-gray-50">
                <Link href={`/board/${post.id}`} target="_blank" className="text-sm text-gray-800 hover:text-blue-600 truncate pr-3">
                  {post.title}
                </Link>
                <div className="px-3">
                  <select
                    value={post.category}
                    onChange={e => handleCategoryChange(post.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full font-semibold border-0 cursor-pointer focus:outline-none ${
                      post.category === 'FREE' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'
                    }`}
                  >
                    <option value="FREE">자유게시판</option>
                    <option value="QA">Q&A</option>
                  </select>
                </div>
                <span className="px-3 text-xs text-gray-500 whitespace-nowrap">{post.profiles?.nickname ?? '알 수 없음'}</span>
                <span className="px-3 text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(post.created_at)}</span>
                <div className="px-3">
                  <button
                    onClick={() => setConfirmDelete(post.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-right">최대 100개 표시 · 카테고리는 셀렉트박스에서 바로 변경 가능</p>
    </div>
  )
}
