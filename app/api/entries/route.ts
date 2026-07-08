// ============================================================
// API: /api/entries — Diet Diary CRUD
// 饮食记录 API（增删查）
// ============================================================

import { NextResponse } from 'next/server'
import { getEntriesByDate, createEntry, deleteEntry, getTodayDate } from '@/lib/data-store'

/** GET: Fetch entries for a date / 获取某日记录 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || getTodayDate()

  const entries = getEntriesByDate(date)
  return NextResponse.json({ date, entries })
}

/** POST: Create a new entry / 新增记录 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, time, mealType, foodName, portion, notes } = body

    // Validation / 数据验证
    if (!date || !time || !mealType || !foodName) {
      return NextResponse.json(
        { error: 'Missing required fields: date, time, mealType, foodName' },
        { status: 400 }
      )
    }

    const entry = createEntry({ date, time, mealType, foodName, portion, notes })
    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    )
  }
}

/** DELETE: Remove an entry / 删除记录 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const success = deleteEntry(id)
  if (!success) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
