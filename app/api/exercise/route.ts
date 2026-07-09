import { NextResponse } from 'next/server'
import { getExerciseByDate, saveExercise, deleteExercise } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  const records = await getExerciseByDate(date)
  return NextResponse.json({ records })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, type, duration, note } = body
    if (!date || !type || !duration) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const record = await saveExercise({ date, type, duration: Number(duration), note })
    return NextResponse.json({ record }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const ok = await deleteExercise(id)
  return NextResponse.json({ success: ok })
}
