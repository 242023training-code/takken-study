'use client'

import { useState } from 'react'
import { Question } from '@/types'
import { CheckCircle, XCircle, ChevronRight, Flag } from 'lucide-react'
import clsx from 'clsx'
import dynamic from 'next/dynamic'

const ReportModal = dynamic(() => import('./ReportModal'), { ssr: false })

const choiceLabels = ['ア', 'イ', 'ウ', 'エ']

interface AnswerFeedbackProps {
  question: Question
  selectedAnswer: number
  isLast: boolean
  onNext: () => void
}

export default function AnswerFeedback({
  question,
  selectedAnswer,
  isLast,
  onNext,
}: AnswerFeedbackProps) {
  const isCorrect = selectedAnswer === question.correct_answer
  const [showReport, setShowReport] = useState(false)

  return (
    <div className="animate-bounce-in">
      {/* Result banner */}
      <div
        className={clsx(
          'rounded-2xl p-4 mb-4 flex items-center gap-3',
          isCorrect ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-red-50 border-2 border-red-300'
        )}
      >
        {isCorrect ? (
          <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
        )}
        <div>
          <p
            className={clsx(
              'font-bold text-lg',
              isCorrect ? 'text-emerald-700' : 'text-red-700'
            )}
          >
            {isCorrect ? '正解！' : '不正解...'}
          </p>
          {!isCorrect && (
            <p className="text-sm text-red-600 mt-0.5">
              正解：{choiceLabels[question.correct_answer]}「{question.choices[question.correct_answer]}」
            </p>
          )}
        </div>
      </div>

      {/* Your answer (when wrong) */}
      {!isCorrect && (
        <div className="bg-gray-100 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">あなたの回答</p>
          <p className="text-sm text-gray-700">
            {choiceLabels[selectedAnswer]}「{question.choices[selectedAnswer]}」
          </p>
        </div>
      )}

      {/* Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-blue-600 mb-2">解説</p>
        <p className="text-[14px] text-gray-700 leading-relaxed">{question.explanation}</p>
      </div>

      {/* Report link */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition"
        >
          <Flag className="w-3 h-3" />
          この問題を報告する
        </button>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 text-base"
      >
        {isLast ? '結果を見る' : '次の問題へ'}
        <ChevronRight className="w-5 h-5" />
      </button>

      {showReport && (
        <ReportModal
          questionId={question.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
