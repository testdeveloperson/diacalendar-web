'use client'

import { useCategories } from '@/hooks/useCategories'

interface CategoryFilterProps {
  selected: string | null
  onChange: (category: string | null) => void
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const { categories } = useCategories()

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          selected === null
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        전체
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            selected === cat.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
