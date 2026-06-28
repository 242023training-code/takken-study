'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BarChart2, Flame, CheckCircle, BookOpen, Calendar } from 'lucide-react'

interface DayRecord {
  date: string
  total: number
  correct: number
}

interface Stats {
  totalAnswers: number
  correctAnswers: number
  correctRate: number
  streakDays: number
  todayAnswers: number
  last7Days: DayRecord[]
}

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
    if (diff === 1) streak++
    else break
  }
  return streak
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export default function HistoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: histories } = await supabase
      .from('answer_histories')
      .select('is_correct, answered_at')
      .eq('user_id', user.id)

    if (!histories) { setLoading(false); return }

    const today = new Date().toISOString().slice(0, 10)
    const total = histories.length
    const correct = histories.filter((h) => h.is_correct).length
    const streak = computeStreak(histories.map((h) => h.answered_at))
    const todayAnswers = histories.filter((h) => h.answered_at.startsWith(today)).length

    const last7 = getLast7Days()
    const last7Days: DayRecord[] = last7.map((date) => {
      const dayHistories = histories.filter((h) => h.answered_at.startsWith(date))
      return {
        date,
        total: dayHistories.length,
        correct: dayHistories.filter((h) => h.is_correct).length,
      }
    })

    setStats({
      totalAnswers: total,
      correctAnswers: correct,
      correctRate: total > 0 ? Math.round((correct / total) * 100) : 0,
      streakDays: streak,
      todayAnswers,
      last7Days,
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const maxCount = Math.max(...(stats?.last7Days.map((d) => d.total) ?? [1]), 1)

  const dayLabels = ['月', '火', '水', '木', '金', '土', '日']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">学習履歴</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Main stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">累計回答数</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats?.totalAnswers ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">問</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-500">正解率</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats?.correctRate ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">%</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-gray-500">連続学習</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats?.streakDays ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">日</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500">今日の回答</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats?.todayAnswers ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">問</p>
          </div>
        </div>

        {/* 7-day bar chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">過去7日間の回答数</h3>
          <div className="flex items-end gap-2 h-28">
            {stats?.last7Days.map((day, i) => {
              const dayOfWeek = new Date(day.date).getDay()
              const label = dayLabels[dayOfWeek === 0 ? 6 : dayOfWeek - 1]
              const heightPct = day.total === 0 ? 4 : Math.round((day.total / maxCount) * 100)
              const isToday = day.date === new Date().toISOString().slice(0, 10)

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-medium">{day.total || ''}</span>
                  <div className="w-full flex items-end" style={{ height: '80px' }}>
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        isToday ? 'bg-blue-500' : 'bg-blue-200'
                      }`}
                      style={{ height: `${heightPct}%`, minHeight: day.total > 0 ? '8px' : '2px' }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Correct answers vs total */}
        {(stats?.totalAnswers ?? 0) > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">正解 / 不正解</h3>
            <div className="flex gap-1 h-4 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full"
                style={{ width: `${stats?.correctRate ?? 0}%` }}
              />
              <div className="bg-red-300 h-full flex-1" />
            </div>
            <div className="flex justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-gray-500">正解 {stats?.correctAnswers ?? 0}問</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-300" />
                <span className="text-xs text-gray-500">
                  不正解 {(stats?.totalAnswers ?? 0) - (stats?.correctAnswers ?? 0)}問
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
