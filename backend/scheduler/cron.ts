/**
 * Cron Manager
 * 
 * Manages cron job execution using node-cron or similar
 */

import { getDueSchedules, markScheduleRun } from './manager'
import { mainAgent } from '../agents/mainAgent'

// Simple interval-based scheduler (for development)
// In production, use proper cron library or external scheduler
let schedulerInterval: NodeJS.Timeout | null = null

/**
 * Start the scheduler
 */
export function startScheduler(intervalMs: number = 60000): void {
  if (schedulerInterval) {
    console.warn('Scheduler already running')
    return
  }

  console.log(`🕐 Starting scheduler (checking every ${intervalMs}ms)`)
  
  schedulerInterval = setInterval(async () => {
    const dueSchedules = getDueSchedules()
    
    if (dueSchedules.length > 0) {
      console.log(`📅 Found ${dueSchedules.length} due schedule(s)`)
      
      for (const schedule of dueSchedules) {
        try {
          console.log(`🚀 Running scheduled agent: ${schedule.agentId}`)
          
          // Run the agent with the scheduled input
          const input = schedule.metadata?.input as string || 
                       `Scheduled execution at ${new Date().toISOString()}`
          
          await mainAgent(input, {
            agentId: schedule.agentId,
            metadata: {
              ...schedule.metadata,
              scheduled: true,
              scheduleId: schedule.id,
            },
          })
          
          // Mark as run
          markScheduleRun(schedule.id)
          console.log(`✅ Scheduled execution completed for agent: ${schedule.agentId}`)
        } catch (error) {
          console.error(`❌ Error running scheduled agent ${schedule.agentId}:`, error)
          // Still mark as run to prevent retry loops
          markScheduleRun(schedule.id)
        }
      }
    }
  }, intervalMs)
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    console.log('🛑 Scheduler stopped')
  }
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return schedulerInterval !== null
}

