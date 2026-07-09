// ============================================================
// API: /api/vision — Recognize food from photo via Hugging Face
// 拍照识别食物（免费，用 Hugging Face Inference API）
// ============================================================

import { NextResponse } from 'next/server'

const HF_TOKEN = process.env.HF_API_TOKEN

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    if (!image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 })
    }

    if (!HF_TOKEN) {
      return NextResponse.json({ foodName: '（拍照识别功能需配置 Hugging Face Token）' })
    }

    // Extract base64 data (remove data:image/xxx;base64, prefix)
    const base64Data = image.split(',')[1] || image

    // Use BLIP image captioning model to describe the food
    const response = await fetch(
      'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: base64Data }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('HF API error:', errText)

      // Try fallback model
      const fallbackRes = await fetch(
        'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: base64Data }),
        }
      )

      if (!fallbackRes.ok) {
        return NextResponse.json({ foodName: '识别失败，请手动输入' })
      }

      const fallbackData = await fallbackRes.json()
      const fallbackText = Array.isArray(fallbackData)
        ? fallbackData[0]?.generated_text || fallbackData[0]?.caption || ''
        : fallbackData.generated_text || ''

      return NextResponse.json({ foodName: fallbackText || '无法识别' })
    }

    const data = await response.json()
    const caption = Array.isArray(data)
      ? data[0]?.generated_text || ''
      : data.generated_text || ''

    // Clean up the caption: if it describes food, format nicely
    let foodName = caption.trim()
    // Remove leading "a plate of", "a bowl of", etc. for cleaner names
    foodName = foodName.replace(/^(a|an|the)\s+(plate\s+of|bowl\s+of|cup\s+of|piece\s+of|serving\s+of|dish\s+of)\s+/i, '')

    return NextResponse.json({
      foodName: foodName || '无法识别食物',
      mealType: null,
    })
  } catch (error) {
    console.error('Vision error:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
