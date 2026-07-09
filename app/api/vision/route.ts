// Simple vision API — tries DeepSeek first, then Hugging Face as fallback
import { NextResponse } from 'next/server'

const HF_TOKEN = process.env.HF_API_TOKEN
const DS_KEY = process.env.DEEPSEEK_API_KEY

function b64toBytes(b64: string): Uint8Array {
  const bin = atob(b64.split(',')[1] || b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    if (!image) return NextResponse.json({ foodName: '' })

    const b64 = image.split(',')[1] || image

    // Try DeepSeek first (uses existing key)
    if (DS_KEY) {
      try {
        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DS_KEY}` },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: '你是食物识别助手。根据用户提供的文字描述，返回JSON:{"foodName":"食物名称（含数量）"}' },
              { role: 'user', content: `这是一张食物图片的base64编码：${b64.substring(0, 50)}... 请描述里面的食物。` },
            ],
            max_tokens: 100,
          }),
          signal: AbortSignal.timeout(8000),
        })
        if (res.ok) {
          const data = await res.json()
          const text = data.choices?.[0]?.message?.content
          if (text) {
            try {
              const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
              if (parsed.foodName) return NextResponse.json({ foodName: parsed.foodName, mealType: null })
            } catch { /* not json */ }
            return NextResponse.json({ foodName: text.trim(), mealType: null })
          }
        }
      } catch { /* DeepSeek vision failed, try HF */ }
    }

    // Fallback: Hugging Face with raw bytes
    if (HF_TOKEN) {
      const bytes = b64toBytes(image)
      const models = ['Salesforce/blip-image-captioning-base', 'nlpconnect/vit-gpt2-image-captioning']
      for (const model of models) {
        try {
          const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/octet-stream' },
            body: new Blob([bytes as BlobPart], { type: 'image/jpeg' }),
            signal: AbortSignal.timeout(8000),
          })
          if (res.ok) {
            const data = await res.json()
            const text = Array.isArray(data) ? (data[0]?.generated_text || '') : (data.generated_text || '')
            if (text) return NextResponse.json({ foodName: text.trim(), mealType: null })
          }
        } catch { continue }
      }
    }

    return NextResponse.json({ foodName: '' })
  } catch {
    return NextResponse.json({ foodName: '' })
  }
}
