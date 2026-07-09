'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, ChevronRight, Moon, Droplets, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

interface DaySummary {
  date: string
  entries: { mealType: string; foodName: string }[]
  sleep: { type: string; duration: number }[]
  water: { totalMl: number } | null
  exercise: { type: string; duration: number }[]
  mood: { mood: string } | null
}

export default function HistoryPage() {
  const [days, setDays] = useState<DaySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/history?days=30')
      const data = await res.json()
      setDays(data.days || [])
    } catch { console.error('Failed')
    } finally { setIsLoading(false) }
  }

  const getWeekday = (dateStr: string) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(dateStr).getDay()]
  const totalSleep = (records: { type: string; duration: number }[]) => records.reduce((s, r) => s + r.duration, 0)
  const totalExercise = (records: { duration: number }[]) => records.reduce((s, r) => s + r.duration, 0)
  const moodEmoji: Record<string, string> = { good: '😊', okay: '😐', bad: '😢' }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-teal-600" />
          历史记录
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">过去30天的健康汇总</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"><div className="h-4 bg-gray-100 rounded w-24 mb-3" /><div className="flex gap-3"><div className="h-8 bg-gray-50 rounded flex-1" /><div className="h-8 bg-gray-50 rounded flex-1" /><div className="h-8 bg-gray-50 rounded flex-1" /></div></div>)}
        </div>
      )}

      {!isLoading && days.length === 0 && (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">还没有历史记录</p>
        </div>
      )}

      {days.length > 0 && (
        <div className="space-y-2">
          {days.map(day => {
            const isToday = day.date === today
            const sleepH = totalSleep(day.sleep)
            const waterMl = day.water?.totalMl || 0
            const exerciseMin = totalExercise(day.exercise)
            const mood = day.mood?.mood ? moodEmoji[day.mood.mood] || '' : ''

            return (
              <Link key={day.date} href={`/?date=${day.date}`}
                className="block bg-white rounded-xl border border-gray-200 hover:border-teal-200 hover:shadow-sm transition-all">
                <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{day.date.split('-').slice(1).join('/')}</span>
                    <span className="text-xs text-gray-400">{getWeekday(day.date)}</span>
                    {isToday && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">今天</span>}
                    {mood && <span className="text-sm">{mood}</span>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
                <div className="px-4 py-2.5 flex gap-3 text-xs">
                  <span className="flex items-center gap-1"><UtensilsCrossed className="w-3.5 h-3.5 text-teal-500" /><span className="text-gray-600">{day.entries.length}餐</span></span>
                  <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-sky-500" /><span className="text-gray-600">{waterMl > 0 ? `${waterMl}ml` : '—'}</span></span>
                  <span className="flex items-center gap-1"><Moon className="w-3.5 h-3.5 text-indigo-500" /><span className="text-gray-600">{sleepH > 0 ? `${sleepH.toFixed(1)}h` : '—'}</span></span>
                  <span className="flex items-center gap-1"><span className="text-sm">🏃</span><span className="text-gray-600">{exerciseMin > 0 ? `${exerciseMin}分钟` : '—'}</span></span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
