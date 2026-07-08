'use client'

// ============================================================
// Sleep Entry — 睡眠记录（三步自解释流程）
// 设计原则：不需要说明书，用户看到就知道怎么用
// ============================================================

import { useState } from 'react'
import { Moon, Sun, X, ChevronRight } from 'lucide-react'
import type { SleepType } from '@/lib/types'

interface SleepRecordItem {
  id: string
  type: SleepType
  bedTime: string
  wakeTime: string
  duration: number
  quality: number
}

interface SleepEntryProps {
  date: string
  records?: SleepRecordItem[]
  onSaved: () => void
}

export default function SleepEntry({ date, records = [], onSaved }: SleepEntryProps) {
  const [step, setStep] = useState<'idle' | 'type' | 'time' | 'quality'>('idle')
  const [sleepType, setSleepType] = useState<SleepType | null>(null)
  const [bedTime, setBedTime] = useState('23:30')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate default times based on current time
  const initDefaults = (type: SleepType) => {
    const now = new Date()
    const h = now.getHours()
    const m = now.getMinutes()
    const pad = (n: number) => n.toString().padStart(2, '0')

    if (type === 'night') {
      // If before noon, assume woke up recently; if evening, assume going to bed
      if (h < 12) {
        setBedTime(`${pad(h - 8)}:${pad(m)}`)
        setWakeTime(`${pad(h)}:${pad(m)}`)
      } else {
        setBedTime('23:30')
        setWakeTime('07:00')
      }
    } else {
      // Nap: assume recent 30min nap
      const startH = h - 1
      setBedTime(`${pad(startH > 0 ? startH : 12)}:${pad(m)}`)
      setWakeTime(`${pad(h)}:${pad(m)}`)
    }
  }

  const selectType = (type: SleepType) => {
    setSleepType(type)
    initDefaults(type)
    setStep('time')
  }

  const saveWithQuality = async (quality: number) => {
    if (!sleepType) return
    setIsSubmitting(true)
    try {
      await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, type: sleepType, bedTime, wakeTime, quality }),
      })
      reset()
      onSaved()
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setStep('idle')
    setSleepType(null)
    setBedTime('23:30')
    setWakeTime('07:00')
  }

  const deleteRecord = async (id: string) => {
    try {
      await fetch(`/api/sleep?id=${id}`, { method: 'DELETE' })
      onSaved()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const totalNight = records.filter(r => r.type === 'night').reduce((s, r) => s + r.duration, 0)
  const totalNap = records.filter(r => r.type === 'nap').reduce((s, r) => s + r.duration, 0)

  return (
    <div>
      {/* Header — 一目了然看到今日睡眠情况 */}
      <div className="flex items-center gap-2 text-xs mb-2">
        <Moon className="w-3.5 h-3.5 text-indigo-500" />
        <span className="font-medium text-gray-700">睡眠</span>
        <span className="text-gray-400">|</span>
        {records.length > 0 ? (
          <>
            {totalNight > 0 && (
              <span className="text-indigo-600 font-medium">
                🌙 夜 {totalNight.toFixed(1)}h
              </span>
            )}
            {totalNap > 0 && (
              <span className="text-amber-600 font-medium ml-1">
                ☀️ 小憩 {totalNap.toFixed(1)}h
              </span>
            )}
            <span className="text-gray-400 ml-1">
              共{(totalNight + totalNap).toFixed(1)}h
            </span>
          </>
        ) : (
          <span className="text-gray-300">今日未记录</span>
        )}
      </div>

      {/* Existing records — 已记录列表 */}
      {records.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {records.map(r => (
            <span key={r.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              r.type === 'night' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {r.type === 'night' ? '🌙' : '☀️'}
              {r.bedTime}-{r.wakeTime}
              <span className="opacity-60">{r.duration.toFixed(1)}h</span>
              <button onClick={() => deleteRecord(r.id)} className="opacity-40 hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Show record button or current step */}
      {step === 'idle' && (
        <button onClick={() => setStep('type')}
          className="w-full py-2 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all">
          + 记录一段睡眠
        </button>
      )}

      {/* Step 1: Choose type / 选类型 */}
      {step === 'type' && (
        <div className="p-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 space-y-2">
          <p className="text-xs font-medium text-gray-700">这次是？</p>
          <div className="flex gap-2">
            <button onClick={() => selectType('night')}
              className="flex-1 py-3 rounded-xl bg-white border border-indigo-200 text-center hover:bg-indigo-100 transition-all active:scale-95">
              <div className="text-lg">🌙</div>
              <div className="text-xs font-medium text-gray-700">夜间睡眠</div>
            </button>
            <button onClick={() => selectType('nap')}
              className="flex-1 py-3 rounded-xl bg-white border border-amber-200 text-center hover:bg-amber-100 transition-all active:scale-95">
              <div className="text-lg">☀️</div>
              <div className="text-xs font-medium text-gray-700">午睡/小憩</div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Adjust time / 调时间 */}
      {step === 'time' && (
        <div className="p-3 rounded-xl border-2 border-indigo-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-700">
              {sleepType === 'night' ? '🌙 夜间睡眠' : '☀️ 午睡/小憩'}
            </p>
            <button onClick={reset} className="text-[10px] text-gray-400 hover:text-gray-600">重新选择</button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 mb-0.5 block">开始</label>
              <input type="time" value={bedTime}
                onChange={e => setBedTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <span className="text-gray-300 mt-5">→</span>
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 mb-0.5 block">结束</label>
              <input type="time" value={wakeTime}
                onChange={e => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>

          <button onClick={() => setStep('quality')}
            className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors">
            下一步：感觉怎么样？
          </button>
        </div>
      )}

      {/* Step 3: Rate quality / 评估质量（最终步，点击即保存） */}
      {step === 'quality' && (
        <div className="p-3 rounded-xl border-2 border-indigo-200 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-700">
              {sleepType === 'night' ? '🌙' : '☀️'} {bedTime} → {wakeTime}
            </p>
            <button onClick={() => setStep('time')} className="text-[10px] text-gray-400 hover:text-gray-600">修改时间</button>
          </div>
          <p className="text-xs text-gray-500">睡得怎么样？</p>
          <div className="flex gap-2">
            {[
              { value: 3, label: '😴 好', desc: '精神饱满' },
              { value: 2, label: '🙂 一般', desc: '还算可以' },
              { value: 1, label: '😰 差', desc: '没睡好' },
            ].map(q => (
              <button key={q.value} onClick={() => saveWithQuality(q.value)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 transition-all active:scale-95">
                <div className="text-sm">{q.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{q.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
