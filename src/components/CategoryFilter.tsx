'use client'

import { useState, useRef, useEffect } from 'react'
import { useCategories } from '@/hooks/useCategories'

interface CategoryFilterProps {
  selected: string | null
  onChange: (category: string | null) => void
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const { categories } = useCategories()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedLabel = selected
    ? (categories.find(c => c.id === selected)?.label ?? selected)
    : '전체'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        {selectedLabel}
        <svg
          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-11 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200/60 dark:border-white/10 py-1.5 z-50 min-w-[140px]">
          <button
            onClick={() => { onChange(null); setOpen(false) }}
            className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors ${
              selected === null
                ? 'text-blue-600 font-semibold bg-blue-50 dark:bg-blue-950/50'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            전체
            {selected === null && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { onChange(cat.id); setOpen(false) }}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors ${
                selected === cat.id
                  ? 'text-blue-600 font-semibold bg-blue-50 dark:bg-blue-950/50'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {cat.label}
              {selected === cat.id && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
