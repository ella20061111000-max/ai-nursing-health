'use client'

// ============================================================
// Food Entry Form — 饮食记录输入表单（简化版）
// ============================================================

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import type { MealType } from '@/lib/types'

interface FoodEntryFormProps {
  date: string
  onEntryAdded: () => void
}

// Quick meal type buttons / 快捷餐次按钮
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mealType || !foodName.trim()) return

    setIsSubmitting(true)
    try {
      const now = new Date()
      const time = now.toTimeString().slice(0, 5)

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          time,
          mealType,
          foodName: foodName.trim(),
        }),
      })

      if (!res.ok) throw new Error('Failed to save')

      setMealType(null)
      setFoodName('')
      setIsOpen(false)
      onEntryAdded()
    } catch (err) {
      console.error('Failed to add entry:', err)
      alert('保存失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick add a preset entry / 快捷输入预设食物
  const quickAdd = async (type: MealType, name: string) => {
    const now = new Date()
    const time = now.toTimeString().slice(0, 5)

    setIsSubmitting(true)
    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, mealType: type, foodName: name }),
      })
      onEntryAdded()
    } catch (err) {
      console.error('Failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mb-4">
      {/* Add button / 添加按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 active:bg-gray-50 transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        {isOpen ? '取消 Cancel' : '记录饮食 +'}
      </button>

      {isOpen && (
        <div className="mt-3 bg-white rounded-xl p-4 border border-gray-200 space-y-4">
          {/* Step 1: Pick meal type / 第一步：选餐次 */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">吃的是哪一餐？</p>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setMealType(opt.key)
                    setFoodName('')
                  }}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    mealType === opt.key
                      ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-400 scale-105'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95'
                  }`}
                >
                  <div className="text-lg">{opt.icon}</div>
                  <div>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Enter food / 第二步：输入食物 */}
          {mealType && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  吃了什么？
                </label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="水煮蛋2个、南瓜小米粥1碗"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  把数量和食物写在一起就行，不用分开填
                </p>
              </div>

              {/* Quick common foods / 常吃快捷选择 */}
              {foodName.length === 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">快速选择：</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['水煮蛋2个', '豆浆1杯', '粥1碗', '米饭1份', '青菜1份', '鸡腿1个'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setFoodName(item)}
                        className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 text-xs border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !foodName.trim()}
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</>
                ) : (
                  '✅ 记录这条'
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
