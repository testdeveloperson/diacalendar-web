'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface AdminUser {
  id: string
  nickname: string
  is_admin: boolean
  updated_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const showSnackbar = (msg: string) => {
    setSnackbar(msg)
    setTimeout(() => setSnackbar(null), 3000)
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('id,nickname,is_admin,updated_at')
      .order('updated_at', { ascending: false })
      .limit(200)

    if (search.trim()) {
      query = query.ilike('nickname', `%${search.trim()}%`)
    }

    const { data } = await query
    setUsers((data as AdminUser[]) ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (user: AdminUser) => {
    if (user.is_admin) {
      showSnackbar('관리자 계정은 삭제할 수 없습니다')
      setConfirmDelete(null)
      return
    }
    // profiles 삭제 시 ON DELETE CASCADE로 posts, comments 자동 삭제
    const { error } = await supabase.from('profiles').delete().eq('id', user.id)
    if (error) {
      showSnackbar('삭제 실패: ' + error.message)
    } else {
      showSnackbar(`${user.nickname} 계정이 삭제되었습니다`)
      setUsers(prev => prev.filter(u => u.id !== user.id))
    }
    setConfirmDelete(null)
  }

  const handleToggleAdmin = async (user: AdminUser) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !user.is_admin })
      .eq('id', user.id)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u))
      showSnackbar(user.is_admin ? '관리자 권한이 해제되었습니다' : '관리자 권한이 부여되었습니다')
    }
  }

  return (
    <div>
      {snackbar && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm z-50 shadow-xl">
          {snackbar}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <p className="text-gray-700 mb-2 font-semibold">{confirmDelete.nickname} 계정 삭제</p>
            <p className="text-sm text-gray-500 mb-6">해당 사용자의 모든 게시글과 댓글이 함께 삭제됩니다. Supabase Auth 계정은 대시보드에서 별도 삭제가 필요합니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">취소</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 검색 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchUsers()}
          placeholder="닉네임 검색..."
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        />
        <button onClick={fetchUsers} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          검색
        </button>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0 text-xs font-semibold text-gray-500 bg-gray-50 px-4 py-3 border-b border-gray-100">
          <span className="pr-3">아바타</span>
          <span>닉네임</span>
          <span className="px-4">관리자</span>
          <span className="px-3">삭제</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">사용자가 없습니다</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map(user => (
              <div key={user.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-0 px-4 py-3 hover:bg-gray-50">
                <div className="pr-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {user.nickname[0]}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{user.nickname}</p>
                  <p className="text-xs text-gray-400 font-mono truncate">{user.id.slice(0, 8)}...</p>
                </div>
                <div className="px-4">
                  <button
                    onClick={() => handleToggleAdmin(user)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                      user.is_admin
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {user.is_admin ? '관리자' : '일반'}
                  </button>
                </div>
                <div className="px-3">
                  <button
                    onClick={() => setConfirmDelete(user)}
                    disabled={user.is_admin}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={user.is_admin ? '관리자는 삭제 불가' : '삭제'}
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

      <p className="text-xs text-gray-400 mt-3 text-right">최대 200명 표시 · 관리자 버튼 클릭으로 권한 토글 가능</p>
    </div>
  )
}
