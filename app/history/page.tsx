'use client'

// ============================================================
// History Page — 历史记录（完整日汇总）
// ============================================================

import { useState, useEffect } from 'react'
import { CalendarDays, ChevronRight, Moon, Droplets, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

interface DaySummary {
  date: string
  entries: { mealType: string; foodName: string }[]
  sleep: { type: string; bedTime: string; wakeTime: string; duration: number; quality: number }[]
  water: { totalMl: number } | null
}

export default function HistoryPage() {
  const [days, setDays] = useState<DaySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/history?days=30')
      const data = await res.json()
      setDays(data.days || [])
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getWeekday = (dateStr: string) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[new Date(dateStr).getDay()]
  }

  const getMealSummary = (entries: { mealType: string }[]) => {
    const set = new Set(entries.map(e => e.mealType))
    const labels: Record<string, string> = { breakfast: '早', lunch: '午', dinner: '晚', snack: '加' }
    return Array.from(set).map(m => labels[m] || m).join(' ')
  }

  const totalSleepHours = (records: { type: string; duration: number }[]) => {
    return records.reduce((s, r) => s + r.duration, 0)
  }

  const formatDate = (dateStr: string) => {
    return dateStr.split('-').slice(1).join('/')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-teal-600" />
          历史记录
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">过去30天的健康汇总</p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
              <div className="flex gap-3">
                <div className="h-8 bg-gray-50 rounded flex-1" />
                <div className="h-8 bg-gray-50 rounded flex-1" />
                <div className="h-8 bg-gray-50 rounded flex-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && days.length === 0 && (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">还没有历史记录</p>
          <p className="text-gray-300 text-xs mt-1">开始记录后，历史会出现在这里</p>
        </div>
      )}

      {/* Day cards */}
      {days.length > 0 && (
        <div className="space-y-2">
          {days.map(day => {
            const isToday = day.date === today
            const sleepH = totalSleepHours(day.sleep)
            const waterMl = day.water?.totalMl || 0
            const meals = getMealSummary(day.entries)

            return (
              <Link key={day.date} href={`/?date=${day.date}`}
                className="block bg-white rounded-xl border border-gray-200 hover:border-teal-200 hover:shadow-sm transition-all">
                {/* Date row */}
                <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{formatDate(day.date)}</span>
                    <span className="text-xs text-gray-400">{getWeekday(day.date)}</span>
                    {isToday && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">今天</span>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>

                {/* Stats row */}
                <div className="px-4 py-2.5 flex gap-4 text-xs">
                  {/* Meals */}
                  <div className="flex items-center gap-1">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-teal-500" />
                    <span className="text-gray-600">{day.entries.length}餐</span>
                    {meals && <span className="text-gray-400">{meals}</span>}
                  </div>

                  {/* Water */}
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" />
                    <span className="text-gray-600">{waterMl > 0 ? `${waterMl}ml` : '—'}</span>
                  </div>

                  {/* Sleep */}
                  <div className="flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-gray-600">{sleepH > 0 ? `${sleepH.toFixed(1)}h` : '—'}</span>
                  </div>
                </div>

                {/* Meal type dots */}
                {day.entries.length > 0 && (
                  <div className="px-4 pb-3 flex gap-1.5">
                    {['breakfast', 'lunch', 'dinner', 'snack'].map(type => {
                      const hasType = day.entries.some(e => e.mealType === type)
                      if (!hasType) return null
                      const colors: Record<string, string> = {
                        breakfast: 'bg-amber-400',
                        lunch: 'bg-sky-400',
                        dinner: 'bg-indigo-400',
                        snack: 'bg-rose-400',
                      }
                      const labels: Record<string, string> = {
                        breakfast: '早',
                        lunch: '午',
                        dinner: '晚',
                        snack: '加',
                      }
                      return (
                        <span key={type} className={`text-white text-[10px] px-1.5 py-0.5 rounded-full ${colors[type] || 'bg-gray-400'}`}>
                          {labels[type] || type}
                        </span>
                      )
                    })}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
