import { NextResponse } from 'next/server'
import { getEntriesByDate, getSleepByDate, getWaterByDate, getExerciseByDate, getMoodByDate, saveAnalysis } from '@/lib/data-store'
import type { HealthAnalysis } from '@/lib/types'

const SYSTEM_PROMPT = `你是"护理健康管家(Nursing Health Companion)"的AI健康分析专家。你是一位懂护理、懂营养、懂行为改变的私人健康管家。

你的任务是分析用户每日的健康数据，提供专业、温暖、实用的反馈。

分析原则：
1. 使用中文，关键术语保留中英文
2. 基于用户提供的数据分析，不要编造
3. 反馈要具体、可操作
4. 考虑用户是护理专业学生，需要长时间学习，预算有限
5. 注重长期可持续性，不推荐极端方法
6. 输出格式必须是JSON，结构固定`

function buildPrompt(date: string, entries: any[], sleep: any[], water: any, exercise: any[], mood: any): string {
  const parts = [`请分析我在 ${date} 的健康数据：`]

  if (entries.length > 0) {
    parts.push('\n【饮食】')
    entries.forEach(e => parts.push(`[${e.time}] ${e.mealType}: ${e.foodName}`))
  }

  if (water) parts.push(`\n【饮水】${water.totalMl}ml`)

  if (sleep.length > 0) {
    parts.push('\n【睡眠】')
    sleep.forEach(s => parts.push(`${s.type === 'night' ? '夜间' : '小憩'} ${s.bedTime}-${s.wakeTime} (${s.duration}h, 质量${s.quality}/10)`))
  }

  if (exercise.length > 0) {
    parts.push('\n【运动】')
    exercise.forEach(e => parts.push(`${e.type}: ${e.duration}分钟`))
  }

  if (mood) parts.push(`\n【心情】${mood.mood}`)

  parts.push(`\n\n请按以下JSON格式输出分析结果（不要加markdown，纯JSON）：
{
  "healthScore": 0-100,
  "diet": { "score": 0-100, "summary": "一句分析", "suggestions": ["建议"] },
  "water": { "score": 0-100, "summary": "一句分析", "suggestions": ["建议"] },
  "sleep": { "score": 0-100, "summary": "一句分析", "suggestions": ["建议"] },
  "exercise": { "score": 0-100, "summary": "一句分析", "suggestions": ["建议"] },
  "riskAlerts": ["风险提醒"],
  "dailyAdvice": "今天最重要的一个建议",
  "tomorrowAdvice": "明天最值得做的一件小事"
}`)

  return parts.join('\n')
}

function emptyAnalysis(date: string): Omit<HealthAnalysis, 'id' | 'createdAt'> {
  return {
    date, healthScore: 0,
    diet: { score: 0, summary: '未记录饮食', suggestions: ['建议记录三餐饮食'] },
    water: { score: 0, summary: '未记录饮水', suggestions: ['建议每天喝1500-2000ml水'] },
    sleep: { score: 0, summary: '未记录睡眠', suggestions: ['建议记录睡眠情况'] },
    exercise: { score: 0, summary: '未记录运动', suggestions: ['建议每天活动30分钟'] },
    riskAlerts: ['数据不完整，分析仅供参考'],
    dailyAdvice: '先记录今天的饮食、饮水、睡眠和运动数据吧',
    tomorrowAdvice: '明天试着记录完整一天的数据',
  }
}

export async function POST(request: Request) {
  try {
    const { date } = await request.json()
    if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

    const [entries, sleep, water, exercise, mood] = await Promise.all([
      getEntriesByDate(date), getSleepByDate(date), getWaterByDate(date),
      getExerciseByDate(date), getMoodByDate(date),
    ])

    const hasData = entries.length > 0 || sleep.length > 0 || water || exercise.length > 0 || mood
    if (!hasData) {
      return NextResponse.json({ error: 'No data for this date' }, { status: 404 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY

    let analysisData: Omit<HealthAnalysis, 'id' | 'createdAt'>

    if (!apiKey) {
      analysisData = emptyAnalysis(date)
    } else {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildPrompt(date, entries, sleep, water, exercise, mood) },
          ],
          temperature: 0.7, max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) throw new Error('AI API failed')
      const data = await response.json()
      analysisData = JSON.parse(data.choices[0].message.content)
    }

    // Save to database
    const analysis = await saveAnalysis({
      ...analysisData,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
