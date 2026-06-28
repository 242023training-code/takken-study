'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, RotateCcw, BarChart2, BookMarked } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/home', icon: Home, label: 'ホーム' },
  { href: '/study', icon: BookOpen, label: '学習' },
  { href: '/review', icon: RotateCcw, label: '復習' },
  { href: '/history', icon: BarChart2, label: '履歴' },
  { href: '/glossary', icon: BookMarked, label: '用語集' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="max-w-md mx-auto flex">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon
                className={clsx('w-5 h-5', isActive && 'stroke-[2.5]')}
              />
              <span className={clsx('text-[10px] font-medium', isActive && 'font-semibold')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
