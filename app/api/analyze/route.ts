// ============================================================
// API: /api/analyze — AI Diet Analysis via DeepSeek
// AI 饮食分析（调用 DeepSeek API）
// ============================================================

import { NextResponse } from 'next/server'
import { getEntriesByDate } from '@/lib/data-store'
import type { AIAnalysis, AnalysisItem } from '@/lib/types'

// System prompt for the AI — this defines the AI's role
// AI 的角色设定
const SYSTEM_PROMPT = `你是"护理健康管家(Nursing Health Companion)"的AI营养分析专家。
你是一位懂护理、懂营养、懂行为改变的私人健康管家。

你的任务是分析用户的每日饮食记录，提供专业、温暖、实用的反馈。

分析时请遵循以下原则：
1. 使用中文为主，关键护理/营养术语保留中英文对照
2. 基于用户提供的食物记录分析，不要编造数据
3. 反馈要具体、可操作，不要只说"很好"或"不好"
4. 考虑用户的身份：护理专业学生，需要长时间学习，预算有限
5. 注重长期可持续性，不推荐极端饮食

分析维度：
- 热量(Calories)：是否合理
- 蛋白质(Protein)：是否足够
- 碳水(Carbs)：质量如何
- 脂肪(Fat)：质量和数量
- 纤维(Fiber)：是否充足
- 钠(Sodium)：是否过高
- 糖(Sugar)：添加糖是否过多
- 水(Water)：是否足够`

function buildUserPrompt(date: string, entries: any[]): string {
  const entryText = entries
    .map(e => `[${e.time}] ${e.mealType === 'breakfast' ? '早餐' : e.mealType === 'lunch' ? '午餐' : e.mealType === 'dinner' ? '晚餐' : '加餐'}: ${e.foodName}${e.portion ? ` (${e.portion})` : ''}${e.notes ? ` - ${e.notes}` : ''}`)
    .join('\n')

  return `请分析我在 ${date} 的饮食记录：

${entryText}

请以JSON格式返回分析结果，格式如下：
{
  "overallScore": 0-100,
  "summary": "总体评价（2-3句话）",
  "details": {
    "calories": { "status": "good|fair|needs_improvement", "comment": "分析" },
    "protein": { "status": "good|fair|needs_improvement", "comment": "分析" },
    "carbs": { "status": "good|fair|needs_improvement", "comment": "分析" },
    "fat": { "status": "good|fair|needs_improvement", "comment": "分析" },
    "fiber": { "status": "good|fair|needs_improvement", "comment": "分析" },
    "sodium": { "status": "good|fair|needs_improvement", "comment": "分析" },
    "sugar": { "status": "good|fair|needs_improvement", "comment": "分析" },
    "water": { "status": "good|fair|needs_improvement", "comment": "分析" }
  },
  "strengths": ["优点1", "优点2"],
  "suggestions": ["建议1", "建议2", "建议3"],
  "topAdvice": "最重要的一个建议"
}`
}

export async function POST(request: Request) {
  try {
    const { date } = await request.json()

    if (!date) {
      return NextResponse.json({ error: 'Missing date' }, { status: 400 })
    }

    // Get entries for the date / 获取该日期的饮食记录
    const entries = getEntriesByDate(date)
    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries found for this date' },
        { status: 404 }
      )
    }

    const apiKey = process.env.DEEPSEEK_API_KEY

    // If no API key is configured, return a simulated analysis for demo
    // 如果没有配置 API Key，返回模拟分析
    if (!apiKey) {
      return NextResponse.json({
        analysis: getSimulatedAnalysis(date, entries),
      })
    }

    // Call DeepSeek API / 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(date, entries) },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('DeepSeek API error:', error)
      throw new Error('AI analysis failed')
    }

    const data = await response.json()
    const analysisContent = JSON.parse(data.choices[0].message.content)

    const analysis: AIAnalysis = {
      id: Date.now().toString(36),
      date,
      entryIds: entries.map(e => e.id),
      overallScore: analysisContent.overallScore,
      summary: analysisContent.summary,
      details: {
        calories: { ...analysisContent.details.calories, label: 'Calories', labelCn: '热量' },
        protein: { ...analysisContent.details.protein, label: 'Protein', labelCn: '蛋白质' },
        carbs: { ...analysisContent.details.carbs, label: 'Carbs', labelCn: '碳水' },
        fat: { ...analysisContent.details.fat, label: 'Fat', labelCn: '脂肪' },
        fiber: { ...analysisContent.details.fiber, label: 'Fiber', labelCn: '膳食纤维' },
        sodium: { ...analysisContent.details.sodium, label: 'Sodium', labelCn: '钠' },
        sugar: { ...analysisContent.details.sugar, label: 'Sugar', labelCn: '糖' },
        water: { ...analysisContent.details.water, label: 'Water', labelCn: '水分' },
      },
      strengths: analysisContent.strengths,
      suggestions: analysisContent.suggestions,
      topAdvice: analysisContent.topAdvice,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}

/** Simulated analysis for demo when no API key / 无 API Key 时的模拟分析 */
function getSimulatedAnalysis(date: string, entries: any[]): AIAnalysis {
  const totalProtein = Math.round(entries.length * 8 + Math.random() * 10)
  const totalItems = entries.length
  const hasVeggies = entries.some(e => /蔬菜|青菜|白菜|上海青|菠菜|西兰花|沙拉/i.test(e.foodName))
  const hasProtein = entries.some(e => /鸡蛋|鸡|牛|猪|鱼|虾|豆腐|豆/i.test(e.foodName))
  const hasCarbs = entries.some(e => /米饭|粥|面包|面|馒头|红薯|玉米|南瓜/i.test(e.foodName))

  let score = 65
  if (hasProtein) score += 10
  if (hasVeggies) score += 10
  if (hasCarbs) score += 5
  if (totalItems >= 3) score += 5
  if (totalItems >= 4) score += 5
  score = Math.min(score, 95)

  return {
    id: Date.now().toString(36),
    date,
    entryIds: entries.map(e => e.id),
    overallScore: score,
    summary: totalItems === 1
      ? `今天只记录了${totalItems}餐，数据不够完整。建议尽量记录全天的饮食，这样AI才能给出更准确的分析建议。`
      : `今天记录了${totalItems}餐，${
          hasProtein && hasVeggies && hasCarbs
            ? '三大营养素都有覆盖，搭配比较均衡。'
            : hasProtein && hasVeggies
            ? '蛋白质和蔬菜搭配不错，但碳水摄入较少，可能影响学习精力。'
            : hasProtein && hasCarbs
            ? '蛋白质和碳水都有摄入，但缺少蔬菜，膳食纤维不足。'
            : '营养结构还有优化空间，建议每餐都包含蛋白质+蔬菜+主食。'
        }`,
    details: {
      calories: { status: totalItems >= 3 ? 'good' : 'fair', label: 'Calories', labelCn: '热量', comment: totalItems >= 3 ? '记录完整，热量摄入合理' : '记录较少，建议完整记录三餐' },
      protein: { status: hasProtein ? 'good' : 'needs_improvement', label: 'Protein', labelCn: '蛋白质', comment: hasProtein ? `约${totalProtein}g，建议每餐都有优质蛋白来源` : '蛋白质摄入不足，建议每餐添加鸡蛋/豆制品/肉类' },
      carbs: { status: hasCarbs ? 'good' : 'fair', label: 'Carbs', labelCn: '碳水', comment: hasCarbs ? '有主食摄入，建议多选择粗粮杂豆' : '碳水偏少，大脑需要葡萄糖维持学习效率' },
      fat: { status: 'fair', label: 'Fat', labelCn: '脂肪', comment: '建议关注脂肪质量，多选择坚果、鱼油等不饱和脂肪' },
      fiber: { status: hasVeggies ? 'good' : 'needs_improvement', label: 'Fiber', labelCn: '膳食纤维', comment: hasVeggies ? '有蔬菜摄入，建议每天吃到300-500g各类蔬菜' : '膳食纤维不足，每餐应包含一份蔬菜' },
      sodium: { status: 'fair', label: 'Sodium', labelCn: '钠', comment: '注意外卖和加工食品中的隐形盐分' },
      sugar: { status: 'fair', label: 'Sugar', labelCn: '糖', comment: '注意含糖饮料和甜点中的添加糖' },
      water: { status: 'fair', label: 'Water', labelCn: '水分', comment: '目标：每天1500-2000ml' },
    },
    strengths: [
      ...(hasProtein ? ['有优质蛋白摄入 ✓'] : []),
      ...(hasVeggies ? ['有蔬菜摄入，膳食纤维来源不错 ✓'] : []),
      ...(hasCarbs ? ['有主食提供能量 ✓'] : []),
      ...(totalItems >= 3 ? ['三餐记录完整，意识很好 ✓'] : []),
    ].slice(0, 3),
    suggestions: [
      ...(!hasVeggies ? ['每餐增加一份蔬菜（推荐深绿色蔬菜，补铁补叶酸）'] : []),
      ...(!hasProtein ? ['增加优质蛋白来源（鸡蛋、豆腐、瘦肉）'] : []),
      ...(!hasCarbs ? ['保证每餐有主食，大脑需要葡萄糖维持学习效率'] : []),
      '每天喝够1500-2000ml水，对皮肤和学习效率都有帮助',
      '注意控制加工食品和含糖饮料的摄入',
    ].slice(0, 3),
    topAdvice: hasVeggies && hasProtein && hasCarbs
      ? '今天搭配不错！下一步关注：增加蔬菜种类，控制添加糖，保证饮水。'
      : '建议保证每餐都有蛋白质+蔬菜+主食的完整搭配，这对维持学习精力和皮肤状态都很重要。',
    createdAt: new Date().toISOString(),
  }
}
