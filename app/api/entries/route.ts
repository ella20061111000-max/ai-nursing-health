import { NextResponse } from 'next/server'
import { getEntriesByDate, createEntry, deleteEntry, getTodayDate } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || getTodayDate()
  const entries = await getEntriesByDate(date)
  return NextResponse.json({ date, entries })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, time, mealType, foodName, portion, notes } = body
    if (!date || !time || !mealType || !foodName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const entry = await createEntry({ date, time, mealType, foodName, portion, notes })
    return NextResponse.json({ entry }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const success = await deleteEntry(id)
  return NextResponse.json({ success })
}
