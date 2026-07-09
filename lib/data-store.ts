// ============================================================
// Data Store — Supabase Cloud Database
// 数据存储 — Supabase 云端数据库
// ============================================================

import { supabase } from './supabase'
import type { FoodEntry, SleepRecord, WaterRecord, ExerciseRecord, MoodRecord, Mood, HealthAnalysis } from './types'

// --- Helpers ---

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// ============================================================
// Food Entries / 饮食记录
// ============================================================

export async function getEntriesByDate(date: string): Promise<FoodEntry[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('date', date)
    .order('time', { ascending: true })

  if (error) {
    console.error('Supabase error:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    date: row.date,
    time: row.time,
    mealType: row.meal_type,
    foodName: row.food_name,
    portion: row.portion || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  }))
}

export async function createEntry(entry: Omit<FoodEntry, 'id' | 'createdAt'>): Promise<FoodEntry> {
  const newEntry = {
    id: generateId(),
    date: entry.date,
    time: entry.time,
    meal_type: entry.mealType,
    food_name: entry.foodName,
    portion: entry.portion || null,
    notes: entry.notes || null,
    created_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('food_entries').insert([newEntry])
  if (error) console.error('Supabase error:', error)

  return {
    id: newEntry.id,
    date: newEntry.date,
    time: newEntry.time,
    mealType: newEntry.meal_type as FoodEntry['mealType'],
    foodName: newEntry.food_name,
    portion: newEntry.portion || undefined,
    notes: newEntry.notes || undefined,
    createdAt: newEntry.created_at,
  }
}

export async function deleteEntry(id: string): Promise<boolean> {
  const { error } = await supabase.from('food_entries').delete().eq('id', id)
  return !error
}

// ============================================================
// Sleep Records / 睡眠记录
// ============================================================

export async function getSleepByDate(date: string): Promise<SleepRecord[]> {
  const { data, error } = await supabase
    .from('sleep_records')
    .select('*')
    .eq('date', date)

  if (error) {
    console.error('Supabase error:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    date: row.date,
    type: row.type,
    bedTime: row.bed_time,
    wakeTime: row.wake_time,
    duration: row.duration,
    quality: row.quality,
    note: row.note || undefined,
  }))
}

export async function saveSleepRecord(record: Omit<SleepRecord, 'id'> & { id?: string }): Promise<SleepRecord> {
  const full = { ...record, id: record.id || generateId() }
  const dbRow = {
    id: full.id,
    date: full.date,
    type: full.type,
    bed_time: full.bedTime,
    wake_time: full.wakeTime,
    duration: full.duration,
    quality: full.quality,
    note: full.note || null,
  }

  const { error } = await supabase.from('sleep_records').upsert([dbRow], { onConflict: 'id' })
  if (error) console.error('Supabase error:', error)

  return full as SleepRecord
}

export async function deleteSleepRecord(id: string): Promise<boolean> {
  const { error } = await supabase.from('sleep_records').delete().eq('id', id)
  return !error
}

// ============================================================
// Water Records / 饮水记录
// ============================================================

export async function getWaterByDate(date: string): Promise<WaterRecord | null> {
  const { data: logs, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('date', date)
    .order('time', { ascending: true })

  if (error) {
    console.error('Supabase error:', error)
    return null
  }

  if (!logs || logs.length === 0) return null

  const totalMl = logs.reduce((sum: number, l: any) => sum + l.ml, 0)
  return {
    date,
    totalMl,
    logs: logs.map((l: any) => ({ id: l.id, time: l.time, ml: l.ml })),
  }
}

export async function addWaterLog(date: string, time: string, ml: number): Promise<WaterRecord> {
  const id = generateId()
  const { error } = await supabase.from('water_logs').insert([{ id, date, time, ml }])
  if (error) console.error('Supabase error:', error)

  // Get updated record
  const record = await getWaterByDate(date)
  return record || { date, totalMl: ml, logs: [{ id, time, ml }] }
}

export async function deleteWaterLog(date: string, logId: string): Promise<WaterRecord | null> {
  const { error } = await supabase.from('water_logs').delete().eq('id', logId)
  if (error) console.error('Supabase error:', error)

  return getWaterByDate(date)
}

export async function resetWater(date: string): Promise<void> {
  await supabase.from('water_logs').delete().eq('date', date)
}

// ============================================================
// Exercise Records / 运动记录
// ============================================================

export async function getExerciseByDate(date: string): Promise<ExerciseRecord[]> {
  const { data, error } = await supabase.from('exercise_records').select('*').eq('date', date)
  if (error) { console.error(error); return [] }
  return (data || []).map((r: any) => ({ id: r.id, date: r.date, type: r.type, duration: r.duration, note: r.note || undefined }))
}

export async function saveExercise(record: Omit<ExerciseRecord, 'id'>): Promise<ExerciseRecord> {
  const full = { ...record, id: generateId() }
  const { error } = await supabase.from('exercise_records').insert([{ id: full.id, date: full.date, type: full.type, duration: full.duration, note: full.note || null }])
  if (error) console.error(error)
  return full as ExerciseRecord
}

export async function deleteExercise(id: string): Promise<boolean> {
  const { error } = await supabase.from('exercise_records').delete().eq('id', id)
  return !error
}

// ============================================================
// Mood Records / 心情记录
// ============================================================

export async function getMoodByDate(date: string): Promise<MoodRecord | null> {
  const { data, error } = await supabase.from('mood_records').select('*').eq('date', date).limit(1).single()
  if (error) return null
  return data ? { id: data.id, date: data.date, mood: data.mood as Mood } : null
}

export async function saveMood(date: string, mood: Mood): Promise<MoodRecord> {
  // Delete existing, then insert
  await supabase.from('mood_records').delete().eq('date', date)
  const id = generateId()
  const { error } = await supabase.from('mood_records').insert([{ id, date, mood }])
  if (error) console.error(error)
  return { id, date, mood }
}

// ============================================================
// Health Analysis / 健康分析
// ============================================================

export async function getAnalysisByDate(date: string): Promise<HealthAnalysis | null> {
  const { data, error } = await supabase.from('health_analyses').select('*').eq('date', date).limit(1).single()
  if (error || !data) return null
  return { id: data.id, date: data.date, healthScore: data.health_score, ...data.analysis_json, createdAt: data.created_at }
}

export async function saveAnalysis(analysis: Omit<HealthAnalysis, 'id'>): Promise<HealthAnalysis> {
  // Delete existing for date, then insert
  await supabase.from('health_analyses').delete().eq('date', analysis.date)
  const id = generateId()
  const { error } = await supabase.from('health_analyses').insert([{
    id, date: analysis.date, health_score: analysis.healthScore,
    analysis_json: {
      diet: analysis.diet, water: analysis.water, sleep: analysis.sleep,
      exercise: analysis.exercise, riskAlerts: analysis.riskAlerts,
      dailyAdvice: analysis.dailyAdvice, tomorrowAdvice: analysis.tomorrowAdvice,
    },
    created_at: new Date().toISOString(),
  }])
  if (error) console.error(error)
  return { ...analysis, id, createdAt: new Date().toISOString() }
}
