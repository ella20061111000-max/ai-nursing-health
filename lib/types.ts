// ============================================================
// AI Nursing Health Companion — Type Definitions
// 护理健康管家 — 类型定义
// ============================================================

/** Meal type / 餐次 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '早餐 Breakfast',
  lunch: '午餐 Lunch',
  dinner: '晚餐 Dinner',
  snack: '加餐 Snack',
}

/** A single food entry / 一条饮食记录 */
export interface FoodEntry {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  mealType: MealType
  foodName: string // 食物名称
  portion?: string // 份量（可选）
  notes?: string // 备注（可选）
  createdAt: string // ISO timestamp
}

/** AI analysis result / AI 分析结果 */
export interface AIAnalysis {
  id: string
  date: string
  entryIds: string[] // 分析覆盖的饮食记录ID
  overallScore: number // 0-100 总体评分
  summary: string // 总体评价
  details: {
    calories: AnalysisItem
    protein: AnalysisItem
    carbs: AnalysisItem
    fat: AnalysisItem
    fiber: AnalysisItem
    sodium: AnalysisItem
    sugar: AnalysisItem
    water: AnalysisItem
  }
  suggestions: string[] // 改进建议
  strengths: string[] // 做得好的地方
  topAdvice: string // 最重要的一条建议
  createdAt: string
}

export interface AnalysisItem {
  status: 'good' | 'fair' | 'needs_improvement'
  label: string
  labelCn: string
  comment: string
}

/** Water intake record / 饮水记录 */
export interface WaterRecord {
  date: string
  totalMl: number
  logs: { id: string; time: string; ml: number }[]
}

/** Sleep type / 睡眠类型 */
export type SleepType = 'night' | 'nap'

/** Sleep record / 睡眠记录 */
export interface SleepRecord {
  id: string
  date: string
  type: SleepType
  bedTime: string // HH:mm
  wakeTime: string // HH:mm
  duration: number // hours
  quality: number // 1-10
  note?: string
}

/** Daily summary / 每日汇总 */
export interface DailySummary {
  date: string
  entries: FoodEntry[]
  water?: WaterRecord
  sleep?: SleepRecord
  analysis?: AIAnalysis
}
