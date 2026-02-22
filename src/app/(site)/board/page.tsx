'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { Post } from '@/lib/types'
import CategoryFilter from '@/components/CategoryFilter'
import PostCard from '@/components/PostCard'

const PAGE_SIZE = 20
const POST_SELECT = 'id,author_id,title,content,category,created_at,image_urls,profiles(nickname),comments(count),post_views(count),post_reactions(reaction)'
const LAST_VISITED_KEY = 'board_last_visited_at'

type SortKey = 'latest' | 'views' | 'likes' | 'dislikes'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'views', label: '조회순' },
  { key: 'likes', label: '좋아요순' },
  { key: 'dislikes', label: '싫어요순' },
]

export default function BoardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { categories } = useCategories()
  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('latest')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('guidelines_accepted') === 'true' : false
  )
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [newPostCount, setNewPostCount] = useState(0)
  const [fetchError, setFetchError] = useState(false)
  const lastVisited = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(LAST_VISITED_KEY) : null
  )[0]
  const offsetRef = useRef(0)

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBlockedIds(prev => prev.size > 0 ? new Set() : prev)
      return
    }
    supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id)
      .then(({ data }) => {
        if (data) setBlockedIds(new Set(data.map(b => b.blocked_id)))
      })
  }, [user])

  // 페이지 떠날 때 마지막 방문 시간 갱신
  useEffect(() => {
    const updateVisitTime = () => {
      localStorage.setItem(LAST_VISITED_KEY, new Date().toISOString())
    }
    window.addEventListener('beforeunload', updateVisitTime)
    return () => {
      window.removeEventListener('beforeunload', updateVisitTime)
      updateVisitTime()
    }
  }, [])

  const fetchPosts = useCallback(async (reset = true) => {
    if (reset) {
      setLoading(true)
      offsetRef.current = 0
    } else {
      setLoadingMore(true)
    }

    // 조회수/좋아요/싫어요 정렬은 클라이언트 정렬이 필요하므로 전체 로드
    const isClientSort = sortKey !== 'latest'
    const rangeEnd = isClientSort
      ? offsetRef.current + PAGE_SIZE * 5 - 1  // 더 많이 가져와서 클라이언트 정렬
      : offsetRef.current + PAGE_SIZE - 1

    let query = supabase
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
      .range(offsetRef.current, rangeEnd)

    if (category) {
      query = query.eq('category', category)
    }

    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery.trim()}%,content.ilike.%${searchQuery.trim()}%`)
    }

    const { data, error } = await query

    if (error) {
      if (reset) setFetchError(true)
      setLoading(false)
      setLoadingMore(false)
      return
    }

    setFetchError(false)
    if (data) {
      const rawPosts = data as unknown as Post[]
      rawPosts.forEach(p => {
        p.view_count = (p.post_views as unknown as { count: number }[])?.[0]?.count ?? 0
        const reactions = p.post_reactions as unknown as { reaction: string }[]
        p.like_count = reactions?.filter(r => r.reaction === 'LIKE').length ?? 0
        p.dislike_count = reactions?.filter(r => r.reaction === 'DISLIKE').length ?? 0
      })

      // 클라이언트 정렬
      if (sortKey === 'views') {
        rawPosts.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
      } else if (sortKey === 'likes') {
        rawPosts.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0))
      } else if (sortKey === 'dislikes') {
        rawPosts.sort((a, b) => (b.dislike_count ?? 0) - (a.dislike_count ?? 0))
      }

      const filtered = rawPosts.filter(p => !blockedIds.has(p.author_id))
      if (reset) {
        setPosts(filtered)
        // 마지막 방문 이후 새 글 카운트 (카테고리/검색/정렬 필터 없을 때만)
        if (!category && !searchQuery.trim() && sortKey === 'latest' && lastVisited) {
          const newCount = filtered.filter(
            p => new Date(p.created_at) > new Date(lastVisited)
          ).length
          setNewPostCount(newCount)
        } else {
          setNewPostCount(0)
        }
      } else {
        setPosts(prev => [...prev, ...filtered])
      }
      setHasMore(data.length === (isClientSort ? PAGE_SIZE * 5 : PAGE_SIZE))
      offsetRef.current += data.length
    }

    setLoading(false)
    setLoadingMore(false)
  }, [category, searchQuery, sortKey, blockedIds, lastVisited])


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts(true)
  }, [fetchPosts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPosts(true)
  }

  const selectedCategory = category ? categories.find(c => c.id === category) : null

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">로그인이 필요합니다</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">커뮤니티는 임직원 전용 서비스입니다</p>
        <Link
          href="/auth/login"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          로그인하기
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Guidelines dialog */}
      {showGuidelines && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-slideUp">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-center dark:text-gray-100">커뮤니티 이용 규칙</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center mb-5">쾌적한 커뮤니티를 위해 아래 규칙을 지켜주세요</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-3 mb-6">
              {[
                '욕설, 비방, 혐오 표현을 금지합니다.',
                '스팸, 광고성 글을 금지합니다.',
                '개인정보를 포함한 글을 금지합니다.',
                '타인의 저작권을 침해하는 글을 금지합니다.',
                '규칙 위반 시 글이 삭제될 수 있습니다.',
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
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
      <div className="flex items-center justify-between gap-3 mb-3">
        <CategoryFilter selected={category} onChange={setCategory} />
        <button
          onClick={() => setIsSearchMode(!isSearchMode)}
          className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${
            isSearchMode ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          aria-label="검색"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Category description banner */}
      {selectedCategory?.description && (
        <div className="flex items-start gap-2.5 px-4 py-3 mb-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCategory.description}</p>
        </div>
      )}

      {/* Sort options */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors ${
              sortKey === opt.key
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
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
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
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

      {/* Post list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">게시글을 불러오지 못했습니다</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">네트워크 상태를 확인해주세요</p>
          <button
            onClick={() => fetchPosts(true)}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400 dark:text-gray-500 font-medium">게시글이 없습니다</p>
          <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">첫 번째 글을 작성해보세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {newPostCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              지난 방문 이후 새 글 {newPostCount}개가 등록되었습니다
            </div>
          )}
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              isNew={
                !!lastVisited &&
                new Date(post.created_at) > new Date(lastVisited)
              }
            />
          ))}

          {hasMore && (
            <button
              onClick={() => fetchPosts(false)}
              disabled={loadingMore}
              className="w-full py-3.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl disabled:opacity-50 transition-colors"
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
