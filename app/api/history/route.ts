import { NextResponse } from 'next/server'
import { getEntriesByDate, getSleepByDate, getWaterByDate } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '14')

  const today = new Date()
  const results = []

  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    const [entries, sleep, water] = await Promise.all([
      getEntriesByDate(dateStr),
      getSleepByDate(dateStr),
      getWaterByDate(dateStr),
    ])

    if (entries.length > 0 || sleep.length > 0 || water) {
      results.push({ date: dateStr, entries, sleep, water })
    }
  }

  return NextResponse.json({ days: results })
}
