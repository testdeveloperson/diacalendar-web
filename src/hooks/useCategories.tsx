'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Category } from '@/lib/types'

interface CategoriesContextType {
  categories: Category[]
  loading: boolean
  getCategoryLabel: (id: string) => string
  getCategoryColor: (id: string) => string
}

const CategoriesContext = createContext<CategoriesContextType | null>(null)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setCategories((data as Category[]) ?? [])
        setLoading(false)
      })
  }, [])

  const getCategoryLabel = (id: string) =>
    categories.find(c => c.id === id)?.label ?? id

  const getCategoryColor = (id: string) =>
    categories.find(c => c.id === id)?.color ?? 'gray'

  return (
    <CategoriesContext.Provider value={{ categories, loading, getCategoryLabel, getCategoryColor }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const context = useContext(CategoriesContext)
  if (!context) throw new Error('useCategories must be used within CategoriesProvider')
  return context
}
