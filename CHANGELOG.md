# Changelog

All notable changes to ZwartifyOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/kriszwart/ZwartifyOSv1/releases/tag/v1.0.0
[0.1.0]: https://github.com/kriszwart/ZwartifyOSv1/releases/tag/v0.1.0

