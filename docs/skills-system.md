# Agent Skills System

## Overview

Agent Skills are modular capabilities that extend agent functionality with domain-specific expertise, workflows, and best practices. Unlike tools (which are executable functions), Skills provide instructions, context, and guidance that agents use automatically when relevant.

## Architecture

Skills are stored as structured documents with:
- **Metadata**: Name, description, when to use
- **Instructions**: Step-by-step guidance and workflows
- **Examples**: Concrete use cases
- **Resources**: Optional reference materials (stored in RAG)

## Current Implementation

Our Skills system works in Next.js/serverless environments by:
- Storing Skills as structured data (not filesystem-based)
- Using RAG for Skill resources and examples
- Injecting Skill instructions into agent prompts
- Supporting Skill composition (multiple Skills per agent)

## Skills vs Tools

| Feature | Skills | Tools |
|---------|--------|-------|
| Purpose | Domain expertise, workflows | Executable functions |
| Format | Instructions + metadata | Code functions |
| Loading | On-demand via prompt | Always available |
| Storage | Database/RAG | Code modules |
| Composition | Multiple Skills per agent | Multiple tools per agent |

## Creating Skills

Skills can be created:
1. Via UI at `/skills`
2. Via API at `/api/skills`
3. As structured YAML/JSON files

## Using Skills

Agents automatically use Skills when:
- Skill description matches the request
- Agent is configured with specific Skills
- User explicitly requests Skill usage

