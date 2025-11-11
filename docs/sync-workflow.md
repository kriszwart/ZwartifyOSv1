# Claude Code for Web Sync Workflow

## Overview

When Claude Code for Web makes changes to your repository via GitHub (on `claude/*` branches), ZwartifyOS can automatically sync those changes back to your local codebase.

## The Problem

Without automation:
1. You push code to GitHub
2. Claude Code for Web reviews and commits changes
3. Those changes exist only on GitHub
4. You must manually run `git fetch` and `git checkout` to see them locally

## The Solution

ZwartifyOS sync script automatically:
- Detects `claude/*` branches on GitHub
- Checks for new commits
- Pulls changes to your local codebase
- Preserves your working directory

## Setup

### 1. Configure Environment (Optional)

Add to `.env.local`:

```bash
SYNC_ENABLED=true          # Enable/disable auto-sync (default: true)
SYNC_INTERVAL=30000        # Polling interval in milliseconds (default: 30s)
```

### 2. Start Sync Watcher

In a separate terminal:

```bash
npm run sync:watch
```

The watcher will:
- Check for Claude branches every 30 seconds (configurable)
- Automatically pull changes when detected
- Log activity to console
- Run until you stop it (Ctrl+C)

## Usage Modes

### Watch Mode (Automatic)

```bash
npm run sync:watch
```

**When to use:**
- During active development
- When expecting Claude Code for Web changes
- For continuous sync

**Behaviour:**
- Runs continuously
- Checks every 30 seconds (or configured interval)
- Automatically pulls when changes detected
- Shows colored log output

### Check Mode (Manual One-Time)

```bash
npm run sync:check
```

**When to use:**
- Quick status check
- Before merging branches
- When you suspect changes

**Behaviour:**
- Single check operation
- Reports what branches need syncing
- Does not pull automatically

### Pull Mode (Force Sync)

```bash
npm run sync:pull
```

**When to use:**
- Force sync all Claude branches
- After being offline
- Manual refresh

**Behaviour:**
- Pulls all `claude/*` branches
- Creates local branches if missing
- Updates existing local branches

## Workflow Example

### Complete Cycle:

1. **You code locally:**
   ```bash
   # Make changes in Cursor
   git add .
   git commit -m "Add new feature"
   git push origin feature/my-feature
   ```

2. **Create PR on GitHub:**
   - Open PR from `feature/my-feature` to `main`
   - PR is now available for Claude Code for Web

3. **Claude reviews in browser:**
   - Open PR in Claude Code for Web
   - Claude analyses and suggests changes
   - Claude commits to branch `claude/improve-feature-XXXXX`

4. **Sync script detects changes:**
   ```bash
   # In your terminal
   npm run sync:watch
   # Script detects new claude/* branch
   # Automatically pulls changes
   ```

5. **Review Claude's changes locally:**
   ```bash
   git checkout claude/improve-feature-XXXXX
   # Review changes in your editor
   # Test locally
   ```

6. **Merge when ready:**
   ```bash
   git checkout feature/my-feature
   git merge claude/improve-feature-XXXXX
   git push origin feature/my-feature
   ```

## Safety Features

### Working Directory Protection

The sync script only pulls when:
- Working directory is clean (no uncommitted changes)
- Or you're already on the branch being synced

If you have uncommitted changes:
- Script skips sync for that branch
- Logs warning message
- Preserves your work

### Branch Management

- Creates local branches if they don't exist
- Updates existing branches safely
- Returns you to your original branch after sync
- Never force-pushes or overwrites local work

## API Endpoint

Check sync status via HTTP:

**GET `/api/sync`**
```json
{
  "success": true,
  "branches": [
    {
      "branch": "claude/improve-feature-XXXXX",
      "localHash": "abc123...",
      "remoteHash": "def456...",
      "hasChanges": true,
      "isLocal": true
    }
  ],
  "pendingCount": 1,
  "totalBranches": 1,
  "message": "1 branch(es) have pending changes"
}
```

**POST `/api/sync`**
- Triggers sync check
- Returns status and recommended command

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SYNC_ENABLED` | `true` | Enable/disable auto-sync |
| `SYNC_INTERVAL` | `30000` | Polling interval in milliseconds |

### Branch Pattern

Sync script looks for branches matching: `claude/*`

Examples:
- ✅ `claude/improve-api-123abc`
- ✅ `claude/fix-bug-456def`
- ❌ `feature/my-feature`
- ❌ `main`

## Troubleshooting

### Sync Not Working

**Check sync is enabled:**
```bash
echo $SYNC_ENABLED  # Should be 'true'
```

**Check git remote:**
```bash
git remote -v  # Should show your GitHub repo
```

**Check branch pattern:**
```bash
git branch -r | grep claude  # Should show claude/* branches
```

### Conflicts

If sync fails due to conflicts:
1. Manually resolve: `git checkout claude/branch-name`
2. Resolve conflicts in your editor
3. Commit resolution
4. Sync will continue normally

### Script Errors

**Permission denied:**
```bash
chmod +x scripts/sync-claude-changes.js
```

**Git not found:**
- Ensure git is installed and in PATH
- Verify repository is initialized

## Best Practices

1. **Run sync watcher during development**
   - Keep it running in a separate terminal
   - Stops when you press Ctrl+C

2. **Review before merging**
   - Always checkout Claude's branch
   - Review changes locally
   - Test before merging

3. **Keep working directory clean**
   - Commit or stash changes before sync
   - This allows automatic syncing

4. **Use manual check when needed**
   - `npm run sync:check` for quick status
   - Before important operations

## Integration with Cursor

The sync workflow integrates seamlessly with Cursor:

1. Code in Cursor → Push to GitHub
2. Claude Code for Web reviews → Commits changes
3. Sync script pulls → Changes appear in Cursor
4. Review in Cursor → Merge → Deploy

This creates a continuous loop:
- **You code locally** (Cursor)
- **Claude reviews in cloud** (Claude Code for Web)
- **Changes sync back** (Sync script)
- **You review and merge** (Cursor/GitHub)
- **System deploys** (Vercel)

## Advanced Usage

### Custom Branch Pattern

Edit `scripts/sync-claude-changes.js`:
```javascript
const CLAUDE_BRANCH_PATTERN = /^claude\//  // Default
// Change to your pattern
```

### Integration with CI/CD

Add to GitHub Actions workflow:
```yaml
- name: Check for Claude changes
  run: npm run sync:check
```

### Script Logging

Logs go to console. To save to file:
```bash
npm run sync:watch > sync.log 2>&1
```

---

**The sync system enables true bidirectional workflow:**
- You → GitHub → Claude → GitHub → You

**All automatic. All seamless.**

