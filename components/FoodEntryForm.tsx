'use client'

// ============================================================
// Food Entry Form — 饮食记录（支持拍照识别）
// ============================================================

import { useState, useRef } from 'react'
import { Plus, Loader2, Camera } from 'lucide-react'
import type { MealType } from '@/lib/types'

interface FoodEntryFormProps {
  date: string
  onEntryAdded: () => void
}

const MEAL_OPTIONS: { key: MealType; label: string; icon: string }[] = [
  { key: 'breakfast', label: '早餐', icon: '☀️' },
  { key: 'lunch', label: '午餐', icon: '🌤' },
  { key: 'dinner', label: '晚餐', icon: '🌙' },
  { key: 'snack', label: '加餐', icon: '🍪' },
]

export default function FoodEntryForm({ date, onEntryAdded }: FoodEntryFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mealType, setMealType] = useState<MealType | null>(null)
  const [foodName, setFoodName] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mealType || !foodName.trim()) return
    setIsSubmitting(true)
    try {
      const now = new Date()
      const time = now.toTimeString().slice(0, 5)
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, mealType, foodName: foodName.trim() }),
      })
      setMealType(null)
      setFoodName('')
      setPreview(null)
      setIsOpen(false)
      onEntryAdded()
    } catch {
      alert('保存失败')
    } finally { setIsSubmitting(false) }
  }

  const quickAdd = async (type: MealType, name: string) => {
    const now = new Date()
    const time = now.toTimeString().slice(0, 5)
    setIsSubmitting(true)
    try {
      await fetch('/api/entries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, mealType: type, foodName: name }),
      })
      onEntryAdded()
    } finally { setIsSubmitting(false) }
  }

  // 拍照识别
  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)

    // 压缩图片
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string

      // 显示预览
      setPreview(base64)

      try {
        const res = await fetch('/api/vision', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        })
        const data = await res.json()

        if (data.foodName) {
          setFoodName(data.foodName)
          // 如果AI也推断出餐次，自动选中
          if (data.mealType && MEAL_OPTIONS.some(m => m.key === data.mealType)) {
            setMealType(data.mealType as MealType)
          }
        }
      } catch {
        setFoodName('（识别失败，请手动输入）')
      } finally {
        setIsScanning(false)
      }
    }
    reader.readAsDataURL(file)

    // 重置 input 以便重复拍照
    e.target.value = ''
  }

  return (
    <div className="mb-4">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 active:bg-gray-50 transition-colors text-sm">
        <Plus className="w-4 h-4" />
        {isOpen ? '取消' : '记录饮食 +'}
      </button>

      {isOpen && (
        <div className="mt-3 bg-white rounded-xl p-4 border border-gray-200 space-y-4">
          {/* 选餐次 */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">吃的是哪一餐？</p>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => { setMealType(opt.key); setFoodName('') }}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    mealType === opt.key ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-400 scale-105' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95'
                  }`}>
                  <div className="text-lg">{opt.icon}</div>
                  <div>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 输入食物 */}
          {mealType && (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 拍照按钮 + 输入框 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">吃了什么？</label>
                <div className="flex gap-2">
                  <input type="text" value={foodName} onChange={e => setFoodName(e.target.value)}
                    placeholder="输入食物名称，或点右边拍照" autoFocus required
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isScanning}
                    className="px-3 py-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1 text-sm">
                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    <span className="hidden sm:inline">拍照/相册</span>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*"
                  onChange={handleImageCapture} className="hidden" />
              </div>

              {/* 图片预览 */}
              {preview && (
                <div className="relative">
                  <img src={preview} alt="食物照片" className="w-full h-32 object-cover rounded-xl" />
                  {isScanning && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> AI识别中...</span>
                    </div>
                  )}
                  <button type="button" onClick={() => setPreview(null)} className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">✕</button>
                </div>
              )}

              {/* 快捷选择 */}
              {foodName.length === 0 && !preview && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">快速选择：</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['水煮蛋2个', '豆浆1杯', '粥1碗', '米饭1份', '青菜1份', '鸡腿1个'].map(item => (
                      <button key={item} type="button" onClick={() => setFoodName(item)}
                        className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 text-xs border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all">
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" disabled={isSubmitting || !foodName.trim()}
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</> : '✅ 记录这条'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
