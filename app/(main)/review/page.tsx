'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ReviewItemWithQuestion } from '@/types'
import { RotateCcw, Trash2, ChevronRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import CategoryBadge from '@/components/CategoryBadge'

export default function ReviewPage() {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<ReviewItemWithQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadReviewList()
  }, [])

  const loadReviewList = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('review_list')
      .select('*, questions(*)')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    setItems((data ?? []) as ReviewItemWithQuestion[])
    setLoading(false)
  }

  const handleDelete = async (itemId: string) => {
    setDeleting(itemId)
    await supabase.from('review_list').delete().eq('id', itemId)
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">復習リスト</h1>
          </div>
          <span className="text-sm text-gray-400">{items.length}問</span>
        </div>
      </div>

      <div className="px-4 py-5">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">復習リストは空です</h2>
            <p className="text-sm text-gray-400 mb-6">
              問題に不正解すると、ここに追加されます
            </p>
            <Link
              href="/study"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition active:scale-95"
            >
              学習を始める
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Start review button */}
            <Link
              href="/study?mode=review"
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-4 rounded-xl transition active:scale-95 mb-5"
            >
              <RotateCcw className="w-4 h-4" />
              復習を始める（{Math.min(items.length, 5)}問）
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Link>

            {/* List of review items */}
            {items.map((item) => {
              const q = item.questions
              if (!q) return null

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <CategoryBadge category={q.category} />
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                        {q.question}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="flex-shrink-0 p-2 text-gray-300 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
