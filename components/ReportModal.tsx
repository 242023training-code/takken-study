'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flag, X, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

const REASONS = [
  '問題文が不明瞭',
  '正解・解説が誤り',
  '選択肢に問題あり',
  'その他',
] as const

interface ReportModalProps {
  questionId: string
  onClose: () => void
}

export default function ReportModal({ questionId, onClose }: ReportModalProps) {
  const supabase = createClient()
  const [reason, setReason] = useState<string>('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    await supabase.from('question_reports').insert({
      user_id: user.id,
      question_id: questionId,
      reason,
      comment: comment.trim() || null,
    })

    setDone(true)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 animate-slide-up">
        {done ? (
          <div className="text-center py-4">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-gray-800 text-lg mb-1">報告を受け付けました</p>
            <p className="text-sm text-gray-500 mb-6">ご協力ありがとうございます</p>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
            >
              閉じる
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-500" />
                <h2 className="font-bold text-gray-800 text-base">問題を報告する</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-3">報告理由を選択してください</p>
            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={clsx(
                    'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition',
                    reason === r
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-1.5">詳細（任意）</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="具体的な内容を入力..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className={clsx(
                'w-full py-3.5 rounded-xl font-semibold text-sm transition',
                reason && !submitting
                  ? 'bg-red-500 hover:bg-red-600 text-white active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {submitting ? '送信中...' : '報告を送信'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
