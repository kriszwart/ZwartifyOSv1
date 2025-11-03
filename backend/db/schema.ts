/**
 * Database Schema
 * 
 * Schema definitions for SQLite database (can be extended to PostgreSQL)
 * 
 * This provides a simple file-based database for templates, with the option
 * to upgrade to PostgreSQL for production use.
 */

import { AgentExecution, ToolCall, AgentLog, AgentDefinition } from './types'

// SQLite schema (for file-based storage)
export const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  enabled BOOLEAN NOT NULL DEFAULT 1,
  metadata TEXT, -- JSON string
  created_by_agent_id TEXT, -- ID of agent that created this agent
  creation_prompt TEXT -- Original prompt used to create this agent
);

CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  input TEXT NOT NULL,
  output TEXT,
  error TEXT,
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  duration INTEGER, -- milliseconds
  metadata TEXT -- JSON string
);

CREATE TABLE IF NOT EXISTS tool_calls (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  arguments TEXT, -- JSON string
  result TEXT, -- JSON string
  error TEXT,
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  duration INTEGER, -- milliseconds
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  data TEXT, -- JSON string
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rag_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT -- JSON string
);

CREATE TABLE IF NOT EXISTS rag_files (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN NOT NULL DEFAULT 0,
  chunk_count INTEGER DEFAULT 0,
  FOREIGN KEY (folder_id) REFERENCES rag_folders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rag_chunks (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT, -- JSON array of floats
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES rag_files(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_run_at DATETIME,
  next_run_at DATETIME,
  metadata TEXT, -- JSON string
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedule_executions (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  triggered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed')),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_executions_agent_id ON executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions(started_at);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_tool_calls_execution_id ON tool_calls(execution_id);
CREATE INDEX IF NOT EXISTS idx_logs_execution_id ON logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_rag_files_folder_id ON rag_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_schedules_agent_id ON schedules(agent_id);
CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_schedules_next_run_at ON schedules(next_run_at);
`

// PostgreSQL schema (for production use)
export const POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB,
  created_by_agent_id UUID REFERENCES agents(id), -- ID of agent that created this agent
  creation_prompt TEXT -- Original prompt used to create this agent
);

CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  agent_name VARCHAR(255),
  status VARCHAR(20) NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  input TEXT NOT NULL,
  output TEXT,
  error TEXT,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration INTEGER, -- milliseconds
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  tool_name VARCHAR(255) NOT NULL,
  arguments JSONB,
  result JSONB,
  error TEXT,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration INTEGER -- milliseconds
);

CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  level VARCHAR(10) NOT NULL CHECK(level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rag_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS rag_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES rag_folders(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  chunk_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES rag_files(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- For OpenAI embeddings (1536 dimensions)
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  cron_expression VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS schedule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_executions_agent_id ON executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions(started_at);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_tool_calls_execution_id ON tool_calls(execution_id);
CREATE INDEX IF NOT EXISTS idx_logs_execution_id ON logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_rag_files_folder_id ON rag_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_schedules_agent_id ON schedules(agent_id);
CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_schedules_next_run_at ON schedules(next_run_at);
`

