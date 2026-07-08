'use client'

// ============================================================
// Water Entry — 饮水记录（自定义毫升 + 删除单条）
// ============================================================

import { useState } from 'react'
import { Droplets, Plus, X, Loader2 } from 'lucide-react'

interface WaterEntryProps {
  date: string
  logs?: { id: string; time: string; ml: number }[]
  currentMl?: number
  onSaved: () => void
}

const QUICK_ML = [200, 300, 500]
const DAILY_GOAL = 1800

export default function WaterEntry({ date, logs = [], currentMl = 0, onSaved }: WaterEntryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customMl, setCustomMl] = useState('')

  const addWater = async (ml: number) => {
    setIsSubmitting(true)
    try {
      await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, ml }),
      })
      onSaved()
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteLog = async (logId: string) => {
    try {
      await fetch(`/api/water?date=${date}&logId=${logId}`, { method: 'DELETE' })
      onSaved()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleCustom = () => {
    const ml = parseInt(customMl)
    if (ml > 0) {
      addWater(ml)
      setCustomMl('')
      setShowCustom(false)
    }
  }

  const progress = Math.min((currentMl / DAILY_GOAL) * 100, 100)
  const remaining = Math.max(DAILY_GOAL - currentMl, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 text-xs mb-1">
        <Droplets className="w-3.5 h-3.5 text-sky-500" />
        <span className="text-gray-500">
          饮水 <span className="text-sky-600 font-medium">{currentMl}ml</span> / {DAILY_GOAL}ml
        </span>
      </div>

      {/* Progress bar */}
      {currentMl > 0 && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-sky-400 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}

      {/* Quick buttons */}
      <div className="flex gap-1.5 mb-1.5">
        {QUICK_ML.map(ml => (
          <button key={ml} onClick={() => addWater(ml)} disabled={isSubmitting}
            className="flex-1 py-1 rounded-lg bg-sky-50 text-sky-600 text-xs border border-sky-200 hover:bg-sky-100 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-0.5">
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            {ml}
          </button>
        ))}
        <button onClick={() => setShowCustom(!showCustom)}
          className="px-2 py-1 rounded-lg bg-gray-50 text-gray-500 text-xs border border-gray-200 hover:bg-gray-100">
          自定义
        </button>
      </div>

      {/* Custom input */}
      {showCustom && (
        <div className="flex gap-1.5 mb-1.5">
          <input type="number" value={customMl} onChange={e => setCustomMl(e.target.value)}
            placeholder="输入毫升数" autoFocus
            className="flex-1 px-2 py-1 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
            onKeyDown={e => e.key === 'Enter' && handleCustom()} />
          <button onClick={handleCustom} disabled={!customMl || parseInt(customMl) <= 0}
            className="px-3 py-1 rounded-lg bg-sky-600 text-white text-xs disabled:opacity-50">
            添加
          </button>
        </div>
      )}

      {/* Status text */}
      {currentMl > 0 && remaining > 0 && (
        <p className="text-xs text-gray-400">还需 {remaining}ml</p>
      )}
      {currentMl >= DAILY_GOAL && (
        <p className="text-xs text-green-500">✅ 达标！</p>
      )}

      {/* Log history (latest 5) */}
      {logs.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {[...logs].reverse().slice(0, 5).map(log => (
              <span key={log.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 rounded text-xs text-sky-600">
                {log.time.slice(0, 5)} {log.ml}ml
                <button onClick={() => deleteLog(log.id)} className="text-sky-300 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
