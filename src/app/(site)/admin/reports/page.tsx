'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/types'

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
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const showSnackbar = (msg: string) => {
    setSnackbar(msg)
    setTimeout(() => setSnackbar(null), 3000)
  }

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

    // reporter_id, target_author_id 목록으로 profiles 일괄 조회
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
    const table = report.content_type === 'post' ? 'posts' : 'comments'
    const { error } = report.content_type === 'post'
      ? await supabase.from('posts').delete().eq('id', report.content_id)
      : await supabase.from('comments').update({ is_deleted: true }).eq('id', report.content_id)

    if (error) {
      showSnackbar('처리 실패: ' + error.message)
    } else {
      // 해당 신고와 같은 content_id의 신고 전체 제거
      await supabase.from('reports')
        .delete()
        .eq('content_type', report.content_type)
        .eq('content_id', report.content_id)
      showSnackbar(report.content_type === 'post' ? '게시글이 삭제되었습니다' : '댓글이 삭제되었습니다')
      setReports(prev => prev.filter(r => !(r.content_type === report.content_type && r.content_id === report.content_id)))
    }
  }

  const handleDismiss = async (report: AdminReport) => {
    // 같은 content에 대한 신고 전체 무시
    await supabase.from('reports')
      .delete()
      .eq('content_type', report.content_type)
      .eq('content_id', report.content_id)
    showSnackbar('신고가 기각되었습니다')
    setReports(prev => prev.filter(r => !(r.content_type === report.content_type && r.content_id === report.content_id)))
  }

  // content_id 기준으로 그룹핑해서 중복 신고 수 계산
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
      {snackbar && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm z-50 shadow-xl">
          {snackbar}
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[['', '전체'], ['post', '게시글'], ['comment', '댓글']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTypeFilter(val)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                typeFilter === val ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 신고 목록 */}
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold text-gray-500 bg-gray-50 px-4 py-3 border-b border-gray-100">
          <span className="pr-3">유형</span>
          <span>신고자 → 피신고자</span>
          <span className="px-3">사유</span>
          <span className="px-3">건수</span>
          <span className="px-3">날짜</span>
          <span className="px-3">처리</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : groupedList.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">신고 내역이 없습니다</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {groupedList.map(report => (
              <div key={`${report.content_type}_${report.content_id}`} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-0 px-4 py-3 hover:bg-gray-50">
                <div className="pr-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    report.content_type === 'post'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {report.content_type === 'post' ? '게시글' : '댓글'}
                  </span>
                </div>
                <div className="text-sm text-gray-700 min-w-0">
                  <span className="font-medium">{report.reporter_nickname ?? '?'}</span>
                  <span className="text-gray-400 mx-1">→</span>
                  <span className="text-red-600 font-medium">{report.target_nickname ?? '?'}</span>
                  <span className="text-xs text-gray-400 ml-2">#{report.content_id}</span>
                </div>
                <span className="px-3 text-xs text-gray-500 whitespace-nowrap">{REASON_MAP[report.reason] ?? report.reason}</span>
                <span className="px-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    report.count >= 3 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {report.count}건
                  </span>
                </span>
                <span className="px-3 text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(report.created_at)}</span>
                <div className="px-3 flex gap-1">
                  <button
                    onClick={() => handleDeleteContent(report)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title={report.content_type === 'post' ? '게시글 삭제' : '댓글 삭제'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDismiss(report)}
                    className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                    title="신고 기각"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-right">신고 건수 많은 순 정렬 · 🗑 원글삭제 · ✓ 신고기각</p>
    </div>
  )
}
