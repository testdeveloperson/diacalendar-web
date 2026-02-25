'use client'

import Link from 'next/link'
import { Post, getCommentCount, formatRelativeTime, colorClass } from '@/lib/types'
import { useCategories } from '@/hooks/useCategories'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Eye, ThumbsUp, ThumbsDown, ImageIcon } from 'lucide-react'

interface PostCardProps {
  post: Post
  isNew?: boolean
}

export default function PostCard({ post, isNew }: PostCardProps) {
  const commentCount = getCommentCount(post)
  const { getCategoryLabel, getCategoryColor } = useCategories()

  return (
    <Link href={`/board/${post.id}`} prefetch={false} className="block group">
      <div className="bg-card rounded-xl border p-4 sm:p-5 hover:shadow-md hover:border-border/80 transition-all duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${colorClass(getCategoryColor(post.category))}`}>
                {getCategoryLabel(post.category)}
              </span>
              {isNew && (
                <Badge variant="destructive" className="text-xs px-2 py-0.5 font-bold">
                  N
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-foreground mb-1.5 line-clamp-1 group-hover:text-primary transition-colors text-base">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{post.content}</p>
          </div>

          {commentCount > 0 && (
            <div className="flex-shrink-0 flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
              <MessageCircle className="w-3.5 h-3.5" />
              {commentCount}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
            {(post.profiles?.nickname ?? '?')[0]}
          </div>
          <span className="font-medium">{post.profiles?.nickname ?? '알 수 없음'}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{formatRelativeTime(post.created_at)}</span>
          {(post.view_count ?? 0) > 0 && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" />
                {post.view_count}
              </span>
            </>
          )}
          {(post.like_count ?? 0) > 0 && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="flex items-center gap-0.5">
                <ThumbsUp className="w-3 h-3" />
                {post.like_count}
              </span>
            </>
          )}
          {(post.dislike_count ?? 0) > 0 && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="flex items-center gap-0.5">
                <ThumbsDown className="w-3 h-3" />
                {post.dislike_count}
              </span>
            </>
          )}
          {(post.image_urls?.length ?? 0) > 0 && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="flex items-center gap-0.5">
                <ImageIcon className="w-3 h-3" />
                {post.image_urls!.length}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
