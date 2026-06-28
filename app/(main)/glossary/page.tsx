'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, BookMarked, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

interface GlossaryTerm {
  id: string
  term: string
  reading: string
  definition: string
  category: string
  example: string | null
}

const CATEGORIES = ['すべて', '権利関係', '宅建業法', '法令上の制限', '税・その他'] as const

const CATEGORY_COLORS: Record<string, string> = {
  '権利関係': 'bg-purple-100 text-purple-700 border-purple-200',
  '宅建業法': 'bg-blue-100 text-blue-700 border-blue-200',
  '法令上の制限': 'bg-green-100 text-green-700 border-green-200',
  '税・その他': 'bg-amber-100 text-amber-700 border-amber-200',
}

export default function GlossaryPage() {
  const supabase = createClient()
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('すべて')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadTerms()
  }, [])

  const loadTerms = async () => {
    const { data } = await supabase
      .from('glossary_terms')
      .select('*')
      .order('reading', { ascending: true })
    setTerms(data ?? [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return terms.filter((t) => {
      const matchCategory = activeCategory === 'すべて' || t.category === activeCategory
      const q = search.trim().toLowerCase()
      const matchSearch =
        q === '' ||
        t.term.includes(q) ||
        t.reading.includes(q) ||
        t.definition.includes(q)
      return matchCategory && matchSearch
    })
  }, [terms, search, activeCategory])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 pt-12 pb-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <BookMarked className="w-5 h-5 text-blue-200" />
          <p className="text-blue-200 text-sm font-medium">重要語句</p>
        </div>
        <h1 className="text-2xl font-bold mb-4">用語集</h1>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="用語を検索..."
            className="w-full bg-white text-gray-800 pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition',
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs text-gray-500">{filtered.length} 語</p>
      </div>

      {/* Term list */}
      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">該当する用語が見つかりません</p>
          </div>
        ) : (
          filtered.map((term) => {
            const isExpanded = expandedId === term.id
            return (
              <div
                key={term.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  className="w-full text-left px-4 py-4 flex items-start gap-3"
                  onClick={() => setExpandedId(isExpanded ? null : term.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-gray-800 text-base">{term.term}</span>
                      <span
                        className={clsx(
                          'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                          CATEGORY_COLORS[term.category] ?? 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {term.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">（{term.reading}）</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{term.definition}</p>
                    {term.example && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1 font-medium">例</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{term.example}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
