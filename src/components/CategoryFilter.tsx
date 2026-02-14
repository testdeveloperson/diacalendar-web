'use client'

import { BoardCategory, BOARD_CATEGORIES } from '@/lib/types'

interface CategoryFilterProps {
  selected: BoardCategory | null
  onChange: (category: BoardCategory | null) => void
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {BOARD_CATEGORIES.map(cat => (
        <button
          key={cat.label}
          onClick={() => onChange(cat.value)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            selected === cat.value
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
