import { NextResponse } from 'next/server'
import { getEntriesByDate, getSleepByDate, getWaterByDate, getTodayDate } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || getTodayDate()

  const [entries, sleep, water] = await Promise.all([
    getEntriesByDate(date),
    getSleepByDate(date),
    getWaterByDate(date),
  ])

  return NextResponse.json({ date, entries, sleep, water })
}
