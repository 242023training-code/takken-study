'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, Bell, LogOut, ChevronRight, Loader2, CheckCircle } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [notificationTime, setNotificationTime] = useState('07:30')
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_time, notification_enabled')
      .eq('id', user.id)
      .single()

    if (profile) {
      setNotificationTime(profile.notification_time ?? '07:30')
      setNotificationEnabled(profile.notification_enabled ?? false)
    }

    setLoading(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      notification_time: notificationTime,
      notification_enabled: notificationEnabled,
      updated_at: new Date().toISOString(),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">設定</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Account */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">アカウント</p>
          </div>
          <div className="px-4 py-4">
            <p className="text-xs text-gray-400 mb-0.5">メールアドレス</p>
            <p className="text-sm text-gray-800 font-medium">{user?.email}</p>
          </div>
        </div>

        {/* Notification settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">通知設定</p>
          </div>

          <div className="divide-y divide-gray-50">
            {/* Toggle */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">学習リマインダー</p>
                  <p className="text-xs text-gray-400">毎日問題を通知</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationEnabled(!notificationEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  notificationEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    notificationEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Time picker */}
            <div className="px-4 py-4">
              <p className="text-sm font-medium text-gray-800 mb-2">通知時間</p>
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                disabled={!notificationEnabled}
                className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl text-base text-gray-800 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              />
              <p className="text-xs text-gray-400 mt-2">
                ※ ブラウザ通知はPWAインストール後に利用可能です
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              保存中...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              保存しました！
            </>
          ) : (
            '設定を保存'
          )}
        </button>

        {/* Logout */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 text-red-600 hover:bg-red-50 transition active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">ログアウト</span>
            <ChevronRight className="w-4 h-4 ml-auto text-gray-300" />
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">
          宅建ミニ学習 v0.1.0
        </p>
      </div>
    </div>
  )
}
