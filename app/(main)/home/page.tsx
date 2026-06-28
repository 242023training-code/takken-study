'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StudyStats } from '@/types'
import { Flame, BookOpen, Trophy, ChevronRight, LogOut, RotateCcw, Settings } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const unique = [...new Set(dates.map((d) => d.slice(0, 10)))].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  if (unique[0] !== today) return 0
  let streak = 1
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1])
    const curr = new Date(unique[i])
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    const today = new Date().toISOString().slice(0, 10)

    const [historyRes, reviewRes] = await Promise.all([
      supabase
        .from('answer_histories')
        .select('is_correct, answered_at')
        .eq('user_id', user.id),
      supabase
        .from('review_list')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id),
    ])

    const histories = historyRes.data ?? []
    const total = histories.length
    const correct = histories.filter((h) => h.is_correct).length
    const dates = histories.map((h) => h.answered_at)
    const streak = computeStreak(dates)
    const todayAnswers = histories.filter((h) => h.answered_at.startsWith(today)).length

    setStats({
      totalAnswers: total,
      correctAnswers: correct,
      correctRate: total > 0 ? Math.round((correct / total) * 100) : 0,
      streakDays: streak,
      todayAnswers,
    })

    setReviewCount(reviewRes.count ?? 0)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const todayDone = (stats?.todayAnswers ?? 0) >= 5

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 pt-12 pb-8 text-white">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-blue-200 text-sm">おかえりなさい</p>
            <h1 className="text-xl font-bold mt-0.5">
              {user?.email?.split('@')[0] ?? 'ゲスト'}さん
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="p-2 rounded-xl bg-blue-500/40 hover:bg-blue-500/60 transition"
            >
              <Settings className="w-4 h-4 text-white" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-blue-500/40 hover:bg-blue-500/60 transition"
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 bg-white/20 rounded-2xl px-4 py-3">
          <Flame className="w-6 h-6 text-amber-300" />
          <div>
            <p className="text-xs text-blue-100">連続学習</p>
            <p className="text-xl font-bold">{stats?.streakDays ?? 0} 日</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-blue-100">今日の回答</p>
            <p className="text-xl font-bold">{stats?.todayAnswers ?? 0} 問</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Start study button */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          {todayDone ? (
            <div className="text-center">
              <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
              <h2 className="text-lg font-bold text-gray-800 mb-1">今日は達成済み！</h2>
              <p className="text-sm text-gray-500 mb-4">また追加で練習することもできます</p>
              <Link
                href="/study"
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                もう一度やる
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-800 mb-1">今日のミニ学習</h2>
              <p className="text-sm text-gray-500 mb-4">5問・約5分で完了できます</p>
              <Link
                href="/study"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition active:scale-95 text-base"
              >
                <BookOpen className="w-5 h-5" />
                学習を始める
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Link>
            </>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">累計回答数</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalAnswers ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">問</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">正解率</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.correctRate ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">%</p>
          </div>
        </div>

        {/* Review shortcut */}
        {reviewCount > 0 && (
          <Link
            href="/review"
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 transition active:scale-[0.98]"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">復習リスト</p>
              <p className="text-xs text-gray-500">{reviewCount} 問が待っています</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        )}

        {/* Category hints */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">出題カテゴリ</h3>
          <div className="flex flex-wrap gap-2">
            {['権利関係', '宅建業法', '法令上の制限', '税・その他'].map((cat) => (
              <span
                key={cat}
                className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
