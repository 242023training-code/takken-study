import { Question } from '@/types'
import CategoryBadge from './CategoryBadge'
import clsx from 'clsx'

interface QuestionCardProps {
  question: Question
  selectedAnswer: number | null
  onSelect: (index: number) => void
  disabled?: boolean
}

const choiceLabels = ['ア', 'イ', 'ウ', 'エ']

export default function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  disabled = false,
}: QuestionCardProps) {
  return (
    <div className="animate-slide-up">
      {/* Question meta */}
      <div className="flex items-center gap-2 mb-3">
        <CategoryBadge category={question.category} />
        {question.year && (
          <span className="text-xs text-gray-400">{question.year}年</span>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {'★'.repeat(question.difficulty)}{'☆'.repeat(3 - question.difficulty)}
        </span>
      </div>

      {/* Question text */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <p className="text-gray-800 leading-relaxed text-[15px]">{question.question}</p>
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {question.choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => !disabled && onSelect(index)}
            disabled={disabled && selectedAnswer !== index}
            className={clsx(
              'w-full text-left rounded-2xl p-4 border-2 transition-all active:scale-[0.98]',
              selectedAnswer === null
                ? 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                : selectedAnswer === index
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-gray-50 border-gray-200 opacity-60'
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={clsx(
                  'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
                  selectedAnswer === index
                    ? 'bg-white text-blue-600'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {choiceLabels[index]}
              </span>
              <span className="text-[14px] leading-relaxed pt-0.5">{choice}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
