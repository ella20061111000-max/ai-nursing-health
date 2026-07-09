// ============================================================
// API: /api/vision — Recognize food from photo
// 拍照识别食物（需要 OpenAI API Key）
// ============================================================

import { NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    if (!image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 })
    }

    if (!OPENAI_API_KEY) {
      // No API key configured — return a mock result
      return NextResponse.json({
        foodName: '（拍照识别功能需配置 OpenAI API Key）',
        note: '照片已记录'
      })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个食物识别助手。请分析图片中的食物，返回JSON格式：{"foodName": "食物名称（包含数量，如：水煮蛋2个）", "mealType": "breakfast|lunch|dinner|snack（根据时间推断）", "portion": "份量描述（可选）", "calories": 估算热量（数字，可选）}',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: '请识别这张图片中的食物有哪些？' },
              { type: 'image_url', image_url: { url: image, detail: 'low' } },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Vision API error:', errText)
      return NextResponse.json({ error: 'AI vision failed' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ foodName: '无法识别食物' })
    }

    // Try to parse JSON from response
    try {
      const parsed = JSON.parse(content.replace(/```json|```/g, '').trim())
      return NextResponse.json({
        foodName: parsed.foodName || '未识别',
        mealType: parsed.mealType || null,
        portion: parsed.portion || null,
        calories: parsed.calories || null,
      })
    } catch {
      // Not JSON — return raw text
      return NextResponse.json({ foodName: content.trim() })
    }
  } catch (error) {
    console.error('Vision error:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
