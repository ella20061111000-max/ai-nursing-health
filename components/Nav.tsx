'use client'

// ============================================================
// Navigation — 导航栏
// ============================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, History, Activity } from 'lucide-react'

const navItems = [
  { href: '/', label: '饮食日记 Diet Diary', icon: ClipboardList },
  { href: '/history', label: '历史记录 History', icon: History },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo / App Name */}
          <Link href="/" className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <span className="font-semibold text-gray-900 text-sm">
              护理健康管家
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">
              Nursing Health Companion
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.href === '/' ? '日记' : '历史'}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
