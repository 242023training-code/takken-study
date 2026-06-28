interface StudyProgressProps {
  current: number
  total: number
}

export default function StudyProgress({ current, total }: StudyProgressProps) {
  const percentage = (current / total) * 100

  return (
    <div className="px-4 py-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500 font-medium">問題 {current} / {total}</span>
        <span className="text-xs text-gray-500">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
