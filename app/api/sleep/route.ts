// ============================================================
// API: /api/sleep — Sleep Record / 睡眠记录
// ============================================================

import { NextResponse } from 'next/server'
import { getSleepByDate, saveSleepRecord, deleteSleepRecord } from '@/lib/data-store'
import type { SleepType } from '@/lib/types'

/** GET: Get sleep records for a date */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  const records = getSleepByDate(date)
  return NextResponse.json({ records })
}

/** POST: Save sleep record */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, id, type, bedTime, wakeTime, quality, note } = body

    if (!date || !bedTime || !wakeTime || !quality) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate duration
    const [bh, bm] = bedTime.split(':').map(Number)
    const [wh, wm] = wakeTime.split(':').map(Number)
    let duration = (wh * 60 + wm) - (bh * 60 + bm)
    if (duration < 0) duration += 24 * 60
    duration = Math.round(duration / 6) / 10

    const record = saveSleepRecord({
      id: id || undefined,
      date,
      type: type || 'night',
      bedTime, wakeTime,
      duration,
      quality: Number(quality),
      note: note || undefined,
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Sleep API error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

/** DELETE: Delete a sleep record */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const ok = deleteSleepRecord(id)
  return NextResponse.json({ success: ok })
}
