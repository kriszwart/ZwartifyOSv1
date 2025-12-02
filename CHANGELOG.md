# Changelog

All notable changes to ZwartifyOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-11-XX

### Added
- **Self-Improvement Loops**: Agents can analyze and optimize their own performance
  - **Performance Metrics System**: Track detailed metrics per agent
    - Success rate tracking (by agent, task type)
    - Response time and token usage analytics
    - Tool effectiveness scores with trend analysis
    - New API: `GET /api/analytics`, `GET /api/analytics/agent/[id]`
  - **Error Analysis Engine**: Learn from failures
    - Error categorization (tool_failure, context_missing, timeout, rate_limit, etc.)
    - Pattern detection for recurring errors
    - Root cause suggestions and remediation recommendations
  - **Tool Selection Optimizer**: Improve tool usage
    - Tool usage tracking per task type
    - Success correlation analysis
    - Tool recommendation engine
    - Tool combination pattern detection
  - **Skill Gap Analysis**: Identify missing capabilities
    - Task failure analysis for skill gaps
    - Skill recommendations based on usage patterns
    - Coverage scoring and improvement potential
    - New API: `GET /api/agents/[id]/recommendations`
  - **Prompt Refinement System**: Improve agent prompts
    - Prompt effectiveness scoring
    - Weakness identification (clarity, specificity, examples, constraints)
    - A/B testing support with version history
    - Safe prompt updates with rollback
    - New API: `GET/POST /api/agents/[id]/refine-prompt`
  - **Self-Improvement Tool**: Agent-callable tool for self-analysis
    - `analyzePerformance`: Get health assessment and metrics
    - `identifyWeaknesses`: Find areas needing improvement
    - `suggestImprovements`: Get actionable recommendations
    - `applyImprovement`: Apply improvements (with safety checks)
  - **Improvements Dashboard**: Visual interface at `/agents/[id]/improvements`
    - Performance trends and health scores
    - Skill gap visualization
    - Tool effectiveness matrix
    - Prompt analysis with suggestions

### Changed
- Added `selfImprove` tool to tool registry
- Analytics and improvement modules now track execution data automatically

## [1.3.0] - 2025-11-XX

### Added
- **Claude SDK Integration**: Enabling autonomous agent operation within Next.js/Vercel constraints
  - **Agent Sessions**: Persistent sessions that maintain state across multiple interactions
    - Session creation with goals, context, and history
    - Session pause/resume/complete lifecycle
    - Session context building for agent prompts
    - New API: `POST/GET /api/agent/session`, `GET/PATCH/DELETE /api/agent/session/[id]`
  - **Multi-Turn Tool Loops**: Agents can call multiple tools in sequence without user intervention
    - New `maxToolIterations` option (default: 5)
    - New `autonomousMode` flag for self-directed execution
    - Tool chain tracking for observability
    - New `runAutonomous()` method in agentClient
  - **Background Job Execution**: Long-running agent tasks with async processing
    - Job queue with status tracking (pending, running, completed, failed)
    - Job results storage and polling
    - Retry and cancel capabilities
    - New API: `POST/GET /api/agent/async`, `GET/PATCH/DELETE /api/jobs/[id]`, `GET /api/jobs`
  - **Enhanced Scheduler**: Production-ready cron scheduling
    - Proper cron expression parsing (supports *, ranges, lists, steps, and aliases)
    - Cron validation and human-readable descriptions
    - Job history with retry logic (configurable max retries)
    - New API: `GET/DELETE /api/schedules/jobs`
  - **Event-Driven Triggers**: Agents respond to external events automatically
    - Webhook triggers with signature validation
    - Schedule triggers (integrated with enhanced scheduler)
    - Agent completion triggers (agent A triggers agent B)
    - Condition evaluation for payload filtering
    - Input templates with placeholder substitution
    - New API: `POST/GET /api/triggers`, `GET/PATCH/DELETE /api/triggers/[id]`, `GET/POST/PUT /api/webhook/[triggerId]`
  - **Agent State Persistence**: Save and restore agent state for long-running operations
    - Goal management with priorities and dependencies
    - Subtask tracking within goals
    - Action history and learning capture
    - State snapshots for recovery
    - State context building for agent prompts

### Changed
- agentClient now supports `sessionId`, `maxToolIterations`, and `autonomousMode` options
- Scheduler manager fully rewritten with proper cron parsing and job history

## [1.2.0] - 2025-11-XX

### Added
- **Advanced Tool Use Patterns**: Implementing Anthropic's advanced tool use patterns for improved agent capabilities
  - **Tool Search Tool**: Dynamic tool discovery saves 85% context tokens. Agents find tools on-demand instead of loading all upfront.
  - **Tool Use Examples**: 5 comprehensive examples for `createAgent` tool improve accuracy from 72% to 90%.
  - **Deferred Tool Loading**: New `useDeferredLoading` option in agentClient - only loads searchTools initially
  - Patterns inspired by [Anthropic's Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use) and [Arcade MCP Framework](https://www.arcade.dev/mcp)
- **Enhanced Ouroboros Visualization**: Interactive agent lineage chain display
  - Animated visualization showing agent creation hierarchy
  - Level-based node display with active state highlighting
  - Expandable advanced features section explaining Tool Search, Examples, and the Ouroboros pattern
  - Real-time stats: 85% token savings, 90% accuracy, infinite recursion depth
  - Compact and full variants for different use cases
  - **NEW**: `useRealData` prop to fetch real agent lineage from `/api/agents/lineage`
- **Tool Browser UI Component**: Visual tool discovery interface
  - Search input with real-time filtering
  - Category tabs (Discovery, Agents, Platforms, Formatting, Vision, Utility)
  - Tool cards with description, category, and relevance score
  - Click to copy tool name
  - Compact and full variants
- **New API Endpoints**:
  - `GET /api/agents/lineage` - Returns agent tree data with parent/child relationships
  - `GET /api/tools/search` - Exposes toolSearchTool for frontend integration
- **Demo Page Updates**: 
  - New "Dynamic Tool Discovery" step showcasing searchTools
  - Updated Ouroboros step with full variant and real data
  - Tool Browser integration

### Changed
- `createAgent` tool now includes detailed input examples following Anthropic's best practices
- Tool registry documentation updated to reference advanced tool use patterns
- Ouroboros visualization upgraded from static to dynamic component with real data support
- Demo now has 9 steps (was 8) with improved flow

## [1.1.0] - 2025-01-XX

### Added
- **Streaming Responses**: Real-time streaming of agent responses using Server-Sent Events (SSE)
  - New `/api/agent/stream` endpoint for streaming agent execution
  - Real-time text chunks as agent generates responses
  - Tool execution indicators during streaming
  - Streaming toggle in agent UI pages (main agent, agent detail, playground)
  - Backward compatible with existing non-streaming endpoint
- **Full MCP Client Implementation**: Complete MCP (Model Context Protocol) client for platform integration
  - HTTP-based MCP server communication with JSON-RPC 2.0 protocol
  - Server URL resolution from platform names or direct URLs
  - Comprehensive error handling (network errors, timeouts, invalid servers)
  - 30-second timeout protection with AbortController
  - Support for agent-specific MCP server configuration
  - Enhanced registry methods (`getServerByUrl`, `getServerByPlatform`)
- **Interactive Changelog Page**: Beautiful terminal-style changelog interface
  - Parses CHANGELOG.md and displays versions in expandable cards
  - Search/filter functionality for versions and features
  - Color-coded sections (Added=green, Changed=cyan, Fixed=yellow)
  - Major version highlighting with animations
  - Version badge component with "NEW" indicator
  - localStorage-based version tracking
  - Links to GitHub releases

### Changed
- Updated agent client to support streaming mode alongside standard mode
- Enhanced MCP client tool with full implementation (replaced stub)
- Improved user experience with real-time feedback during agent execution

### Fixed
- ReactMarkdown className prop compatibility issue in changelog page

## [1.0.0] - 2025-11-11

### Added
- **Token Usage Tracking**: Comprehensive token usage tracking for all API calls
  - Automatic tracking of input/output tokens for every agent execution
  - Real-time cost calculation based on Claude Sonnet 4 pricing
  - Token usage displayed in execution logs and dashboard
- **Cost Monitoring**: Built-in cost tracking and analytics
  - Dashboard with total tokens, costs, and per-agent breakdowns
  - Usage statistics API endpoints (`/api/usage/stats`, `/api/usage/agent/[id]`)
  - Cost estimates displayed for each execution
- **Interactive Demo Page**: New `/demo` route showcasing G-SAC workflow
  - 8-step animated walkthrough of agent creation process
  - Typewriter effect for engaging presentation
  - Cumulative token usage display
  - Works without API key (mock data)
- **API Versioning**: Structured API versioning support
- **Authentication**: Optional API key authentication
  - Support for Bearer token, X-API-Key header, and query parameter
  - Configurable via `API_KEY` environment variable
- **Rate Limiting**: Optional rate limiting for API endpoints
  - Configurable limits and time windows
  - Rate limit headers in responses
- **Health Checks**: Production-ready health check endpoints
  - `GET /api/health` - Basic health check
  - `GET /api/ready` - Readiness probe with dependency checks
- **Environment Validation**: Startup validation of required environment variables
  - Clear error messages for missing configuration
  - Prevents runtime errors from misconfiguration
- **Structured Error Logging**: Improved error tracking and logging
  - Detailed error information in execution logs
  - Stack traces for debugging

### Changed
- Updated documentation structure for better developer experience
- Improved README with clearer quick start guide
- Enhanced dashboard with token usage statistics
- Updated execution logs to display token usage and costs

### Fixed
- Token tracking accuracy for multi-step agent executions
- Cost calculation consistency across all endpoints

## [0.1.0] - 2025-10-31

### Added
- Initial release
- Core agent system with tool registry
- RAG (Retrieval Augmented Generation) system
- Memory and conversation persistence
- Scheduling system for automated agent runs
- Skills system for domain expertise
- G-SAC (Growth Strategy Agent Creator) - meta-agent for creating agents
- Agent management UI
- Execution logging and observability
- 7 example agents (PDF Processor, Data Analyst, Code Reviewer, Content Writer, Email Assistant, Research Assistant, Customer Support)
- 7 built-in skills
- MCP (Model Context Protocol) support
- Platform-agnostic agent design
- Agent lineage tracking

[1.2.0]: https://github.com/kriszwart/ZwartifyOSv1/releases/tag/v1.2.0
[1.1.0]: https://github.com/kriszwart/ZwartifyOSv1/releases/tag/v1.1.0
[1.0.0]: https://github.com/kriszwart/ZwartifyOSv1/releases/tag/v1.0.0
[0.1.0]: https://github.com/kriszwart/ZwartifyOSv1/releases/tag/v0.1.0

