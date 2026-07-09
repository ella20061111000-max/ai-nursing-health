import { NextResponse } from 'next/server'
import { getEntriesByDate, getSleepByDate, getWaterByDate, getExerciseByDate, getMoodByDate, getAnalysisByDate, getTodayDate } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || getTodayDate()

  const [entries, sleep, water, exercise, mood, analysis] = await Promise.all([
    getEntriesByDate(date), getSleepByDate(date), getWaterByDate(date),
    getExerciseByDate(date), getMoodByDate(date), getAnalysisByDate(date),
  ])

  return NextResponse.json({ date, entries, sleep, water, exercise, mood, analysis })
}
