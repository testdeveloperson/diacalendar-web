'use client'

import Link from 'next/link'
import { Post, getCommentCount, formatRelativeTime, colorClass } from '@/lib/types'
import { useCategories } from '@/hooks/useCategories'

interface PostCardProps {
  post: Post
  isNew?: boolean
}

export default function PostCard({ post, isNew }: PostCardProps) {
  const commentCount = getCommentCount(post)
  const { getCategoryLabel, getCategoryColor } = useCategories()

  return (
    <Link href={`/board/${post.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 hover:shadow-md hover:border-gray-300/80 transition-all duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${colorClass(getCategoryColor(post.category))}`}>
                {getCategoryLabel(post.category)}
              </span>
              {isNew && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-500 text-white">
                  N
                </span>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors text-base">
              {post.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.content}</p>
          </div>

          {commentCount > 0 && (
            <div className="flex-shrink-0 flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {commentCount}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
            {(post.profiles?.nickname ?? '?')[0]}
          </div>
          <span className="font-medium text-gray-500">{post.profiles?.nickname ?? '알 수 없음'}</span>
          <span className="text-gray-300">·</span>
          <span>{formatRelativeTime(post.created_at)}</span>
          {(post.view_count ?? 0) > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {post.view_count}
              </span>
            </>
          )}
          {(post.like_count ?? 0) > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                  <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
                </svg>
                {post.like_count}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
