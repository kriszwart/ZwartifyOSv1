import { NextResponse } from "next/server"
import { execSync } from "child_process"

/**
 * Sync API Endpoint
 * 
 * GET: Check for pending Claude Code for Web changes
 * POST: Trigger manual sync
 */

function runGitCommand(command: string): string | null {
  try {
    return execSync(command, {
      encoding: "utf-8",
      cwd: process.cwd(),
      stdio: "pipe",
    })
      .toString()
      .trim()
  } catch (error) {
    return null
  }
}

function getRemoteClaudeBranches(): string[] {
  const branches = runGitCommand("git branch -r")
  if (!branches) return []

  return branches
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b.startsWith("origin/") && /^claude\//.test(b.replace("origin/", "")))
    .map((b) => b.replace("origin/", ""))
}

function getCommitHash(branch: string, remote = false): string | null {
  const branchRef = remote ? `origin/${branch}` : branch
  return runGitCommand(`git rev-parse ${branchRef} 2>/dev/null`)
}

function hasLocalBranch(branch: string): boolean {
  const result = runGitCommand(`git rev-parse --verify ${branch} 2>/dev/null`)
  return result !== null
}

async function checkForChanges() {
  runGitCommand("git fetch origin")
  const claudeBranches = getRemoteClaudeBranches()

  const branchStatus = claudeBranches.map((branch) => {
    const localHash = hasLocalBranch(branch) ? getCommitHash(branch) : null
    const remoteHash = getCommitHash(branch, true)
    const hasChanges = localHash !== remoteHash

    return {
      branch,
      localHash,
      remoteHash,
      hasChanges,
      isLocal: hasLocalBranch(branch),
    }
  })

  const pendingChanges = branchStatus.filter((b) => b.hasChanges)

  return {
    branches: branchStatus,
    pendingCount: pendingChanges.length,
    totalBranches: claudeBranches.length,
  }
}

export async function GET() {
  try {
    const status = await checkForChanges()

    return NextResponse.json({
      success: true,
      ...status,
      message: status.pendingCount > 0 
        ? `${status.pendingCount} branch(es) have pending changes`
        : "All branches are up to date",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // Trigger sync (this is a read-only check, actual sync happens via npm script)
    const status = await checkForChanges()

    return NextResponse.json({
      success: true,
      ...status,
      message: status.pendingCount > 0
        ? `Run 'npm run sync:pull' to sync ${status.pendingCount} branch(es)`
        : "All branches are already synced",
      command: status.pendingCount > 0 ? "npm run sync:pull" : null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

