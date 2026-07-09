'use client'

import { useState, useEffect } from 'react'
import { Brain, Sparkles, Loader2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import type { HealthAnalysis } from '@/lib/types'

interface Props {
  date: string
  entriesCount: number
  analysis: HealthAnalysis | null
}

const MODULES = [
  { key: 'diet', label: '饮食', emoji: '🍴', color: 'teal' },
  { key: 'water', label: '饮水', emoji: '💧', color: 'sky' },
  { key: 'sleep', label: '睡眠', emoji: '🌙', color: 'indigo' },
  { key: 'exercise', label: '运动', emoji: '🏃', color: 'green' },
] as const

export default function AIAnalysisCard({ date, entriesCount, analysis: initialAnalysis }: Props) {
  const [analysis, setAnalysis] = useState<HealthAnalysis | null>(initialAnalysis || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAnalyze = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAnalysis(data.analysis)
      setIsExpanded(true)
    } catch { setAnalysis(null)
    } finally { setIsLoading(false) }
  }

  if (entriesCount === 0 && !analysis) return null

  const scoreColor = analysis?.healthScore
    ? analysis.healthScore >= 80 ? 'text-green-600 bg-green-100'
      : analysis.healthScore >= 60 ? 'text-amber-600 bg-amber-100'
      : 'text-red-600 bg-red-100'
    : ''

  return (
    <div className="mt-4">
      {!analysis && !isLoading && (
        <button onClick={handleAnalyze}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm">
          <Brain className="w-4 h-4" /> AI 健康分析
        </button>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 px-4 py-6 rounded-xl bg-gray-50 border border-gray-200">
          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
          <span className="text-sm text-gray-500">AI 分析中...</span>
        </div>
      )}

      {analysis && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <button onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-gray-900">AI 健康分析</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${scoreColor}`}>
                {analysis.healthScore}分
              </span>
            </div>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {isExpanded && (
            <div className="px-4 pb-4 space-y-3 text-sm">
              {/* 各模块评分 */}
              <div className="grid grid-cols-2 gap-2">
                {MODULES.map(m => {
                  const mod = analysis[m.key as keyof typeof analysis] as { score: number; summary: string }
                  return (
                    <div key={m.key} className={`px-3 py-2 rounded-lg text-xs border ${
                      mod?.score ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span>{m.emoji} {m.label}</span>
                        <span className={`font-medium ${mod?.score && mod.score >= 80 ? 'text-green-600' : mod?.score && mod.score >= 60 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {mod?.score || '—'}
                        </span>
                      </div>
                      <div className="text-gray-500">{mod?.summary || '暂无数据'}</div>
                    </div>
                  )
                })}
              </div>

              {/* 风险提醒 */}
              {analysis.riskAlerts && analysis.riskAlerts.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="flex items-center gap-1 text-xs font-medium text-red-700 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> 风险提醒
                  </div>
                  {analysis.riskAlerts.map((alert, i) => (
                    <p key={i} className="text-xs text-red-600">{alert}</p>
                  ))}
                </div>
              )}

              {/* 今日建议 */}
              {analysis.dailyAdvice && (
                <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                  <div className="text-xs font-medium text-teal-700 mb-0.5">⭐ 今日建议</div>
                  <div className="text-sm text-teal-800 font-medium">{analysis.dailyAdvice}</div>
                </div>
              )}

              {/* 明日建议 */}
              {analysis.tomorrowAdvice && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="text-xs font-medium text-amber-700 mb-0.5">🎯 明日行动</div>
                  <div className="text-sm text-amber-800 font-medium">{analysis.tomorrowAdvice}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
