// ============================================================
// API: /api/day — Daily Summary
// 每日汇总 API（一次获取全部数据）
// ============================================================

import { NextResponse } from 'next/server'
import { getEntriesByDate, getSleepByDate, getWaterByDate, getTodayDate } from '@/lib/data-store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || getTodayDate()

  const [entries, sleep, water] = await Promise.all([
    Promise.resolve(getEntriesByDate(date)),
    Promise.resolve(getSleepByDate(date)),
    Promise.resolve(getWaterByDate(date)),
  ])

  return NextResponse.json({ date, entries, sleep, water })
}
