'use client'

import { Suspense } from 'react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Question, SessionAnswer } from '@/types'
import StudyProgress from '@/components/StudyProgress'
import QuestionCard from '@/components/QuestionCard'
import AnswerFeedback from '@/components/AnswerFeedback'
import { Trophy, CheckCircle, XCircle, RotateCcw, Home, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Phase = 'loading' | 'question' | 'feedback' | 'summary' | 'error'

const QUESTION_COUNT = 5

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function StudySession() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isReview = searchParams.get('mode') === 'review'
  const supabase = createClient()

  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<SessionAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  const initSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let fetchedQuestions: Question[] = []

    if (isReview) {
      const { data } = await supabase
        .from('review_list')
        .select('questions(*)')
        .eq('user_id', user.id)
        .limit(20)

      fetchedQuestions = (data ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r.questions)
        .filter(Boolean) as Question[]
    } else {
      const { data } = await supabase.from('questions').select('*')
      fetchedQuestions = (data ?? []) as Question[]
    }

    if (fetchedQuestions.length === 0) {
      setPhase('error')
      return
    }

    const shuffled = shuffleArray(fetchedQuestions).slice(0, QUESTION_COUNT)

    const { data: session } = await supabase
      .from('study_sessions')
      .insert({ user_id: user.id, question_count: shuffled.length })
      .select()
      .single()

    setQuestions(shuffled)
    setSessionId(session?.id ?? null)
    setPhase('question')
  }, [isReview, router, supabase])

  useEffect(() => {
    initSession()
  }, [initSession])

  const handleSelect = async (index: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const question = questions[currentIndex]
    const isCorrect = index === question.correct_answer

    await supabase.from('answer_histories').insert({
      user_id: user.id,
      question_id: question.id,
      session_id: sessionId,
      is_correct: isCorrect,
      selected_answer: index,
    })

    if (!isCorrect) {
      await supabase.from('review_list').upsert(
        { user_id: user.id, question_id: question.id },
        { onConflict: 'user_id,question_id' }
      )
    } else if (isReview) {
      await supabase
        .from('review_list')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', question.id)
    }

    setAnswers((prev) => [...prev, { questionId: question.id, selectedIndex: index, isCorrect }])
    setPhase('feedback')
  }

  const handleNext = async () => {
    if (currentIndex >= questions.length - 1) {
      if (sessionId) {
        await supabase
          .from('study_sessions')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', sessionId)
      }
      setPhase('summary')
    } else {
      setCurrentIndex((i) => i + 1)
      setSelectedAnswer(null)
      setPhase('question')
    }
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm">問題を読み込んでいます...</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <p className="text-gray-600">問題が見つかりませんでした。</p>
        <Link href="/home" className="text-blue-600 font-medium">ホームに戻る</Link>
      </div>
    )
  }

  if (phase === 'summary') {
    const correct = answers.filter((a) => a.isCorrect).length
    const total = answers.length
    const rate = Math.round((correct / total) * 100)

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 pt-12 pb-8 text-white text-center">
          <Trophy className="w-16 h-16 text-amber-300 mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-1">セッション完了！</h1>
          <p className="text-blue-200 text-sm">お疲れ様でした</p>
        </div>

        <div className="px-4 py-6 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-5xl font-bold text-blue-600 mb-1">{rate}%</div>
            <div className="text-gray-500 text-sm">正解率</div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xl justify-center">
                  <CheckCircle className="w-5 h-5" />
                  {correct}
                </div>
                <div className="text-xs text-gray-400">正解</div>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="text-center">
                <div className="flex items-center gap-1 text-red-500 font-bold text-xl justify-center">
                  <XCircle className="w-5 h-5" />
                  {total - correct}
                </div>
                <div className="text-xs text-gray-400">不正解</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">問題の結果</h3>
            <div className="space-y-2">
              {answers.map((answer, i) => {
                const q = questions[i]
                return (
                  <div key={i} className="flex items-start gap-2">
                    {answer.isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-xs text-gray-600 line-clamp-2">{q?.question}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/study"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              もう一度やる
            </Link>
            <Link
              href="/home"
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl transition active:scale-95"
            >
              <Home className="w-4 h-4" />
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <StudyProgress current={currentIndex + 1} total={questions.length} />
      </div>

      <div className="flex-1 px-4 py-5">
        {phase === 'question' && (
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            onSelect={handleSelect}
            disabled={selectedAnswer !== null}
          />
        )}

        {phase === 'feedback' && selectedAnswer !== null && (
          <AnswerFeedback
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            isLast={currentIndex >= questions.length - 1}
            onNext={handleNext}
          />
        )}
      </div>
    </div>
  )
}

export default function StudyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen gap-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 text-sm">読み込み中...</p>
        </div>
      }
    >
      <StudySession />
    </Suspense>
  )
}
