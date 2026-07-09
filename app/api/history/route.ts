import { NextResponse } from 'next/server'
import { getEntriesByDate, getSleepByDate, getWaterByDate, getExerciseByDate, getMoodByDate } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  const today = new Date()
  const results = []

  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    const [entries, sleep, water, exercise, mood] = await Promise.all([
      getEntriesByDate(dateStr), getSleepByDate(dateStr), getWaterByDate(dateStr),
      getExerciseByDate(dateStr), getMoodByDate(dateStr),
    ])

    // Only include dates that have at least some data
    if (entries.length > 0 || sleep.length > 0 || water || exercise.length > 0 || mood) {
      results.push({
        date: dateStr,
        entries: entries.map(e => ({ mealType: e.mealType, foodName: e.foodName })),
        sleep: sleep.map(s => ({ type: s.type, duration: s.duration })),
        water: water ? { totalMl: water.totalMl } : null,
        exercise: exercise.map(e => ({ type: e.type, duration: e.duration })),
        mood: mood ? { mood: mood.mood } : null,
      })
    }
  }

  return NextResponse.json({ days: results })
}
