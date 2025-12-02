"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface Recommendation {
  id: string
  source: 'skills' | 'tools' | 'prompt' | 'errors'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  action: string
  expectedImpact: string
}

interface ImprovementData {
  agentId: string
  agentName: string
  summary: {
    skillCoverageScore: number
    promptScore: number
    errorRiskLevel: 'low' | 'medium' | 'high' | 'critical'
    improvementPotential: number
    totalRecommendations: number
  }
  recommendations: Recommendation[]
  details: {
    skills: {
      gaps: Array<{
        id: string
        missingCapability: string
        severity: string
        frequency: number
      }>
      coverage: Array<{
        skillId: string
        skillName: string
        usageCount: number
        successRate: number
      }>
    }
    tools: {
      effectiveness: Array<{
        toolName: string
        totalUsage: number
        successRate: number
        avgDurationMs: number
        trend: string
      }>
      unused: string[]
    }
    prompt: {
      score: number
      weaknesses: Array<{
        id: string
        category: string
        description: string
        severity: string
        suggestion: string
      }>
    }
    errors: {
      riskLevel: string
      topPatterns: Array<{
        id: string
        pattern: string
        category: string
        frequency: number
      }>
    }
  }
}

export default function ImprovementsPage() {
  const params = useParams()
  const agentId = params.id as string

  const [data, setData] = useState<ImprovementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'tools' | 'prompt' | 'errors'>('overview')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agents/${agentId}/recommendations`)
      if (!response.ok) throw new Error('Failed to fetch recommendations')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-800 rounded w-1/3"></div>
            <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
            <div className="grid grid-cols-4 gap-4 mt-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-zinc-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">Error: {error || 'No data available'}</p>
          </div>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-emerald-400 bg-emerald-500/10'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10'
      case 'high': return 'text-orange-400 bg-orange-500/10'
      case 'critical': return 'text-red-400 bg-red-500/10'
      default: return 'text-zinc-400 bg-zinc-500/10'
    }
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    }
    return colors[priority] || colors.low
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'skills': return '🧠'
      case 'tools': return '🔧'
      case 'prompt': return '✍️'
      case 'errors': return '⚠️'
      default: return '📊'
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <Link href="/agents" className="hover:text-cyan-400 transition-colors">Agents</Link>
            <span>/</span>
            <Link href={`/agents/${agentId}`} className="hover:text-cyan-400 transition-colors">{data.agentName}</Link>
            <span>/</span>
            <span className="text-zinc-300">Improvements</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Self-Improvement Analysis</h1>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors"
            >
              Refresh Analysis
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-500 mb-1">Skill Coverage</div>
            <div className={`text-3xl font-bold ${getScoreColor(data.summary.skillCoverageScore)}`}>
              {data.summary.skillCoverageScore}%
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-500 mb-1">Prompt Score</div>
            <div className={`text-3xl font-bold ${getScoreColor(data.summary.promptScore)}`}>
              {data.summary.promptScore}%
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-500 mb-1">Error Risk</div>
            <div className={`text-lg font-semibold px-3 py-1 rounded-full inline-block ${getRiskColor(data.summary.errorRiskLevel)}`}>
              {data.summary.errorRiskLevel.toUpperCase()}
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-500 mb-1">Improvement Potential</div>
            <div className={`text-3xl font-bold ${getScoreColor(100 - data.summary.improvementPotential)}`}>
              {data.summary.improvementPotential}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-4">
          {(['overview', 'skills', 'tools', 'prompt', 'errors'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">
              Top Recommendations ({data.recommendations.length})
            </h2>
            <div className="space-y-3">
              {data.recommendations.map(rec => (
                <div
                  key={rec.id}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getSourceIcon(rec.source)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityBadge(rec.priority)}`}>
                          {rec.priority}
                        </span>
                        <span className="text-xs text-zinc-500 uppercase">{rec.source}</span>
                      </div>
                      <h3 className="font-medium text-zinc-100">{rec.title}</h3>
                      <p className="text-sm text-zinc-400 mt-1">{rec.description}</p>
                      <p className="text-sm text-cyan-400/70 mt-2">
                        Impact: {rec.expectedImpact}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Skill Gaps</h2>
              {data.details.skills.gaps.length > 0 ? (
                <div className="space-y-2">
                  {data.details.skills.gaps.map(gap => (
                    <div key={gap.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{gap.missingCapability}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(gap.severity)}`}>
                          {gap.severity}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">
                        Detected {gap.frequency} times
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500">No skill gaps detected.</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Current Skills</h2>
              {data.details.skills.coverage.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {data.details.skills.coverage.map(skill => (
                    <div key={skill.skillId} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                      <div className="font-medium">{skill.skillName}</div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                        <span>Used: {skill.usageCount}x</span>
                        <span className={getScoreColor(skill.successRate)}>
                          {skill.successRate.toFixed(0)}% success
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500">No skills assigned.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Tool Effectiveness</h2>
              {data.details.tools.effectiveness.length > 0 ? (
                <div className="space-y-2">
                  {data.details.tools.effectiveness.map(tool => (
                    <div key={tool.toolName} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium font-mono">{tool.toolName}</span>
                        <span className={`text-sm ${
                          tool.trend === 'improving' ? 'text-emerald-400' :
                          tool.trend === 'declining' ? 'text-red-400' :
                          'text-zinc-400'
                        }`}>
                          {tool.trend === 'improving' ? '↑' : tool.trend === 'declining' ? '↓' : '→'} {tool.trend}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                        <span>Calls: {tool.totalUsage}</span>
                        <span className={getScoreColor(tool.successRate)}>
                          {tool.successRate.toFixed(0)}% success
                        </span>
                        <span>{tool.avgDurationMs.toFixed(0)}ms avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500">No tool usage data yet.</p>
              )}
            </div>

            {data.details.tools.unused.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Unused Tools</h2>
                <div className="flex flex-wrap gap-2">
                  {data.details.tools.unused.map(tool => (
                    <span
                      key={tool}
                      className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full text-sm font-mono"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prompt' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold">Prompt Analysis</h2>
              <span className={`text-2xl font-bold ${getScoreColor(data.details.prompt.score)}`}>
                {data.details.prompt.score}/100
              </span>
            </div>

            {data.details.prompt.weaknesses.length > 0 ? (
              <div className="space-y-3">
                {data.details.prompt.weaknesses.map(weak => (
                  <div key={weak.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        {weak.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(weak.severity)}`}>
                        {weak.severity}
                      </span>
                    </div>
                    <p className="font-medium">{weak.description}</p>
                    <p className="text-sm text-cyan-400/70 mt-2">
                      💡 {weak.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500">No prompt weaknesses detected.</p>
            )}

            <Link
              href={`/api/agents/${agentId}/refine-prompt`}
              className="inline-block px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors"
            >
              Refine Prompt →
            </Link>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold">Error Analysis</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(data.details.errors.riskLevel)}`}>
                {data.details.errors.riskLevel.toUpperCase()} RISK
              </span>
            </div>

            {data.details.errors.topPatterns.length > 0 ? (
              <div className="space-y-3">
                {data.details.errors.topPatterns.map(pattern => (
                  <div key={pattern.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                        {pattern.category}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {pattern.frequency}x occurrences
                      </span>
                    </div>
                    <p className="font-mono text-sm text-zinc-300 break-all">
                      {pattern.pattern}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-emerald-400">✓ No significant error patterns detected.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}




