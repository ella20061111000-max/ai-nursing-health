'use client'

// ============================================================
// Food Entry Card — 饮食记录卡片
// ============================================================

import { Trash2, Clock, Utensils } from 'lucide-react'
import type { FoodEntry } from '@/lib/types'
import { MEAL_TYPE_LABELS } from '@/lib/types'

interface FoodEntryCardProps {
  entry: FoodEntry
  onDelete: (id: string) => void
}

export default function FoodEntryCard({ entry, onDelete }: FoodEntryCardProps) {
  const mealLabel = MEAL_TYPE_LABELS[entry.mealType]

  // Color coding by meal type / 按餐次配色
  const mealColor: Record<string, string> = {
    breakfast: 'bg-amber-50 border-amber-200 text-amber-700',
    lunch: 'bg-sky-50 border-sky-200 text-sky-700',
    dinner: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    snack: 'bg-rose-50 border-rose-200 text-rose-700',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        {/* Left / 左侧信息 */}
        <div className="flex-1 min-w-0">
          {/* Meal type badge + Time / 餐次标签 + 时间 */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${mealColor[entry.mealType] || 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              <Utensils className="w-3 h-3" />
              {mealLabel}
            </span>
            <span className="flex items-center gap-0.5 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {entry.time}
            </span>
          </div>

          {/* Food name / 食物名称 */}
          <h3 className="font-medium text-gray-900 text-sm leading-snug">
            {entry.foodName}
          </h3>

          {/* Portion + Notes / 份量和备注 */}
          {(entry.portion || entry.notes) && (
            <div className="flex flex-wrap gap-2 mt-1">
              {entry.portion && (
                <span className="text-xs text-gray-500">
                  份量 Portion: {entry.portion}
                </span>
              )}
              {entry.notes && (
                <span className="text-xs text-gray-400">
                  📝 {entry.notes}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Delete button / 删除按钮 */}
        <button
          onClick={() => onDelete(entry.id)}
          className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="删除 Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
