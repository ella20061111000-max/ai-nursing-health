// ============================================================
// Data Store — local JSON file storage (MVP phase)
// 数据存储 — 本地文件存储（MVP阶段）
// Will migrate to Supabase in V2
// ============================================================

import fs from 'fs'
import path from 'path'
import type { FoodEntry, DailySummary, SleepRecord, WaterRecord } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.json')
const SLEEP_FILE = path.join(DATA_DIR, 'sleep.json')
const WATER_FILE = path.join(DATA_DIR, 'water.json')

/** Ensure data directory and files exist */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(ENTRIES_FILE)) {
    fs.writeFileSync(ENTRIES_FILE, JSON.stringify({ entries: [] }, null, 2), 'utf-8')
  }
}

/** Read all entries from file */
function readEntries(): { entries: FoodEntry[] } {
  ensureDataDir()
  const raw = fs.readFileSync(ENTRIES_FILE, 'utf-8')
  return JSON.parse(raw)
}

/** Write entries to file */
function writeEntries(data: { entries: FoodEntry[] }) {
  ensureDataDir()
  fs.writeFileSync(ENTRIES_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

/** Generate a simple unique ID */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

// --- Public API ---

/** Get all entries for a specific date / 获取某日所有记录 */
export function getEntriesByDate(date: string): FoodEntry[] {
  const { entries } = readEntries()
  return entries.filter(e => e.date === date).sort((a, b) => a.time.localeCompare(b.time))
}

/** Get entries for a date range / 获取日期范围内记录 */
export function getEntriesByDateRange(startDate: string, endDate: string): FoodEntry[] {
  const { entries } = readEntries()
  return entries
    .filter(e => e.date >= startDate && e.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
}

/** Get all available dates with entries / 获取所有有记录的日期 */
export function getAvailableDates(): string[] {
  const { entries } = readEntries()
  const dates = [...new Set(entries.map(e => e.date))]
  return dates.sort((a, b) => b.localeCompare(a)) // newest first
}

/** Create a new entry / 新增记录 */
export function createEntry(entry: Omit<FoodEntry, 'id' | 'createdAt'>): FoodEntry {
  const data = readEntries()
  const newEntry: FoodEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  data.entries.push(newEntry)
  writeEntries(data)
  return newEntry
}

/** Delete an entry / 删除记录 */
export function deleteEntry(id: string): boolean {
  const data = readEntries()
  const idx = data.entries.findIndex(e => e.id === id)
  if (idx === -1) return false
  data.entries.splice(idx, 1)
  writeEntries(data)
  return true
}

/** Get today's date as YYYY-MM-DD / 获取今日日期 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

/** Get today's summary / 获取今日汇总 */
export function getTodaySummary(): DailySummary {
  const today = getTodayDate()
  return {
    date: today,
    entries: getEntriesByDate(today),
  }
}

// ============================================================
// Sleep Records / 睡眠记录
// ============================================================

function ensureSleepFile() {
  ensureDataDir()
  if (!fs.existsSync(SLEEP_FILE)) {
    fs.writeFileSync(SLEEP_FILE, JSON.stringify({ records: [] }, null, 2), 'utf-8')
  }
}

function readSleep(): { records: SleepRecord[] } {
  ensureSleepFile()
  return JSON.parse(fs.readFileSync(SLEEP_FILE, 'utf-8'))
}

function writeSleep(data: { records: SleepRecord[] }) {
  ensureSleepFile()
  fs.writeFileSync(SLEEP_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

/** Get sleep records for a date / 获取某日所有睡眠记录 */
export function getSleepByDate(date: string): SleepRecord[] {
  const { records } = readSleep()
  return records.filter(r => r.date === date)
}

/** Save sleep record (add if new, update if same id) / 保存睡眠记录 */
export function saveSleepRecord(record: Omit<SleepRecord, 'id'> & { id?: string }): SleepRecord {
  const data = readSleep()
  const full: SleepRecord = { ...record, id: record.id || generateId() }
  const idx = data.records.findIndex(r => r.id === full.id)
  if (idx >= 0) {
    data.records[idx] = full
  } else {
    data.records.push(full)
  }
  writeSleep(data)
  return full
}

/** Delete sleep record / 删除睡眠记录 */
export function deleteSleepRecord(id: string): boolean {
  const data = readSleep()
  const len = data.records.length
  data.records = data.records.filter(r => r.id !== id)
  if (data.records.length === len) return false
  writeSleep(data)
  return true
}

// ============================================================
// Water Records / 饮水记录
// ============================================================

function ensureWaterFile() {
  ensureDataDir()
  if (!fs.existsSync(WATER_FILE)) {
    fs.writeFileSync(WATER_FILE, JSON.stringify({ records: [] }, null, 2), 'utf-8')
  }
}

function readWater(): { records: WaterRecord[] } {
  ensureWaterFile()
  return JSON.parse(fs.readFileSync(WATER_FILE, 'utf-8'))
}

function writeWater(data: { records: WaterRecord[] }) {
  ensureWaterFile()
  fs.writeFileSync(WATER_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

/** Get water record for a date / 获取某日饮水 */
export function getWaterByDate(date: string): WaterRecord | null {
  const { records } = readWater()
  return records.find(r => r.date === date) || null
}

/** Add water log for a date / 添加饮水记录 */
export function addWaterLog(date: string, time: string, ml: number): WaterRecord {
  const data = readWater()
  let record = data.records.find(r => r.date === date)
  if (record) {
    record.logs.push({ id: generateId(), time, ml })
    record.totalMl += ml
  } else {
    record = { date, totalMl: ml, logs: [{ id: generateId(), time, ml }] }
    data.records.push(record)
  }
  writeWater(data)
  return record
}

/** Delete a single water log / 删除单条饮水记录 */
export function deleteWaterLog(date: string, logId: string): WaterRecord | null {
  const data = readWater()
  const record = data.records.find(r => r.date === date)
  if (!record) return null
  const logIdx = record.logs.findIndex(l => l.id === logId)
  if (logIdx === -1) return null
  record.totalMl -= record.logs[logIdx].ml
  record.logs.splice(logIdx, 1)
  if (record.logs.length === 0) {
    data.records = data.records.filter(r => r.date !== date)
  }
  writeWater(data)
  return record.logs.length > 0 ? record : null
}

/** Reset water for a date / 重置某日饮水 */
export function resetWater(date: string): void {
  const data = readWater()
  data.records = data.records.filter(r => r.date !== date)
  writeWater(data)
}
