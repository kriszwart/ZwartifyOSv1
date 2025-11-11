import { NextRequest, NextResponse } from "next/server"
import { getUsageStats, getUsageByAgent } from "../../../backend/utils/usageAnalytics"

/**
 * GET /api/usage/stats - Get overall usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const agentId = searchParams.get('agentId')
    const timeRange = searchParams.get('timeRange') // 'today', 'week', 'month', or custom dates

    let timeRangeFilter: { start?: Date; end?: Date } | undefined

    if (timeRange) {
      const now = new Date()
      switch (timeRange) {
        case 'today':
          timeRangeFilter = {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            end: now,
          }
          break
        case 'week':
          const weekAgo = new Date(now)
          weekAgo.setDate(weekAgo.getDate() - 7)
          timeRangeFilter = { start: weekAgo, end: now }
          break
        case 'month':
          const monthAgo = new Date(now)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          timeRangeFilter = { start: monthAgo, end: now }
          break
      }
    }

    const stats = getUsageStats(agentId || undefined, timeRangeFilter)
    const byAgent = getUsageByAgent()

    return NextResponse.json({
      stats,
      byAgent,
    })
  } catch (error) {
    console.error("Error getting usage stats:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get usage stats" },
      { status: 500 }
    )
  }
}

