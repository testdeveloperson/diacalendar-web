'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Category, colorClass } from '@/lib/types'

const COLOR_OPTIONS = [
  { value: 'emerald', label: '초록', cls: 'bg-emerald-50 text-emerald-600' },
  { value: 'violet', label: '보라', cls: 'bg-violet-50 text-violet-600' },
  { value: 'blue', label: '파랑', cls: 'bg-blue-50 text-blue-600' },
  { value: 'rose', label: '빨강', cls: 'bg-rose-50 text-rose-600' },
  { value: 'amber', label: '주황', cls: 'bg-amber-50 text-amber-600' },
  { value: 'gray', label: '회색', cls: 'bg-gray-100 text-gray-600' },
]

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editColor, setEditColor] = useState('gray')
  const [editDescription, setEditDescription] = useState('')
  const [newId, setNewId] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('emerald')
  const [newDescription, setNewDescription] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const showSnackbar = (msg: string) => {
    setSnackbar(msg)
    setTimeout(() => setSnackbar(null), 3000)
  }

  const fetchCategories = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    setCategories((data as Category[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditLabel(cat.label)
    setEditColor(cat.color)
    setEditDescription(cat.description ?? '')
  }

  const handleUpdate = async (cat: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ label: editLabel.trim(), color: editColor, description: editDescription.trim() || null })
      .eq('id', cat.id)
    if (error) {
      showSnackbar('수정 실패: ' + error.message)
    } else {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, label: editLabel.trim(), color: editColor, description: editDescription.trim() || null } : c))
      showSnackbar('카테고리가 수정되었습니다')
      setEditingId(null)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`"${cat.label}" 카테고리를 삭제하시겠습니까?\n해당 카테고리로 작성된 게시글의 카테고리 표시가 변경될 수 있습니다.`)) return
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (error) {
      showSnackbar('삭제 실패: ' + error.message)
    } else {
      setCategories(prev => prev.filter(c => c.id !== cat.id))
      showSnackbar('카테고리가 삭제되었습니다')
    }
  }

  const handleAdd = async () => {
    const idVal = newId.trim().toUpperCase()
    const labelVal = newLabel.trim()
    if (!idVal || !labelVal) { showSnackbar('ID와 이름을 모두 입력해주세요'); return }
    if (!/^[A-Z_]{1,20}$/.test(idVal)) { showSnackbar('ID는 영문 대문자와 _ 만 사용 가능합니다 (최대 20자)'); return }

    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0
    const { error } = await supabase.from('categories').insert({
      id: idVal,
      label: labelVal,
      color: newColor,
      sort_order: maxOrder + 1,
      description: newDescription.trim() || null,
    })
    if (error) {
      showSnackbar('추가 실패: ' + (error.code === '23505' ? '이미 존재하는 ID입니다' : error.message))
    } else {
      showSnackbar('카테고리가 추가되었습니다')
      setNewId(''); setNewLabel(''); setNewColor('emerald'); setNewDescription('')
      setShowAddForm(false)
      fetchCategories()
    }
  }

  return (
    <div>
      {snackbar && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm z-50 shadow-xl">
          {snackbar}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500">카테고리 목록</span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            카테고리 추가
          </button>
        </div>

        {/* 추가 폼 */}
        {showAddForm && (
          <div className="px-4 py-4 border-b border-blue-100 bg-blue-50/50">
            <p className="text-xs font-semibold text-blue-700 mb-3">새 카테고리</p>
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 items-end mb-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ID (영문대문자)</label>
                <input
                  type="text"
                  value={newId}
                  onChange={e => setNewId(e.target.value.toUpperCase())}
                  placeholder="예: NOTICE"
                  className="w-28 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">이름</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="예: 공지사항"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">색상</label>
                <select
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">추가</button>
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-gray-200 text-sm font-semibold rounded-lg hover:bg-gray-50">취소</button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">게시판 설명 (선택)</label>
              <input
                type="text"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="예: 회사 공지 및 중요 안내사항을 전달하는 게시판입니다"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">카테고리가 없습니다</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map(cat => (
              <div key={cat.id} className="px-4 py-4">
                {editingId === cat.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={editColor}
                        onChange={e => setEditColor(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <button onClick={() => handleUpdate(cat)} className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">저장</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">취소</button>
                    </div>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="게시판 설명 (선택)"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${colorClass(cat.color)}`}>
                        {cat.label}
                      </span>
                      <span className="text-xs text-gray-400 font-mono flex-shrink-0">{cat.id}</span>
                      {cat.description && (
                        <span className="text-xs text-gray-400 truncate">{cat.description}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
