import { NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"
import crypto from "crypto"

/**
 * GitHub Webhook Handler
 * 
 * Accepts GitHub webhook push events for claude/* branches
 * and triggers sync to pull changes locally.
 * 
 * Setup:
 * 1. Add webhook URL in GitHub: https://your-domain.com/api/webhook/github
 * 2. Set webhook secret in GITHUB_WEBHOOK_SECRET env variable
 * 3. Select "push" events only
 */

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface GitHubPushEvent {
  ref: string
  commits: Array<{
    id: string
    message: string
    author: {
      name: string
      email: string
    }
  }>
  repository: {
    name: string
    full_name: string
  }
}

/**
 * Verify GitHub webhook signature
 */
function verifyGitHubSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false
  }

  // GitHub sends signature as: sha256=<hash>
  const signatureHash = signature.replace('sha256=', '')
  
  // Compute expected signature
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedHash = hmac.digest('hex')
  
  // Compare using timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signatureHash),
    Buffer.from(expectedHash)
  )
}

/**
 * Extract branch name from ref
 * ref format: refs/heads/branch-name
 */
function extractBranchName(ref: string): string | null {
  const match = ref.match(/^refs\/heads\/(.+)$/)
  return match ? match[1] : null
}

/**
 * Check if branch matches claude/* pattern
 */
function isClaudeBranch(branch: string): boolean {
  return /^claude\//.test(branch)
}

/**
 * Trigger sync for a specific branch
 */
async function syncBranch(branch: string): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    // Use the sync script in webhook mode with specific branch
    const output = execSync(
      `node scripts/sync-claude-changes.js check`,
      {
        encoding: 'utf-8',
        cwd: process.cwd(),
        env: {
          ...process.env,
          WEBHOOK_MODE: 'true',
          SYNC_BRANCH: branch,
        },
      }
    )
    
    return { success: true, output }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

/**
 * POST /api/webhook/github
 * Handle GitHub webhook push events
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.error('GITHUB_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Get signature from headers
    const signature = request.headers.get('x-hub-signature-256')
    
    // Read raw body for signature verification
    const rawBody = await request.text()
    
    // Verify signature
    if (!verifyGitHubSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse webhook payload
    const payload: GitHubPushEvent = JSON.parse(rawBody)
    
    // Extract branch name
    const branchName = extractBranchName(payload.ref)
    
    if (!branchName) {
      return NextResponse.json(
        { error: 'Invalid ref format', ref: payload.ref },
        { status: 400 }
      )
    }

    // Check if it's a claude/* branch
    if (!isClaudeBranch(branchName)) {
      return NextResponse.json({
        message: 'Not a claude/* branch, ignoring',
        branch: branchName,
      })
    }

    // Log webhook received
    console.log(`[GitHub Webhook] Push detected on branch: ${branchName}`)
    console.log(`[GitHub Webhook] Commits: ${payload.commits.length}`)
    
    // Trigger sync
    const syncResult = await syncBranch(branchName)
    
    if (syncResult.success) {
      return NextResponse.json({
        message: 'Webhook received and sync triggered',
        branch: branchName,
        commits: payload.commits.length,
        sync: 'success',
      })
    } else {
      console.error(`[GitHub Webhook] Sync failed: ${syncResult.error}`)
      return NextResponse.json(
        {
          message: 'Webhook received but sync failed',
          branch: branchName,
          error: syncResult.error,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[GitHub Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhook/github
 * Health check endpoint for webhook configuration
 */
export async function GET() {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
  const isConfigured = !!webhookSecret
  
  return NextResponse.json({
    status: 'ok',
    webhookConfigured: isConfigured,
    message: isConfigured 
      ? 'Webhook endpoint is ready. Configure GitHub webhook to POST to this URL.'
      : 'Webhook secret not configured. Set GITHUB_WEBHOOK_SECRET environment variable.',
    instructions: [
      '1. Add webhook in GitHub repository settings',
      '2. Set URL: https://your-domain.com/api/webhook/github',
      '3. Set Content type: application/json',
      '4. Set Secret: (same as GITHUB_WEBHOOK_SECRET)',
      '5. Select events: "Just the push event"',
    ],
  })
}

