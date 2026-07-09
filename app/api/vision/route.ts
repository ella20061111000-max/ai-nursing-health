// Edge-compatible vision API — uses Hugging Face Inference API
import { NextResponse } from 'next/server'

const HF_TOKEN = process.env.HF_API_TOKEN

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function tryModel(model: string, bytes: Uint8Array): Promise<string | null> {
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'image/jpeg' },
      body: new Blob([bytes as BlobPart], { type: 'image/jpeg' }),
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data)) return data[0]?.generated_text || null
    return data.generated_text || null
  } catch { return null }
}

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    if (!image || !HF_TOKEN) return NextResponse.json({ foodName: '' })

    const b64 = image.split(',')[1] || image
    const bytes = base64ToBytes(b64)

    const models = ['Salesforce/blip-image-captioning-base', 'nlpconnect/vit-gpt2-image-captioning']
    let result: string | null = null
    for (const m of models) { result = await tryModel(m, bytes); if (result) break }

    if (!result) return NextResponse.json({ foodName: '' })

    let name = result.trim()
    name = name.replace(/^(a|an|the)\s+(plate\s+of|bowl\s+of|cup\s+of|piece\s+of|serving\s+of|dish\s+of)\s+/i, '')
    name = name.replace(/^(a|an|the)\s+/i, '')

    return NextResponse.json({ foodName: name, mealType: null })
  } catch {
    return NextResponse.json({ foodName: '' })
  }
}
