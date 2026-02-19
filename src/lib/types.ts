export type BoardCategory = 'FREE' | 'QA'

export const BOARD_CATEGORIES: { value: BoardCategory | null; label: string }[] = [
  { value: null, label: '전체' },
  { value: 'FREE', label: '자유게시판' },
  { value: 'QA', label: 'Q&A' },
]

export interface Post {
  id: number
  author_id: string
  title: string
  content: string
  category: BoardCategory
  created_at: string
  profiles: { nickname: string } | null
  comments: { count: number }[]
  post_views?: { count: number }[]
  post_reactions?: { count: number }[]
  view_count?: number
  like_count?: number
  dislike_count?: number
}

export interface Comment {
  id: number
  post_id: number
  parent_id: number | null
  author_id: string
  content: string
  is_deleted: boolean
  created_at: string
  profiles: { nickname: string } | null
  replies?: Comment[]
}

export type ReportReason = 'SPAM' | 'ABUSE' | 'INAPPROPRIATE' | 'OTHER'

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: '스팸/광고' },
  { value: 'ABUSE', label: '욕설/비방' },
  { value: 'INAPPROPRIATE', label: '부적절한 콘텐츠' },
  { value: 'OTHER', label: '기타' },
]

export interface BlockedUser {
  id: number
  blocker_id: string
  blocked_id: string
  created_at: string
  profiles: { nickname: string } | null
}

export function getCommentCount(post: Post): number {
  return post.comments?.[0]?.count ?? 0
}

export function getCategoryLabel(category: BoardCategory): string {
  return category === 'FREE' ? '자유게시판' : 'Q&A'
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`

  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}
