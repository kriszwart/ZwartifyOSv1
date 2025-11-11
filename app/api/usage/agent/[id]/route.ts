import { NextRequest, NextResponse } from "next/server"
import { getUsageStats } from "../../../../../backend/utils/usageAnalytics"

/**
 * GET /api/usage/agent/[id] - Get usage statistics for a specific agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange')

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

    const stats = getUsageStats(params.id, timeRangeFilter)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error getting agent usage stats:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get agent usage stats" },
      { status: 500 }
    )
  }
}

