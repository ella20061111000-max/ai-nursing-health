'use client'

import { MOOD_OPTIONS } from '@/lib/types'
import type { Mood } from '@/lib/types'

interface Props {
  date: string
  current?: string | null
  onSaved: () => void
}

export default function MoodEntry({ date, current, onSaved }: Props) {
  const setMood = async (mood: Mood) => {
    await fetch('/api/mood', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, mood }),
    })
    onSaved()
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-xs mb-1">
        <span className="text-sm">😊</span>
        <span className="text-gray-500">心情</span>
        {current && (
          <span className="text-lg">{MOOD_OPTIONS.find(m => m.value === current)?.emoji}</span>
        )}
      </div>
      <div className="flex gap-2 mt-1">
        {MOOD_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => setMood(opt.value)}
            className={`flex-1 py-1.5 rounded-lg text-sm border transition-all active:scale-95 ${
              current === opt.value
                ? 'bg-yellow-100 border-yellow-300 scale-105'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}>
            <div>{opt.emoji}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
