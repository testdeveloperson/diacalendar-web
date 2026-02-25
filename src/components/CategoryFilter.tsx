'use client'

import { useCategories } from '@/hooks/useCategories'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CategoryFilterProps {
  selected: string | null
  onChange: (category: string | null) => void
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const { categories } = useCategories()

  return (
    <Select
      value={selected ?? '__all__'}
      onValueChange={(v) => onChange(v === '__all__' ? null : v)}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="전체" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">전체</SelectItem>
        {categories.map(cat => (
          <SelectItem key={cat.id} value={cat.id}>
            {cat.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
