import clsx from 'clsx'
import { Category } from '@/types'

const categoryColors: Record<Category, string> = {
  '権利関係': 'bg-purple-100 text-purple-700',
  '宅建業法': 'bg-blue-100 text-blue-700',
  '法令上の制限': 'bg-green-100 text-green-700',
  '税・その他': 'bg-amber-100 text-amber-700',
}

export default function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={clsx(
        'inline-block text-xs font-medium px-2.5 py-1 rounded-full',
        categoryColors[category]
      )}
    >
      {category}
    </span>
  )
}
