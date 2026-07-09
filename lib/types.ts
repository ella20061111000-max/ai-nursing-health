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

/** Exercise type / 运动类型 */
export type ExerciseType = 'run' | 'walk' | 'skip' | 'yoga' | 'other'

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  run: '🏃 跑步', walk: '🚶 走路', skip: '跳绳', yoga: '🧘 瑜伽', other: '其他',
}

/** Exercise record / 运动记录 */
export interface ExerciseRecord {
  id: string
  date: string
  type: ExerciseType
  duration: number // minutes
  note?: string
}

/** Mood / 心情 */
export type Mood = 'good' | 'okay' | 'bad'

export const MOOD_OPTIONS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'good', emoji: '😊', label: '好' },
  { value: 'okay', emoji: '😐', label: '一般' },
  { value: 'bad', emoji: '😢', label: '差' },
]

/** Mood record / 心情记录 */
export interface MoodRecord {
  id: string
  date: string
  mood: Mood
}

/** Structured health analysis / 结构化健康分析 */
export interface HealthAnalysis {
  id: string
  date: string
  healthScore: number
  diet: { score: number; summary: string; suggestions: string[] }
  water: { score: number; summary: string; suggestions: string[] }
  sleep: { score: number; summary: string; suggestions: string[] }
  exercise: { score: number; summary: string; suggestions: string[] }
  riskAlerts: string[]
  dailyAdvice: string
  tomorrowAdvice: string
  createdAt: string
}

/** Daily summary / 每日汇总 */
export interface DailySummary {
  date: string
  entries: FoodEntry[]
  water?: WaterRecord
  sleep?: SleepRecord[]
  exercise?: ExerciseRecord[]
  mood?: MoodRecord
  analysis?: HealthAnalysis
}
