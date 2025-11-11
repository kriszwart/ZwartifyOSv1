# Deployment Guide

## Vercel (Recommended)

### Quick Deploy

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kriszwart/ZwartifyOSv1)

1. Click the button above or import repository on [Vercel](https://vercel.com)
2. Add environment variables:
   - `CLAUDE_API_KEY` (required)
   - `API_KEY` (optional, for API authentication)
   - `RATE_LIMIT_ENABLED` (optional, for rate limiting)
3. Deploy automatically on every push

### Manual Setup

1. Push your code to GitHub
2. Import repository on [Vercel](https://vercel.com)
3. Add environment variables:
   - `CLAUDE_API_KEY` (required)
   - `NEXT_PUBLIC_API_URL` (optional)
4. Deploy automatically on every push

The ACCV stack means:
- **Agents** work
- **Cursor** codes locally
- **Claude** reviews and commits
- **Vercel** deploys instantly

## Other Platforms

ZwartifyOS works on any platform that supports Next.js:

- **Docker containers** - Build and run in containers
- **Serverless functions** - Deploy as serverless functions
- **Traditional servers** - Run on Node.js servers

## Environment Variables

### Required

```
CLAUDE_API_KEY=your_anthropic_api_key_here
```

**Note:** ZwartifyOS is open source. You bring your own API key. All API calls use your Anthropic API key, and you have full visibility into token usage and costs.

### Optional (Security & Rate Limiting)

```
# Enable API key authentication
API_KEY=your-secret-api-key-here

# Enable rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

## Production Features

### Environment Validation ✅
- Validates required environment variables on startup
- Clear error messages if missing
- Prevents runtime errors

### Health Check Endpoints ✅
- `GET /api/health` - Basic health check
- `GET /api/ready` - Readiness probe (checks dependencies)

### API Key Authentication ✅ (Optional)
- Enable by setting `API_KEY` environment variable
- Supports multiple auth methods:
  - `Authorization: Bearer <api-key>` header
  - `X-API-Key: <api-key>` header
  - `?apiKey=<api-key>` query parameter

### Rate Limiting ✅ (Optional)
- Enable by setting `RATE_LIMIT_ENABLED=true`
- Configurable limits and windows
- Rate limit headers in responses

### Request Size Limits ✅
- Maximum request size: 10MB
- Prevents abuse from large payloads

See **[PHASE3_IMPLEMENTATION.md](PHASE3_IMPLEMENTATION.md)** for details.

## Token Usage & Cost Tracking

ZwartifyOS includes comprehensive token usage tracking and cost monitoring:

- **Automatic Tracking**: Every API call tracks input/output tokens
- **Cost Calculation**: Real-time cost estimates based on Claude Sonnet 4 pricing
- **Dashboard Analytics**: View total tokens, costs, and per-agent breakdowns
- **Execution Details**: See token usage for each agent execution
- **Usage API**: Programmatic access to usage statistics via `/api/usage/stats`

**Pricing (Claude Sonnet 4):**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

View usage stats in the Dashboard (`/dashboard`) or check individual execution logs.

## Claude Code for Web Sync

ZwartifyOS includes automatic sync to pull changes made by Claude Code for Web back to your local codebase.

**Quick Start:**

```bash
# Start automatic sync watcher (in separate terminal)
npm run sync:watch

# Or check for changes manually
npm run sync:check

# Pull all Claude branches
npm run sync:pull
```

**Configuration** (in `.env.local`):
```
SYNC_ENABLED=true          # Enable/disable auto-sync
SYNC_INTERVAL=30000        # Polling interval in ms (default: 30s)
```

**How it works:**
- Watches for branches matching `claude/*` pattern
- Periodically checks for new commits
- Automatically pulls changes when detected
- Only syncs when working directory is clean (safe)

See the [Sync Workflow Guide](sync-workflow.md) for detailed instructions.

## Claude Code for Web Connection

### Setup Steps

1. **Install Claude Code for Web** browser extension
2. **Connect to your GitHub repository**
3. **Grant permissions** for code review and commits
4. **Use in your workflow:**
   - Open PRs in Claude Code for Web
   - Request code reviews
   - Let Claude commit directly to GitHub
   - Review and merge changes

Claude Code for Web can:
- Review your ZwartifyOS code
- Suggest improvements
- Write patches
- Commit directly to your repository
- Create pull requests

This creates a continuous improvement loop where your system evolves through AI-assisted code reviews.

---

**See [Quick Start Guide](quick-start.md) for initial setup instructions.**

