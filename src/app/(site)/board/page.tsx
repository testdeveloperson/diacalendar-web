'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { Post } from '@/lib/types'
import CategoryFilter from '@/components/CategoryFilter'
import PostCard from '@/components/PostCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Lock, Search, Info, AlertCircle, FileText, Plus } from 'lucide-react'

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
  const { user, anonId, isLoading: authLoading } = useAuth()
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
    if (!anonId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBlockedIds(prev => prev.size > 0 ? new Set() : prev)
      return
    }
    supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', anonId)
      .then(({ data }) => {
        if (data) setBlockedIds(new Set(data.map(b => b.blocked_id)))
      })
  }, [anonId])

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

    const isClientSort = sortKey !== 'latest'
    const rangeEnd = isClientSort
      ? offsetRef.current + PAGE_SIZE * 5 - 1
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
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-5">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">로그인이 필요합니다</h2>
        <p className="text-sm text-muted-foreground mb-6">커뮤니티는 로그인 후 이용 가능합니다</p>
        <Button asChild>
          <Link href="/auth/login">로그인하기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Guidelines dialog */}
      <Dialog open={showGuidelines} onOpenChange={setShowGuidelines}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>커뮤니티 이용 규칙</DialogTitle>
            <DialogDescription>쾌적한 커뮤니티를 위해 아래 규칙을 지켜주세요</DialogDescription>
          </DialogHeader>
          <ul className="text-sm text-muted-foreground space-y-3">
            {[
              '욕설, 비방, 혐오 표현을 금지합니다.',
              '스팸, 광고성 글을 금지합니다.',
              '개인정보를 포함한 글을 금지합니다.',
              '타인의 저작권을 침해하는 글을 금지합니다.',
              '규칙 위반 시 글이 삭제될 수 있습니다.',
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                {rule}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                localStorage.setItem('guidelines_accepted', 'true')
                setGuidelinesAccepted(true)
                setShowGuidelines(false)
              }}
            >
              동의합니다
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category filter + Search */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <CategoryFilter selected={category} onChange={setCategory} />
        <Button
          variant={isSearchMode ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setIsSearchMode(!isSearchMode)}
          aria-label="검색"
        >
          <Search className="w-5 h-5" />
        </Button>
      </div>

      {/* Category description banner */}
      {selectedCategory?.description && (
        <div className="flex items-start gap-2.5 px-4 py-3 mb-3 bg-muted/50 rounded-xl border">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
        </div>
      )}

      {/* Sort options */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto">
        {SORT_OPTIONS.map(opt => (
          <Button
            key={opt.key}
            variant={sortKey === opt.key ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setSortKey(opt.key)}
            className="text-xs flex-shrink-0"
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Search bar */}
      {isSearchMode && (
        <form onSubmit={handleSearch} className="mb-5">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="제목 또는 내용으로 검색"
                className="pl-10"
                autoFocus
              />
            </div>
            <Button type="submit">검색</Button>
          </div>
        </form>
      )}

      {/* Post list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-foreground font-medium mb-1">게시글을 불러오지 못했습니다</p>
          <p className="text-sm text-muted-foreground mb-4">네트워크 상태를 확인해주세요</p>
          <Button onClick={() => fetchPosts(true)}>다시 시도</Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">게시글이 없습니다</p>
          <p className="text-sm text-muted-foreground/70 mt-1">첫 번째 글을 작성해보세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {newPostCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium">
              <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
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
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => fetchPosts(false)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  불러오는 중...
                </span>
              ) : '더 보기'}
            </Button>
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
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg flex items-center justify-center hover:opacity-90 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </Link>
      )}
    </div>
  )
}
