// ============================================================
// API: /api/water — Water Intake Record / 饮水记录
// ============================================================

import { NextResponse } from 'next/server'
import { getWaterByDate, addWaterLog, deleteWaterLog } from '@/lib/data-store'

/** GET: Get water for a date */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  const record = getWaterByDate(date)
  return NextResponse.json({ record })
}

/** POST: Add water log */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, ml } = body
    if (!date || !ml) return NextResponse.json({ error: 'Missing date or ml' }, { status: 400 })
    const now = new Date()
    const time = now.toTimeString().slice(0, 5)
    const record = addWaterLog(date, time, Number(ml))
    return NextResponse.json({ record })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

/** DELETE: Delete a water log */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const logId = searchParams.get('logId')
  if (!date || !logId) return NextResponse.json({ error: 'Missing date or logId' }, { status: 400 })
  const record = deleteWaterLog(date, logId)
  return NextResponse.json({ record })
}
