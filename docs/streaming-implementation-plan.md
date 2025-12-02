# Streaming Responses Implementation Plan

## Overview

Implement real-time streaming responses for agent execution to improve user experience by showing progress as the agent generates responses, rather than waiting for the complete response.

## Current State

- Agents use `anthropic.messages.create()` which supports streaming but isn't currently used
- API routes return complete JSON responses
- Frontend uses `fetch()` to get responses synchronously
- No real-time feedback during agent execution

## Implementation Plan

### 1. Add Streaming Support to Agent Client (`backend/agents/agentClient.ts`)

Create a new streaming method that:
- Uses Anthropic SDK's streaming API (`stream: true`)
- Yields text chunks as they arrive
- Handles tool calls during streaming
- Maintains execution logging
- Returns an async generator for text chunks

**Key functions:**
- `runStreaming()` - New method that streams responses
- Handle streaming text deltas
- Handle tool calls in streaming mode
- Maintain compatibility with existing logging

### 2. Create Streaming API Route (`app/api/agent/stream/route.ts`)

Create new SSE endpoint:
- Accepts same parameters as `/api/agent`
- Returns Server-Sent Events (SSE) stream
- Sends text chunks as they arrive
- Sends tool execution events
- Sends completion event with final result
- Handles errors gracefully

**Route:** `POST /api/agent/stream`

**Response format:**
- `data: {"type": "text", "content": "chunk"}\n\n`
- `data: {"type": "tool", "name": "toolName", "status": "started"}\n\n`
- `data: {"type": "done", "executionId": "..."}\n\n`
- `data: {"type": "error", "error": "..."}\n\n`

### 3. Update Frontend Components

Update agent UI pages to support streaming:
- `app/agent/page.tsx` - Main agent interface
- `app/agent/[id]/page.tsx` - Agent detail page
- `app/playground/page.tsx` - Playground interface

**Changes:**
- Add option to enable/disable streaming (toggle or query param)
- Use `EventSource` or `fetch` with `ReadableStream` for SSE
- Append text chunks as they arrive
- Show tool execution indicators
- Handle streaming errors
- Fallback to non-streaming if streaming fails

### 4. Maintain Backward Compatibility

- Keep existing `/api/agent` endpoint working
- Add streaming as opt-in feature
- Ensure non-streaming mode still works
- Update API documentation

## Files to Create/Modify

1. `backend/agents/agentClient.ts` - Add `runStreaming()` method
2. `app/api/agent/stream/route.ts` - **NEW** - SSE streaming endpoint
3. `app/agent/page.tsx` - Add streaming support
4. `app/agent/[id]/page.tsx` - Add streaming support
5. `app/playground/page.tsx` - Add streaming support

## Success Criteria

- Users see text appear in real-time as agent generates it
- Tool executions are shown during streaming
- Streaming works with all existing features (RAG, memory, skills, tools)
- Non-streaming mode still works
- Error handling works for streaming failures
- Execution logging still captures full execution

## Technical Considerations

- SSE format: `data: {json}\n\n`
- Handle connection drops gracefully
- Buffer management for large responses
- Token usage tracking during streaming
- Tool call handling in streaming mode


