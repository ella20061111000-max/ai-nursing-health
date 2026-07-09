// ============================================================
// API: /api/vision — Recognize food from photo (free Hugging Face)
// 拍照识别食物 — 压缩图片 + 多模型备用
// ============================================================

import { NextResponse } from 'next/server'

const HF_TOKEN = process.env.HF_API_TOKEN

async function callHFModel(model: string, base64Data: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: base64Data }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data)) {
      return data[0]?.generated_text || data[0]?.label || null
    }
    return data.generated_text || null
  } catch { return null }
}

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    if (!image) return NextResponse.json({ error: 'Missing image' }, { status: 400 })
    if (!HF_TOKEN) return NextResponse.json({ foodName: '（需要配置 Hugging Face Token）' })

    // Extract base64 data
    const base64Data = image.split(',')[1] || image

    // Try models in order until one works
    const models = [
      'Salesforce/blip-image-captioning-base',
      'nlpconnect/vit-gpt2-image-captioning',
      'microsoft/git-base-coco',
    ]

    let result: string | null = null
    for (const model of models) {
      result = await callHFModel(model, base64Data)
      if (result) break
    }

    if (!result) {
      return NextResponse.json({ foodName: '' }) // empty = let user type
    }

    // Clean up the result
    let foodName = result.trim()
    foodName = foodName.replace(/^(a|an|the)\s+(plate\s+of|bowl\s+of|cup\s+of|piece\s+of|serving\s+of|dish\s+of|meal\s+of)\s+/i, '')

    return NextResponse.json({ foodName, mealType: null })
  } catch {
    return NextResponse.json({ foodName: '' })
  }
}
