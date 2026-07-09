'use client'

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

/** Compress image to reduce upload size / 压缩图片 */
function compressImage(dataUrl: string, maxW = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(maxW / img.width, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, mealType, foodName: foodName.trim() }),
      })
      setMealType(null)
      setFoodName('')
      setPreview(null)
      setIsOpen(false)
      onEntryAdded()
    } catch { alert('保存失败')
    } finally { setIsSubmitting(false) }
  }

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsScanning(true)

    // Read → compress → send
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string
      const compressed = await compressImage(base64)
      setPreview(compressed)

      try {
        const res = await fetch('/api/vision', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: compressed }),
          signal: AbortSignal.timeout(15000), // 15s timeout
        })
        const data = await res.json()
        if (data.foodName && !data.foodName.startsWith('（') && !data.foodName.startsWith('无法')) {
          setFoodName(data.foodName)
          if (data.mealType && MEAL_OPTIONS.some(m => m.key === data.mealType)) {
            setMealType(data.mealType as MealType)
          }
        } else {
          setFoodName('') // keep empty so user can type
        }
      } catch {
        // Silent fail — user can still type manually
      } finally { setIsScanning(false) }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const reset = () => { setMealType(null); setFoodName(''); setPreview(null) }

  return (
    <div className="mb-4">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 active:bg-gray-50 transition-colors text-sm">
        <Plus className="w-4 h-4" />
        {isOpen ? '取消' : '记录饮食 +'}
      </button>

      <div className={`transition-all duration-200 overflow-hidden ${isOpen ? 'mt-3 opacity-100' : 'h-0 opacity-0'}`}>
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
          {/* 选餐次 */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">吃的是哪一餐？</p>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => setMealType(opt.key === mealType ? null : opt.key)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    mealType === opt.key ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-400' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95'
                  }`}>
                  <div className="text-lg">{opt.icon}</div>
                  <div>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 输入食物 — 预占空间，不再跳动 */}
          <div className="min-h-[200px]">
            <div className={`transition-all duration-200 ${mealType ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">吃了什么？</label>
                  <div className="flex gap-2">
                    <input type="text" value={foodName} onChange={e => setFoodName(e.target.value)}
                      placeholder={mealType ? '输入食物名称，或点右边拍照' : '请先选择餐次'}
                      disabled={!mealType}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-50 disabled:text-gray-300" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isScanning || !mealType}
                      className="px-3 py-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1 text-sm">
                      {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageCapture} className="hidden" />
                </div>

                {/* 图片预览 */}
                {preview && (
                  <div className="relative">
                    <img src={preview} alt="食物" className="w-full h-32 object-cover rounded-xl bg-gray-100" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                        <span className="text-white text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> AI识别中...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 快捷选择 — 只在未选照片时显示 */}
                {foodName.length === 0 && !preview && mealType && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">快速选择：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['水煮蛋2个', '豆浆1杯', '粥1碗', '米饭1份', '青菜1份', '鸡腿1个', '苹果1个', '酸奶1杯'].map(item => (
                        <button key={item} type="button" onClick={() => setFoodName(item)}
                          className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 text-xs border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all">
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" disabled={isSubmitting || !foodName.trim() || !mealType}
                  className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</> : '✅ 记录这条'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
