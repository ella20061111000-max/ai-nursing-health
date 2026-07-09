// Vision API — Google Gemini (free, works in China)
import { NextResponse } from 'next/server'

const GOOGLE_KEY = process.env.GOOGLE_API_KEY

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    if (!image) return NextResponse.json({ foodName: '' })
    if (!GOOGLE_KEY) return NextResponse.json({ foodName: '' })

    // Extract base64 data
    const b64 = image.split(',')[1] || image
    const mime = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Identify the food in this image. Return ONLY the food name with quantity, like "水煮蛋2个" or "一碗米饭". If unsure, return "食物". Keep it under 20 characters.' },
              { inlineData: { mimeType: mime, data: b64 } },
            ],
          }],
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('Gemini error:', err)
      return NextResponse.json({ foodName: '' })
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    return NextResponse.json({
      foodName: text?.trim() || '',
      mealType: null,
    })
  } catch {
    return NextResponse.json({ foodName: '' })
  }
}
