'use client'

import { useState, useEffect, useCallback } from 'react'
import { UtensilsCrossed, Droplets, Moon, X } from 'lucide-react'
import type { FoodEntry, SleepRecord, WaterRecord, ExerciseRecord, MoodRecord } from '@/lib/types'
import FoodEntryForm from '@/components/FoodEntryForm'
import FoodEntryCard from '@/components/FoodEntryCard'
import AIAnalysisCard from '@/components/AIAnalysisCard'
import WaterEntry from '@/components/WaterEntry'
import SleepEntry from '@/components/SleepEntry'
import ExerciseEntry from '@/components/ExerciseEntry'
import MoodEntry from '@/components/MoodEntry'

function getTodayStr() { return new Date().toISOString().split('T')[0] }

function formatDateCN(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}月${d.getDate()}日 周${['日','一','二','三','四','五','六'][d.getDay()]}`
}

export default function HomePage() {
  const [date, setDate] = useState(getTodayStr)
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([])
  const [water, setWater] = useState<WaterRecord | null>(null)
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([])
  const [mood, setMood] = useState<MoodRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [panel, setPanel] = useState<'water' | 'sleep' | 'exercise' | null>(null)

  const fetchAllData = useCallback(async () => {
    if (!date) return
    try {
      const res = await fetch(`/api/day?date=${date}`)
      const data = await res.json()
      setEntries(data.entries || [])
      setSleepRecords(data.sleep || [])
      setWater(data.water || null)
      setExerciseRecords(data.exercise || [])
      setMood(data.mood || null)
    } catch (err) { console.error('Failed:', err)
    } finally { setIsLoading(false) }
  }, [date])

  useEffect(() => { fetchAllData() }, [fetchAllData])

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/entries?id=${id}`, { method: 'DELETE' })
    if (res.ok) setEntries(prev => prev.filter(e => e.id !== id))
  }

  const changeDate = (delta: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().split('T')[0])
  }

  const today = getTodayStr()
  const isToday = date === today
  const totalSleep = sleepRecords.reduce((s, r) => s + r.duration, 0)
  const totalExercise = exerciseRecords.reduce((s, r) => s + r.duration, 0)

  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'] as const
  const mealLabels: Record<string, string> = { breakfast: '☀️ 早餐', lunch: '🌤 午餐', dinner: '🌙 晚餐', snack: '🍪 加餐' }
  const grouped = mealOrder.map(t => ({ type: t, label: mealLabels[t], items: entries.filter(e => e.mealType === t) })).filter(g => g.items.length > 0)
  const hasNoEntries = !isLoading && entries.length === 0

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      {/* Date nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeDate(-1)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100">←</button>
        <div className="text-center">
          <div className="text-base font-semibold text-gray-900">{isToday ? '今天' : date?.split('-').slice(1).join('/')}</div>
          <div className="text-[11px] text-gray-400">{formatDateCN(date)}</div>
        </div>
        <button onClick={() => changeDate(1)} disabled={isToday} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-30">→</button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
          <UtensilsCrossed className="w-4 h-4 text-teal-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{entries.length}</div>
          <div className="text-[10px] text-gray-400">饮食</div>
        </div>
        <button onClick={() => setPanel('water')}
          className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm active:scale-95 transition-all hover:border-sky-200">
          <Droplets className="w-4 h-4 text-sky-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{water ? water.totalMl : '—'}</div>
          <div className="text-[10px] text-gray-400">饮水</div>
        </button>
        <button onClick={() => setPanel('sleep')}
          className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm active:scale-95 transition-all hover:border-indigo-200">
          <Moon className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{totalSleep > 0 ? totalSleep.toFixed(1) : '—'}</div>
          <div className="text-[10px] text-gray-400">睡眠</div>
        </button>
        <button onClick={() => setPanel('exercise')}
          className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm active:scale-95 transition-all hover:border-green-200">
          <span className="text-lg">🏃</span>
          <div className="text-lg font-bold text-gray-900">{totalExercise > 0 ? totalExercise : '—'}</div>
          <div className="text-[10px] text-gray-400">运动</div>
        </button>
      </div>

      {/* Mood */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm mb-4">
        <MoodEntry date={date} current={mood?.mood} onSaved={fetchAllData} />
      </div>

      {/* Food diary */}
      <div className="mb-5">
        <FoodEntryForm date={date} onEntryAdded={fetchAllData} />
        {isLoading && <div className="animate-pulse space-y-2 mt-3"><div className="h-4 bg-gray-100 rounded w-16" /><div className="h-14 bg-gray-50 rounded-xl" /><div className="h-14 bg-gray-50 rounded-xl" /></div>}
        {hasNoEntries && <div className="text-center py-10 mt-2"><UtensilsCrossed className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">暂无饮食记录</p></div>}
        {grouped.map(group => (
          <div key={group.type} className="mt-4">
            <h2 className="text-xs font-medium text-gray-500 mb-2">{group.label}</h2>
            <div className="space-y-1.5">{group.items.map(entry => <FoodEntryCard key={entry.id} entry={entry} onDelete={handleDelete} />)}</div>
          </div>
        ))}
      </div>

      {/* Bottom panel */}
      {panel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center touch-none">
          <div className="absolute inset-0 bg-black/20" onClick={() => setPanel(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 p-5 shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                {panel === 'water' ? '💧 饮水' : panel === 'sleep' ? '🌙 睡眠' : '🏃 运动'}
              </h3>
              <button onClick={() => setPanel(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            {panel === 'water' && <WaterEntry date={date} logs={water?.logs || []} currentMl={water?.totalMl} onSaved={fetchAllData} />}
            {panel === 'sleep' && <SleepEntry date={date} records={sleepRecords} onSaved={fetchAllData} />}
            {panel === 'exercise' && <ExerciseEntry date={date} records={exerciseRecords} onSaved={fetchAllData} />}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <div><AIAnalysisCard date={date} entriesCount={entries.length} analysis={null} /></div>
    </div>
  )
}
