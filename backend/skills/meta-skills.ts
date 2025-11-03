/**
 * Meta-Skills for Agent Creation
 * 
 * Specialized skills that enable the G-SAC (Growth Strategy Agent Creator)
 * to autonomously create and configure new agents.
 */

import { createSkill, getSkillByName } from '../skills/store'
import { getGrowthPlaybooksFolderId } from '../rag/initializeGrowthPlaybooks'

/**
 * Initialize meta-skills for agent creation
 */
export function initializeMetaSkills(): void {
  const growthPlaybooksFolderId = getGrowthPlaybooksFolderId()

  // BusinessGoalTranslator Skill
  if (!getSkillByName('business-goal-translator')) {
    createSkill(
      'business-goal-translator',
      'Translates business goals and requirements into detailed agent specifications. Extracts key objectives, constraints, success criteria, and operational requirements from natural language descriptions.',
      `# Business Goal Translator

## Purpose
Transform high-level business goals into actionable agent requirements and specifications.

## Process

1. **Extract Core Objectives**
   - Identify the primary business goal (e.g., "increase sales", "improve customer support")
   - Determine measurable success criteria
   - Identify key performance indicators (KPIs)

2. **Identify Constraints**
   - Technical constraints (platforms, integrations)
   - Business constraints (budget, timeline)
   - Operational constraints (team size, resources)

3. **Define Agent Scope**
   - Determine what the agent should do
   - Define what the agent should NOT do
   - Identify boundaries and limitations

4. **Translate to Agent Requirements**
   - Convert business language to technical specifications
   - Map objectives to agent capabilities
   - Define interaction patterns and workflows

## Example Transformations

- "Help us sell more products" → Agent that qualifies leads, provides product recommendations, handles objections
- "Improve customer satisfaction" → Agent that responds to support tickets, answers FAQs, escalates issues
- "Generate more leads" → Agent that engages prospects, qualifies leads, schedules demos

## Best Practices

- Always clarify ambiguous requirements
- Identify dependencies and prerequisites
- Consider scalability and maintenance
- Define clear success metrics`,
      {
        examples: [
          'Translate "increase revenue by 20%" into agent requirements',
          'Convert "better customer service" into agent capabilities',
          'Map business goal "expand to new markets" to agent features',
        ],
        tags: ['agent-creation', 'business-analysis', 'requirements', 'translation'],
        priority: 10,
        resourceFolderId: growthPlaybooksFolderId || undefined,
        metadata: {
          category: 'meta-skill',
          usedBy: ['g-sac', 'agent-creator'],
          purpose: 'agent-creation',
        },
      }
    )
  }

  // ToolIntegrator Skill
  if (!getSkillByName('tool-integrator')) {
    createSkill(
      'tool-integrator',
      'Determines which tools and capabilities are needed for an agent based on its requirements. Maps business requirements to available tools and identifies missing capabilities.',
      `# Tool Integrator

## Purpose
Select and configure the appropriate tools for an agent based on its requirements and objectives.

## Process

1. **Analyze Agent Requirements**
   - Review agent objectives and workflows
   - Identify actions the agent needs to perform
   - Determine data sources and integrations needed

2. **Map Requirements to Tools**
   - Match agent actions to available tools
   - Identify tool dependencies
   - Configure tool-specific parameters

3. **Identify Tool Gaps**
   - Determine if all requirements can be met with existing tools
   - Identify missing capabilities
   - Suggest workarounds or custom solutions

4. **Configure Tool Access**
   - Enable appropriate tools for the agent
   - Set tool-specific permissions and parameters
   - Configure tool chains and workflows

## Available Tools

- **markdownFormatter**: Format and clean markdown text
- **screenshotDescription**: Analyze and describe images
- **createAgent**: Create new agents programmatically
- **callMCP**: Interact with external platforms via MCP

## Tool Selection Guidelines

- Use markdownFormatter for any text formatting needs
- Use screenshotDescription for image analysis tasks
- Use createAgent for agent creation workflows
- Use callMCP for platform integrations (Slack, Discord, etc.)

## Best Practices

- Enable only necessary tools to reduce complexity
- Document tool usage in agent prompts
- Consider tool interaction patterns
- Plan for tool failures and fallbacks`,
      {
        examples: [
          'Select tools for a customer support agent',
          'Configure tools for a sales assistant agent',
          'Identify tools needed for a content creation agent',
        ],
        tags: ['agent-creation', 'tools', 'integration', 'configuration'],
        priority: 9,
        dependsOn: ['business-goal-translator'],
        resourceFolderId: growthPlaybooksFolderId || undefined,
        metadata: {
          category: 'meta-skill',
          usedBy: ['g-sac', 'agent-creator'],
          purpose: 'agent-creation',
        },
      }
    )
  }

  // PlatformIntegrator Skill
  if (!getSkillByName('platform-integrator')) {
    createSkill(
      'platform-integrator',
      'Automatically enables MCPClientTool and injects platform-specific instructions into agent prompts. Handles multi-platform deployment logic and platform-agnostic agent design.',
      `# Platform Integrator

## Purpose
Enable agents to work across multiple platforms (Slack, Discord, Twitter, etc.) using the Model Context Protocol (MCP) while maintaining platform-agnostic core logic.

## Process

1. **Identify Platform Requirements**
   - Determine which platforms the agent should work on
   - Identify platform-specific features needed
   - Understand platform constraints and limitations

2. **Enable MCP Client Tool**
   - Automatically add callMCP tool to agent configuration
   - Configure MCP server endpoints
   - Set up platform-specific authentication

3. **Inject Platform Instructions**
   - Add platform-agnostic instructions to agent prompt
   - Include MCP usage guidelines
   - Provide platform-specific examples and best practices

4. **Create Platform-Agnostic Core**
   - Design agent logic independent of platform
   - Use MCP for platform interactions
   - Ensure agent works across all configured platforms

## Platform-Agnostic Design Principles

1. **Separation of Concerns**
   - Core agent logic: Platform-independent
   - Platform interactions: Via MCP only

2. **Generic Instructions**
   - Agent prompt should not reference specific platforms
   - Use generic terms (e.g., "messaging platform" instead of "Slack")
   - Focus on functionality, not implementation

3. **MCP Integration**
   - All platform interactions go through callMCP tool
   - Agent prompt includes instructions on when/how to use MCP
   - MCP handles platform-specific details

## Example Platform Instructions

Add to agent prompt:
\`\`\`
You can interact with external platforms using the callMCP tool. This allows you to:
- Send messages to messaging platforms
- Create channels or threads
- Post to social media
- Integrate with various services

Use callMCP when you need to interact with external platforms. The tool abstracts platform-specific details, so you can work across multiple platforms seamlessly.
\`\`\`

## Best Practices

- Always enable callMCP when platform integration is needed
- Keep agent prompts platform-agnostic
- Use MCP for all external platform interactions
- Document platform capabilities in agent metadata
- Test agent across all configured platforms`,
      {
        examples: [
          'Configure agent for Slack and Discord integration',
          'Enable MCP for Twitter posting',
          'Create platform-agnostic messaging agent',
        ],
        tags: ['agent-creation', 'platform', 'mcp', 'integration', 'multi-platform'],
        priority: 8,
        dependsOn: ['tool-integrator'],
        resourceFolderId: growthPlaybooksFolderId || undefined,
        metadata: {
          category: 'meta-skill',
          usedBy: ['g-sac', 'agent-creator'],
          purpose: 'agent-creation',
        },
      }
    )
  }
}

// Initialize meta-skills on module load (server-side only)
if (typeof window === 'undefined') {
  // Ensure Growth Playbooks folder is initialized first
  try {
    require('../rag/initializeGrowthPlaybooks')
    initializeMetaSkills()
  } catch (error) {
    console.error('Error initializing meta-skills:', error)
  }
}

