'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Post, BoardCategory } from '@/lib/types'
import CategoryFilter from '@/components/CategoryFilter'
import PostCard from '@/components/PostCard'

const PAGE_SIZE = 20
const POST_SELECT = 'id,author_id,title,content,category,created_at,profiles(nickname),comments(count)'

export default function BoardPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState<BoardCategory | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const offsetRef = useRef(0)

  useEffect(() => {
    if (!user) { setBlockedIds(new Set()); return }
    supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id)
      .then(({ data }) => {
        if (data) setBlockedIds(new Set(data.map(b => b.blocked_id)))
      })
  }, [user])

  useEffect(() => {
    setGuidelinesAccepted(localStorage.getItem('guidelines_accepted') === 'true')
  }, [])

  const fetchPosts = useCallback(async (reset = true) => {
    if (reset) {
      setLoading(true)
      offsetRef.current = 0
    } else {
      setLoadingMore(true)
    }

    let query = supabase
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
      .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1)

    if (category) {
      query = query.eq('category', category)
    }

    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery.trim()}%,content.ilike.%${searchQuery.trim()}%`)
    }

    const { data, error } = await query

    if (!error && data) {
      const filtered = (data as unknown as Post[]).filter(p => !blockedIds.has(p.author_id))
      if (reset) {
        setPosts(filtered)
      } else {
        setPosts(prev => [...prev, ...filtered])
      }
      setHasMore(data.length === PAGE_SIZE)
      offsetRef.current += data.length
    }

    setLoading(false)
    setLoadingMore(false)
  }, [category, searchQuery, blockedIds])

  useEffect(() => {
    fetchPosts(true)
  }, [fetchPosts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPosts(true)
  }

  return (
    <div>
      {/* Guidelines dialog */}
      {showGuidelines && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-slideUp">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-center">커뮤니티 이용 규칙</h2>
            <p className="text-sm text-gray-400 text-center mb-5">쾌적한 커뮤니티를 위해 아래 규칙을 지켜주세요</p>
            <ul className="text-sm text-gray-600 space-y-3 mb-6">
              {[
                '욕설, 비방, 혐오 표현을 금지합니다.',
                '스팸, 광고성 글을 금지합니다.',
                '개인정보를 포함한 글을 금지합니다.',
                '타인의 저작권을 침해하는 글을 금지합니다.',
                '규칙 위반 시 글이 삭제될 수 있습니다.',
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {rule}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                localStorage.setItem('guidelines_accepted', 'true')
                setGuidelinesAccepted(true)
                setShowGuidelines(false)
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-sm"
            >
              동의합니다
            </button>
          </div>
        </div>
      )}

      {/* Category filter + Search */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <CategoryFilter selected={category} onChange={setCategory} />
        <button
          onClick={() => setIsSearchMode(!isSearchMode)}
          className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${
            isSearchMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          }`}
          aria-label="검색"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Search bar */}
      {isSearchMode && (
        <form onSubmit={handleSearch} className="mb-5">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="제목 또는 내용으로 검색"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm placeholder-gray-400"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm"
            >
              검색
            </button>
          </div>
        </form>
      )}

      {/* Login banner */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 mb-5 border border-blue-100/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">글쓰기와 댓글을 작성하려면 로그인이 필요합니다</p>
              <Link href="/auth/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                로그인하기 &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Post list */}
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
          <p className="text-gray-400 font-medium">게시글이 없습니다</p>
          <p className="text-sm text-gray-300 mt-1">첫 번째 글을 작성해보세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasMore && (
            <button
              onClick={() => fetchPosts(false)}
              disabled={loadingMore}
              className="w-full py-3.5 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-50 transition-colors"
            >
              {loadingMore ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  불러오는 중...
                </span>
              ) : '더 보기'}
            </button>
          )}
        </div>
      )}

      {/* Write FAB */}
      {user && (
        <Link
          href={guidelinesAccepted ? '/board/write' : '#'}
          onClick={e => {
            if (!guidelinesAccepted) {
              e.preventDefault()
              setShowGuidelines(true)
            }
          }}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      )}
    </div>
  )
}
