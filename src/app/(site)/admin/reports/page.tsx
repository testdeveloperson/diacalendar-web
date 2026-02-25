'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Trash2, Check } from 'lucide-react'

interface AdminReport {
  id: number
  content_type: 'post' | 'comment'
  content_id: number
  reason: string
  created_at: string
  reporter_id: string
  target_author_id: string
  reporter_nickname?: string
  target_nickname?: string
}

const REASON_MAP: Record<string, string> = {
  SPAM: '스팸/광고',
  ABUSE: '욕설/비방',
  INAPPROPRIATE: '부적절',
  OTHER: '기타',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('reports')
      .select('id,content_type,content_id,reason,created_at,reporter_id,target_author_id')
      .order('created_at', { ascending: false })
      .limit(200)

    if (typeFilter) query = query.eq('content_type', typeFilter)

    const { data } = await query
    if (!data) { setLoading(false); return }

    const rawReports = data as AdminReport[]

    const userIds = [...new Set([
      ...rawReports.map(r => r.reporter_id),
      ...rawReports.map(r => r.target_author_id),
    ])]

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,nickname')
      .in('id', userIds)

    const nicknameMap = new Map((profiles ?? []).map(p => [p.id, p.nickname]))

    setReports(rawReports.map(r => ({
      ...r,
      reporter_nickname: nicknameMap.get(r.reporter_id) ?? '알 수 없음',
      target_nickname: nicknameMap.get(r.target_author_id) ?? '알 수 없음',
    })))
    setLoading(false)
  }, [typeFilter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleDeleteContent = async (report: AdminReport) => {
    const { error } = report.content_type === 'post'
      ? await supabase.from('posts').delete().eq('id', report.content_id)
      : await supabase.from('comments').update({ is_deleted: true }).eq('id', report.content_id)

    if (error) {
      toast.error('처리 실패: ' + error.message)
    } else {
      await supabase.from('reports')
        .delete()
        .eq('content_type', report.content_type)
        .eq('content_id', report.content_id)
      toast.success(report.content_type === 'post' ? '게시글이 삭제되었습니다' : '댓글이 삭제되었습니다')
      setReports(prev => prev.filter(r => !(r.content_type === report.content_type && r.content_id === report.content_id)))
    }
  }

  const handleDismiss = async (report: AdminReport) => {
    await supabase.from('reports')
      .delete()
      .eq('content_type', report.content_type)
      .eq('content_id', report.content_id)
    toast.success('신고가 기각되었습니다')
    setReports(prev => prev.filter(r => !(r.content_type === report.content_type && r.content_id === report.content_id)))
  }

  const grouped = reports.reduce<Record<string, AdminReport & { count: number }>>((acc, r) => {
    const key = `${r.content_type}_${r.content_id}`
    if (!acc[key]) {
      acc[key] = { ...r, count: 1 }
    } else {
      acc[key].count++
    }
    return acc
  }, {})
  const groupedList = Object.values(grouped).sort((a, b) => b.count - a.count)

  return (
    <div>
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-4 w-fit">
        {[['', '전체'], ['post', '게시글'], ['comment', '댓글']].map(([val, label]) => (
          <Button
            key={val}
            variant={typeFilter === val ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter(val)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold text-muted-foreground bg-muted/50 px-4 py-3 border-b">
          <span className="pr-3">유형</span>
          <span>신고자 → 피신고자</span>
          <span className="px-3">사유</span>
          <span className="px-3">건수</span>
          <span className="px-3">날짜</span>
          <span className="px-3">처리</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : groupedList.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">신고 내역이 없습니다</div>
        ) : (
          <div className="divide-y">
            {groupedList.map(report => (
              <div key={`${report.content_type}_${report.content_id}`}>
                {/* Desktop */}
                <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-0 px-4 py-3 hover:bg-muted/30">
                  <div className="pr-3">
                    <Badge variant={report.content_type === 'post' ? 'default' : 'secondary'}>
                      {report.content_type === 'post' ? '게시글' : '댓글'}
                    </Badge>
                  </div>
                  <div className="text-sm text-foreground min-w-0">
                    <span className="font-medium">{report.reporter_nickname ?? '?'}</span>
                    <span className="text-muted-foreground mx-1">→</span>
                    <span className="text-destructive font-medium">{report.target_nickname ?? '?'}</span>
                    <span className="text-xs text-muted-foreground ml-2">#{report.content_id}</span>
                  </div>
                  <span className="px-3 text-xs text-muted-foreground whitespace-nowrap">{REASON_MAP[report.reason] ?? report.reason}</span>
                  <span className="px-3">
                    <Badge variant={report.count >= 3 ? 'destructive' : 'secondary'}>
                      {report.count}건
                    </Badge>
                  </span>
                  <span className="px-3 text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(report.created_at)}</span>
                  <div className="px-3 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteContent(report)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title={report.content_type === 'post' ? '게시글 삭제' : '댓글 삭제'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDismiss(report)}
                      className="h-8 w-8 text-muted-foreground hover:text-green-500"
                      title="신고 기각"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden px-4 py-3 hover:bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={report.content_type === 'post' ? 'default' : 'secondary'} className="text-xs">
                        {report.content_type === 'post' ? '게시글' : '댓글'}
                      </Badge>
                      <Badge variant={report.count >= 3 ? 'destructive' : 'secondary'} className="text-xs">
                        {report.count}건
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteContent(report)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDismiss(report)} className="h-7 w-7 text-muted-foreground hover:text-green-500">
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{report.reporter_nickname}</span>
                    <span className="text-muted-foreground mx-1">→</span>
                    <span className="text-destructive font-medium">{report.target_nickname}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{REASON_MAP[report.reason] ?? report.reason}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(report.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
