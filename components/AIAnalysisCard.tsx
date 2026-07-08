'use client'

// ============================================================
// AI Analysis Card — AI 分析结果展示
// ============================================================

import { useState } from 'react'
import { Brain, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import type { AIAnalysis } from '@/lib/types'

interface AIAnalysisCardProps {
  date: string
  entriesCount: number
}

export default function AIAnalysisCard({ date, entriesCount }: AIAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAnalyze = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setAnalysis(data.analysis)
      setIsExpanded(true)
    } catch (err) {
      console.error('Analysis failed:', err)
      // For MVP, if API key isn't set up yet, show a friendly message
      setAnalysis(null)
    } finally {
      setIsLoading(false)
    }
  }

  // If no entries, don't show the button
  if (entriesCount === 0) return null

  return (
    <div className="mt-4">
      {/* Analyze button / 分析按钮 */}
      {!analysis && !isLoading && (
        <button
          onClick={handleAnalyze}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm"
        >
          <Brain className="w-4 h-4" />
          AI 分析今日饮食 Analyze Today
        </button>
      )}

      {/* Loading state / 加载中 */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 px-4 py-6 rounded-xl bg-gray-50 border border-gray-200">
          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
          <span className="text-sm text-gray-500">AI 分析中，请稍候...</span>
        </div>
      )}

      {/* Analysis result / 分析结果 */}
      {analysis && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* Header / 头部 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-gray-900">
                AI 护理分析 Nursing Analysis
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                analysis.overallScore >= 80 ? 'bg-green-100 text-green-700' :
                analysis.overallScore >= 60 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {analysis.overallScore}分
              </span>
            </div>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {/* Expanded content / 展开内容 */}
          {isExpanded && (
            <div className="px-4 pb-4 space-y-3 text-sm">
              {/* Summary / 总体评价 */}
              <p className="text-gray-700 leading-relaxed">
                {analysis.summary}
              </p>

              {/* Nutrition items / 营养项 */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(analysis.details).map(([key, item]) => (
                  <div key={key} className={`px-3 py-2 rounded-lg text-xs border ${
                    item.status === 'good' ? 'bg-green-50 border-green-200' :
                    item.status === 'fair' ? 'bg-amber-50 border-amber-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="font-medium text-gray-700 mb-0.5">
                      {item.labelCn} {item.label}
                    </div>
                    <div className="text-gray-500">{item.comment}</div>
                  </div>
                ))}
              </div>

              {/* Strengths / 优点 */}
              {analysis.strengths.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-green-700 mb-1">✅ 优点 Strengths</div>
                  <ul className="space-y-0.5">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions / 建议 */}
              {analysis.suggestions.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-amber-700 mb-1">💡 改进建议 Suggestions</div>
                  <ul className="space-y-0.5">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Top advice / 最重要的建议 */}
              <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                <div className="text-xs font-medium text-teal-700 mb-0.5">
                  ⭐ 今日最重要 Top Priority
                </div>
                <div className="text-sm text-teal-800 font-medium">
                  {analysis.topAdvice}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
