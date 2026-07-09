'use client'

import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { EXERCISE_LABELS } from '@/lib/types'
import type { ExerciseType } from '@/lib/types'

interface Props {
  date: string
  records: { id: string; type: string; duration: number }[]
  onSaved: () => void
}

export default function ExerciseEntry({ date, records = [], onSaved }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<ExerciseType>('walk')
  const [duration, setDuration] = useState('30')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
    if (!duration || Number(duration) <= 0) return
    setIsSubmitting(true)
    try {
      await fetch('/api/exercise', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, type, duration: Number(duration) }),
      })
      setIsOpen(false)
      setType('walk')
      setDuration('30')
      onSaved()
    } finally { setIsSubmitting(false) }
  }

  const del = async (id: string) => {
    await fetch(`/api/exercise?id=${id}`, { method: 'DELETE' })
    onSaved()
  }

  const totalMin = records.reduce((s, r) => s + r.duration, 0)

  return (
    <div>
      <div className="flex items-center gap-2 text-xs mb-1">
        <span className="text-sm">🏃</span>
        <span className="text-gray-500">运动</span>
        {totalMin > 0 && <span className="font-medium text-gray-800">{totalMin}分钟</span>}
      </div>

      {records.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {records.map(r => (
            <span key={r.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full text-xs">
              {r.type} {r.duration}分钟
              <button onClick={() => del(r.id)} className="opacity-40 hover:opacity-100"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="text-xs text-gray-400 hover:text-green-600">+ 记录运动</button>
      ) : (
        <div className="mt-1 p-2.5 bg-green-50 rounded-xl border border-green-200 space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            {(Object.entries(EXERCISE_LABELS) as [ExerciseType, string][]).map(([k, v]) => (
              <button key={k} onClick={() => setType(k)}
                className={`px-2 py-1 rounded-lg text-xs border ${type === k ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)}
              className="flex-1 px-2 py-1 rounded-lg border border-gray-200 text-xs" placeholder="分钟" min="1" />
            <button onClick={submit} disabled={isSubmitting || !duration}
              className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : '保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
