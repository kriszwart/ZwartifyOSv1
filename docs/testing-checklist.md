# Testing Checklist

## Pre-Testing Setup

- [ ] Fix import paths in API routes
- [ ] Ensure `.env.local` has `CLAUDE_API_KEY` set
- [ ] Run `npm install` to ensure dependencies
- [ ] Start dev server: `npm run dev`

## Feature Testing

### Agent Management
- [ ] Create an agent via UI (`/agents`)
- [ ] Edit an agent
- [ ] Enable/disable an agent
- [ ] Delete an agent
- [ ] List agents via API
- [ ] Get agent details via API

### Agent Execution
- [ ] Test agent via UI (`/agent`)
- [ ] Run agent via API
- [ ] Verify execution logs are created
- [ ] Check execution ID is returned

### Execution Logs
- [ ] View execution logs (`/agents/[id]/logs`)
- [ ] See execution details
- [ ] View tool calls (if any)
- [ ] Check log levels (info/warn/error)
- [ ] Verify execution duration

### RAG System
- [ ] Create RAG folder (`/rag`)
- [ ] Upload text file
- [ ] Verify file is processed
- [ ] Check chunks are created
- [ ] Test RAG query
- [ ] Use RAG with agent

### Dashboard
- [ ] View dashboard (`/dashboard`)
- [ ] See execution statistics
- [ ] Check agent overview
- [ ] Verify recent executions

### Memory
- [ ] Enable memory for agent
- [ ] Have conversation
- [ ] Verify context persists
- [ ] Check memory is used in responses

### Scheduling
- [ ] Create schedule via API
- [ ] Verify schedule is stored
- [ ] Check next run time
- [ ] Test schedule execution (if scheduler running)

## API Testing

### Agents API
```bash
# Create agent
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "prompt": "You are helpful", "enabled": true}'

# List agents
curl http://localhost:3000/api/agents

# Get agent
curl http://localhost:3000/api/agents/{id}
```

### Execution API
```bash
# Run agent
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello", "agentId": "your-id"}'

# Get executions
curl http://localhost:3000/api/agents/{id}/executions
```

### RAG API
```bash
# Create folder
curl -X POST http://localhost:3000/api/rag/folders \
  -H "Content-Type: application/json" \
  -d '{"name": "test-folder"}'

# Upload file
curl -X POST http://localhost:3000/api/rag/folders/{id}/files \
  -F "file=@test.txt"
```

## Expected Results

- ✅ All API endpoints return correct responses
- ✅ UI pages load without errors
- ✅ Agents execute successfully
- ✅ Logs are created and viewable
- ✅ RAG files are processed
- ✅ Dashboard shows statistics

## Common Issues

1. **Import errors**: Fix relative paths in API routes
2. **API key errors**: Check `.env.local` file
3. **Build errors**: Fix import paths, then rebuild
4. **Runtime errors**: Check console logs for details

