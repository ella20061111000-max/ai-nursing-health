import { NextResponse } from 'next/server'
import { getWaterByDate, addWaterLog, deleteWaterLog } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  const record = await getWaterByDate(date)
  return NextResponse.json({ record })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, ml } = body
    if (!date || !ml) return NextResponse.json({ error: 'Missing date or ml' }, { status: 400 })
    const now = new Date()
    const time = now.toTimeString().slice(0, 5)
    const record = await addWaterLog(date, time, Number(ml))
    return NextResponse.json({ record })
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const logId = searchParams.get('logId')
  if (!date || !logId) return NextResponse.json({ error: 'Missing date or logId' }, { status: 400 })
  const record = await deleteWaterLog(date, logId)
  return NextResponse.json({ record })
}
