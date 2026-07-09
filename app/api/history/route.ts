import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  // Calculate date range
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  // Batch query ALL data at once — only 5 queries total
  const [entriesRes, sleepRes, waterRes, exerciseRes, moodRes] = await Promise.all([
    supabase.from('food_entries').select('date,meal_type,food_name').gte('date', startStr).lte('date', endStr).order('date', { ascending: false }),
    supabase.from('sleep_records').select('date,type,duration').gte('date', startStr).lte('date', endStr).order('date', { ascending: false }),
    supabase.from('water_logs').select('date,ml').gte('date', startStr).lte('date', endStr),
    supabase.from('exercise_records').select('date,type,duration').gte('date', startStr).lte('date', endStr).order('date', { ascending: false }),
    supabase.from('mood_records').select('date,mood').gte('date', startStr).lte('date', endStr),
  ])

  // Group by date
  const dateMap = new Map<string, any>()

  // Initialize a date entry for each day in the range
  for (let i = 0; i < days; i++) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    dateMap.set(ds, { date: ds, entries: [], sleep: [], water: null, exercise: [], mood: null })
  }

  // Fill in data
  for (const e of (entriesRes.data || [])) {
    const day = dateMap.get(e.date)
    if (day) day.entries.push({ mealType: e.meal_type, foodName: e.food_name })
  }
  for (const s of (sleepRes.data || [])) {
    const day = dateMap.get(s.date)
    if (day) day.sleep.push({ type: s.type, duration: s.duration })
  }
  for (const w of (waterRes.data || [])) {
    const day = dateMap.get(w.date)
    if (day) {
      if (!day.water) day.water = { totalMl: 0 }
      day.water.totalMl += w.ml
    }
  }
  for (const ex of (exerciseRes.data || [])) {
    const day = dateMap.get(ex.date)
    if (day) day.exercise.push({ type: ex.type, duration: ex.duration })
  }
  for (const m of (moodRes.data || [])) {
    const day = dateMap.get(m.date)
    if (day) day.mood = { mood: m.mood }
  }

  // Filter out dates with no data at all
  const results = Array.from(dateMap.values()).filter(d =>
    d.entries.length > 0 || d.sleep.length > 0 || d.water || d.exercise.length > 0 || d.mood
  )

  return NextResponse.json({ days: results })
}
