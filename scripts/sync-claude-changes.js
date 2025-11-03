#!/usr/bin/env node

/**
 * Sync Claude Code for Web Changes
 * 
 * Automatically syncs changes made by Claude Code for Web via GitHub
 * back to the local codebase. Polls for claude/* branches and pulls updates.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL || '30000', 10) // 30 seconds default
const ENABLED = process.env.SYNC_ENABLED !== 'false'
const CLAUDE_BRANCH_PATTERN = /^claude\//
const WEBHOOK_MODE = process.env.WEBHOOK_MODE === 'true'
const SYNC_BRANCH = process.env.SYNC_BRANCH // Specific branch to sync (webhook mode)

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString()
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`)
}

function runGitCommand(command) {
  try {
    return execSync(command, { 
      encoding: 'utf-8',
      cwd: process.cwd(),
      stdio: 'pipe'
    }).trim()
  } catch (error) {
    return null
  }
}

function isWorkingDirectoryClean() {
  const status = runGitCommand('git status --porcelain')
  return !status || status.length === 0
}

function getCurrentBranch() {
  return runGitCommand('git rev-parse --abbrev-ref HEAD')
}

function fetchRemoteBranches() {
  log('Fetching remote branches...', 'cyan')
  runGitCommand('git fetch origin')
}

function getRemoteClaudeBranches() {
  const branches = runGitCommand('git branch -r')
  if (!branches) return []
  
  return branches
    .split('\n')
    .map(b => b.trim())
    .filter(b => b.startsWith('origin/') && CLAUDE_BRANCH_PATTERN.test(b.replace('origin/', '')))
    .map(b => b.replace('origin/', ''))
}

function getLocalCommitHash(branch) {
  return runGitCommand(`git rev-parse ${branch} 2>/dev/null`)
}

function getRemoteCommitHash(branch) {
  return runGitCommand(`git rev-parse origin/${branch} 2>/dev/null`)
}

function hasLocalBranch(branch) {
  const result = runGitCommand(`git rev-parse --verify ${branch} 2>/dev/null`)
  return result !== null
}

function syncBranch(branch) {
  const localHash = hasLocalBranch(branch) ? getLocalCommitHash(branch) : null
  const remoteHash = getRemoteCommitHash(branch)
  
  if (!remoteHash) {
    log(`Branch ${branch} not found on remote`, 'yellow')
    return false
  }
  
  if (localHash === remoteHash) {
    log(`Branch ${branch} is up to date`, 'green')
    return false
  }
  
  log(`Syncing branch ${branch}...`, 'blue')
  
  const currentBranch = getCurrentBranch()
  const isClean = isWorkingDirectoryClean()
  
  if (!isClean && currentBranch !== branch) {
    log(`Working directory not clean, skipping sync for ${branch}`, 'yellow')
    return false
  }
  
  try {
    if (!hasLocalBranch(branch)) {
      log(`Creating local branch ${branch} from remote`, 'cyan')
      runGitCommand(`git checkout -b ${branch} origin/${branch}`)
      log(`Switched to ${branch}`, 'green')
    } else {
      log(`Checking out ${branch}`, 'cyan')
      runGitCommand(`git checkout ${branch}`)
      log(`Pulling latest changes for ${branch}`, 'cyan')
      runGitCommand(`git pull origin ${branch}`)
    }
    
    // Return to original branch
    if (currentBranch !== branch) {
      runGitCommand(`git checkout ${currentBranch}`)
    }
    
    log(`Successfully synced ${branch}`, 'green')
    return true
  } catch (error) {
    log(`Error syncing ${branch}: ${error.message}`, 'red')
    // Try to return to original branch
    try {
      runGitCommand(`git checkout ${currentBranch}`)
    } catch {}
    return false
  }
}

function checkForChanges() {
  if (!ENABLED) {
    log('Sync is disabled (SYNC_ENABLED=false)', 'yellow')
    return
  }
  
  // Webhook mode: sync specific branch
  if (WEBHOOK_MODE && SYNC_BRANCH) {
    log(`Webhook mode: Syncing branch ${SYNC_BRANCH}...`, 'cyan')
    
    if (!isClaudeBranch(SYNC_BRANCH)) {
      log(`Branch ${SYNC_BRANCH} is not a claude/* branch, ignoring`, 'yellow')
      return { branches: [], synced: 0 }
    }
    
    const hadChanges = syncBranch(SYNC_BRANCH)
    return {
      branches: [{ branch: SYNC_BRANCH, synced: hadChanges }],
      synced: hadChanges ? 1 : 0,
    }
  }
  
  // Polling mode: check all claude/* branches
  log('Checking for Claude Code for Web changes...', 'cyan')
  
  fetchRemoteBranches()
  const claudeBranches = getRemoteClaudeBranches()
  
  if (claudeBranches.length === 0) {
    log('No Claude branches found', 'yellow')
    return { branches: [], synced: 0 }
  }
  
  log(`Found ${claudeBranches.length} Claude branch(es)`, 'blue')
  
  let syncedCount = 0
  const results = []
  
  for (const branch of claudeBranches) {
    const hadChanges = syncBranch(branch)
    if (hadChanges) {
      syncedCount++
    }
    results.push({ branch, synced: hadChanges })
  }
  
  return { branches: results, synced: syncedCount }
}

function isClaudeBranch(branch) {
  return CLAUDE_BRANCH_PATTERN.test(branch)
}

function watchMode() {
  log('Starting Claude Code for Web sync watcher...', 'green')
  log(`Polling interval: ${SYNC_INTERVAL / 1000} seconds`, 'cyan')
  log('Press Ctrl+C to stop', 'yellow')
  
  // Initial check
  checkForChanges()
  
  // Set up interval
  const interval = setInterval(() => {
    checkForChanges()
  }, SYNC_INTERVAL)
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\nStopping sync watcher...', 'yellow')
    clearInterval(interval)
    process.exit(0)
  })
  
  process.on('SIGTERM', () => {
    log('\nStopping sync watcher...', 'yellow')
    clearInterval(interval)
    process.exit(0)
  })
}

// Main execution
const command = process.argv[2] || 'check'

if (command === 'watch') {
  watchMode()
} else if (command === 'check') {
  const result = checkForChanges()
  if (result && result.synced > 0) {
    log(`Synced ${result.synced} branch(es)`, 'green')
  } else {
    log('No changes to sync', 'yellow')
  }
} else if (command === 'pull') {
  log('Pulling all Claude branches...', 'cyan')
  const claudeBranches = getRemoteClaudeBranches()
  claudeBranches.forEach(branch => syncBranch(branch))
} else {
  console.log('Usage: node sync-claude-changes.js [check|watch|pull]')
  console.log('  check - One-time check for changes')
  console.log('  watch - Continuous watch mode (default)')
  console.log('  pull  - Pull all Claude branches')
  process.exit(1)
}

