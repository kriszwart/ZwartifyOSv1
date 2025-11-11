# Feature Usage Guide

## ✨ New in v1.0.0

**Production-Ready Release** - ZwartifyOS v1.0.0 introduces enterprise-grade features:

### Token Usage & Cost Tracking
- **Automatic Tracking**: Every API call tracks input/output tokens
- **Cost Calculation**: Real-time cost estimates based on Claude Sonnet 4 pricing
- **Dashboard Analytics**: View total tokens, costs, and per-agent breakdowns
- **Execution Details**: See token usage for each agent execution
- **Usage API**: Programmatic access via `/api/usage/stats` and `/api/usage/agent/[id]`

### Production Features
- **API Versioning**: Structured API versioning support (v1.0.0)
- **Authentication**: Optional API key authentication with multiple auth methods
- **Rate Limiting**: Configurable rate limiting for API protection
- **Health Checks**: Production-ready endpoints (`/api/health`, `/api/ready`)
- **Environment Validation**: Startup validation prevents misconfiguration
- **Structured Error Logging**: Comprehensive error tracking with stack traces

### Interactive Demo
- New `/demo` page showcasing G-SAC workflow
- Works without API key (mock data)
- Shows token usage tracking in action

See [CHANGELOG.md](../CHANGELOG.md) for complete release notes.

---

## 🎯 Agent Management

### Creating Agents

Agents are the core of ZwartifyOS. Each agent has:
- **Name**: Unique identifier
- **Description**: What the agent does
- **Prompt**: Instructions for the agent
- **Version**: Track agent versions
- **Enabled/Disabled**: Control agent availability

**Example: Customer Support Agent**
```typescript
{
  name: "customer-support",
  description: "Handles customer inquiries",
  prompt: "You are a customer support agent. Be helpful, professional, and empathetic. Use the knowledge base to answer questions accurately.",
  enabled: true
}
```

### Testing Agents

1. **Via UI**: Go to `/agent`, type your message, click Send
2. **Via API**: POST to `/api/agent` with `input` and `agentId`
3. **With Memory**: Include `useMemory: true` to maintain conversation context

### Viewing Execution History

Every agent execution is logged with:
- Execution ID (unique identifier)
- Input/output
- Status (pending/running/completed/failed)
- Duration
- Tool calls (if any)
- Error details (if failed)

Access logs at: `/agents/[agent-id]/logs`

---

## 🧠 RAG (Retrieval Augmented Generation)

### What is RAG?

RAG allows agents to use your own documents as knowledge sources. Upload files, and the agent can reference them when answering questions.

### Setting Up RAG

**Step 1: Create a Folder**
```
1. Go to /rag
2. Click "+ Create Folder"
3. Name: "company-docs"
4. Create
```

**Step 2: Upload Files**
Supported formats:
- Text: `.txt`, `.md`
- Documents: `.pdf` (basic support)
- Data: `.json`, `.csv`
- Code: `.py`, `.js`, `.ts`
- Web: `.html`, `.htm`

**Step 3: Assign to Agent**
When creating/editing an agent, specify the RAG folder ID in the configuration.

### How RAG Works

1. **Upload**: Files are uploaded and stored
2. **Chunking**: Text is split into manageable chunks
3. **Embedding**: Each chunk is converted to a vector embedding
4. **Query**: When agent needs context, relevant chunks are retrieved
5. **Enhancement**: Retrieved chunks are added to the agent's prompt

### Best Practices

- **Organise by Topic**: Create separate folders for different domains
- **Keep Files Focused**: Smaller, focused documents work better
- **Update Regularly**: Refresh RAG folders with new information
- **Quality Over Quantity**: Better documents = better responses

---

## 💾 Conversation Memory

### How Memory Works

When `useMemory` is enabled (default):
1. Each agent maintains conversation history
2. Previous messages are included in context
3. Agent can reference earlier parts of conversation
4. Memory persists across sessions

### Enabling Memory

Memory is enabled by default when:
- Agent has an `agentId`
- `useMemory` option is not set to `false`

### Using Memory

**Example Conversation:**
```
User: "My name is Alice"
Agent: "Nice to meet you, Alice!"

User: "What's my name?"  // Agent remembers!
Agent: "Your name is Alice"
```

### Memory Limits

- Default: Last 10 messages
- Configurable via `buildConversationContext()` maxMessages parameter
- Older conversations are automatically pruned

---

## 🕐 Scheduling

### Creating Schedules

Schedules allow agents to run automatically at specified times.

**Cron Expression Format:**
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

**Common Examples:**
- `0 9 * * *` - Every day at 9 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 1` - Every Monday at midnight
- `*/30 * * * *` - Every 30 minutes
- `0 9 * * 1-5` - Weekdays at 9 AM

### Schedule Configuration

```json
{
  "agentId": "report-generator",
  "cronExpression": "0 9 * * *",
  "enabled": true,
  "metadata": {
    "input": "Generate today's report",
    "recipients": ["team@company.com"]
  }
}
```

### Monitoring Schedules

- Check `lastRunAt` for last execution time
- Check `nextRunAt` for next scheduled run
- View execution logs to see scheduled runs

---

## 📊 Dashboard & Analytics

### Key Metrics

**Execution Statistics:**
- Total Executions: All agent runs
- Completed: Successful executions
- Failed: Errored executions
- Running: Currently executing

**Agent Statistics:**
- Total Agents: Number of agents
- Enabled Agents: Active agents
- Average Duration: Mean execution time
- Success Rate: Percentage successful

### Using the Dashboard

1. **Overview**: See system-wide statistics
2. **Recent Executions**: Latest runs across all agents
3. **Agent Cards**: Quick access to agent logs
4. **Performance**: Track execution times and success rates

### Interpreting Metrics

- **High Success Rate**: Agents are working well
- **High Avg Duration**: May need optimization
- **Many Failed Executions**: Check logs for errors
- **Low Running Count**: System is healthy

---

## 🔍 Execution Logs

### Understanding Logs

Each execution log contains:

**Basic Info:**
- Execution ID
- Agent ID/Name
- Status
- Timestamps
- Duration

**Detailed Info:**
- Input text
- Output text
- Error messages (if any)
- Tool calls (if any)
- Log entries (info/warn/error/debug)

### Log Levels

- **INFO**: Normal operations
- **WARN**: Potential issues
- **ERROR**: Errors occurred
- **DEBUG**: Detailed debugging info

### Using Logs for Debugging

1. **Check Errors**: Look for ERROR level logs
2. **Review Tool Calls**: See what tools were used
3. **Performance**: Check execution duration
4. **Context**: Review input/output for issues

---

## 🔧 Advanced Features

### Custom Tools

Agents can use custom tools. Define tools in `/backend/tools/`:

```typescript
export const myTool = {
  name: "myTool",
  description: "Does something useful",
  execute: async () => {
    // Your logic here
    return "Result"
  }
}
```

### Agent Configuration Format

Agents can be defined in YAML/JSON format:

```yaml
title: My Agent
prompt: |
  You are helpful...
public: false
enabled: true
version: 1.0.0
rag: my-knowledge-base
tools:
  - markdownFormatter
  - screenshotDescription
```

### Metadata Usage

Add custom metadata to track:
- Source of request
- User information
- Request context
- Custom tags

```json
{
  "input": "Hello",
  "agentId": "my-agent",
  "metadata": {
    "userId": "123",
    "source": "web",
    "priority": "high"
  }
}
```

---

## 🎓 Best Practices

### Agent Design

1. **Clear Prompts**: Be specific about agent's role
2. **Use Examples**: Include examples in prompts
3. **Set Boundaries**: Define what agent should/shouldn't do
4. **Iterate**: Refine prompts based on results

### RAG Usage

1. **Quality Content**: Upload well-written documents
2. **Organisation**: Use folders to organise by topic
3. **Update Regularly**: Keep knowledge base current
4. **Test Relevance**: Verify agent uses RAG correctly

### Performance

1. **Monitor Logs**: Track execution times
2. **Optimise Prompts**: Shorter prompts = faster execution
3. **Use Memory Wisely**: Don't load too much context
4. **Cache RAG**: Consider caching frequently used queries

### Security

1. **API Keys**: Never commit `.env.local`
2. **Validate Input**: Sanitize user inputs
3. **Rate Limiting**: Implement rate limits for production
4. **Access Control**: Add authentication for production

---

## 🚀 Production Deployment

### Environment Variables

```env
CLAUDE_API_KEY=sk-ant-...
NODE_ENV=production
```

### Database

Currently using in-memory storage. For production:
- Switch to SQLite (file-based)
- Or PostgreSQL (recommended for scale)

### Scheduler

For production scheduling:
- Use proper cron library (node-cron)
- Or external scheduler (Vercel Cron, etc.)
- Monitor schedule execution

### Monitoring

- Set up error tracking (Sentry, etc.)
- Monitor API usage
- Track execution metrics
- Set up alerts for failures

---

## 📞 Getting Help

- Check execution logs for errors
- Review dashboard for system health
- Test agents individually
- Review documentation

Happy Building! 🎉

