import { NextResponse } from 'next/server'
import { getMoodByDate, saveMood } from '@/lib/data-store'
import type { Mood } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  const record = await getMoodByDate(date)
  return NextResponse.json({ record })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, mood } = body
    if (!date || !mood) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const record = await saveMood(date, mood as Mood)
    return NextResponse.json({ record })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
