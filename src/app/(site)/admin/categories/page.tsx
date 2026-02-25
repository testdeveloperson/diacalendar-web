'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Category, colorClass } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'

const COLOR_OPTIONS = [
  { value: 'emerald', label: '초록' },
  { value: 'violet', label: '보라' },
  { value: 'blue', label: '파랑' },
  { value: 'rose', label: '빨강' },
  { value: 'amber', label: '주황' },
  { value: 'gray', label: '회색' },
]

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editColor, setEditColor] = useState('gray')
  const [editDescription, setEditDescription] = useState('')
  const [newId, setNewId] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('emerald')
  const [newDescription, setNewDescription] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

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
      toast.error('수정 실패: ' + error.message)
    } else {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, label: editLabel.trim(), color: editColor, description: editDescription.trim() || null } : c))
      toast.success('카테고리가 수정되었습니다')
      setEditingId(null)
    }
  }

  const handleDelete = async (cat: Category) => {
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (error) {
      toast.error('삭제 실패: ' + error.message)
    } else {
      setCategories(prev => prev.filter(c => c.id !== cat.id))
      toast.success('카테고리가 삭제되었습니다')
    }
    setDeleteTarget(null)
  }

  const handleAdd = async () => {
    const idVal = newId.trim().toUpperCase()
    const labelVal = newLabel.trim()
    if (!idVal || !labelVal) { toast.error('ID와 이름을 모두 입력해주세요'); return }
    if (!/^[A-Z_]{1,20}$/.test(idVal)) { toast.error('ID는 영문 대문자와 _ 만 사용 가능합니다 (최대 20자)'); return }

    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0
    const { error } = await supabase.from('categories').insert({
      id: idVal,
      label: labelVal,
      color: newColor,
      sort_order: maxOrder + 1,
      description: newDescription.trim() || null,
    })
    if (error) {
      toast.error('추가 실패: ' + (error.code === '23505' ? '이미 존재하는 ID입니다' : error.message))
    } else {
      toast.success('카테고리가 추가되었습니다')
      setNewId(''); setNewLabel(''); setNewColor('emerald'); setNewDescription('')
      setShowAddForm(false)
      fetchCategories()
    }
  }

  return (
    <div>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.label}&quot; 카테고리를 삭제하시겠습니까? 해당 카테고리로 작성된 게시글의 카테고리 표시가 변경될 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-card rounded-2xl border overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
          <span className="text-xs font-semibold text-muted-foreground">카테고리 목록</span>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            카테고리 추가
          </Button>
        </div>

        {showAddForm && (
          <div className="px-4 py-4 border-b bg-primary/5">
            <p className="text-xs font-semibold text-primary mb-3">새 카테고리</p>
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 items-end mb-2">
              <div>
                <Label className="text-xs mb-1">ID (영문대문자)</Label>
                <Input
                  type="text"
                  value={newId}
                  onChange={e => setNewId(e.target.value.toUpperCase())}
                  placeholder="예: NOTICE"
                  className="w-28"
                />
              </div>
              <div>
                <Label className="text-xs mb-1">이름</Label>
                <Input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="예: 공지사항"
                />
              </div>
              <div>
                <Label className="text-xs mb-1">색상</Label>
                <Select value={newColor} onValueChange={setNewColor}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mb-3">
              <Label className="text-xs mb-1">게시판 설명 (선택)</Label>
              <Input
                type="text"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="예: 회사 공지 및 중요 안내사항을 전달하는 게시판입니다"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm">추가</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>취소</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">카테고리가 없습니다</div>
        ) : (
          <div className="divide-y">
            {categories.map(cat => (
              <div key={cat.id} className="px-4 py-4">
                {editingId === cat.id ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <Input
                        type="text"
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        className="w-40"
                      />
                      <Select value={editColor} onValueChange={setEditColor}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOR_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => handleUpdate(cat)}>저장</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>취소</Button>
                    </div>
                    <Input
                      type="text"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="게시판 설명 (선택)"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${colorClass(cat.color)}`}>
                        {cat.label}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{cat.id}</span>
                      {cat.description && (
                        <span className="text-xs text-muted-foreground truncate">{cat.description}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(cat)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(cat)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
