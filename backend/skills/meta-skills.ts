/**
 * Meta-Skills Module
 * 
 * Initializes meta-skills used by G-SAC and other meta-agents
 */

import { createSkill, getSkillByName } from './store'

/**
 * Initialize meta-skills
 */
export function initializeMetaSkills(): void {
  // Business Goal Translator - translates business goals into agent specifications
  if (!getSkillByName('business-goal-translator')) {
    createSkill(
      'business-goal-translator',
      'Translates business goals and requirements into detailed agent specifications',
      `You translate business goals into agent specifications. When given a business goal:
1. Identify the core objective
2. Define success criteria
3. Specify required capabilities
4. Identify constraints and boundaries
5. Create a detailed agent specification`,
      {
        tags: ['meta'],
        priority: 10,
      }
    )
  }

  // Tool Integrator - selects and configures tools for agents
  if (!getSkillByName('tool-integrator')) {
    createSkill(
      'tool-integrator',
      'Selects and configures appropriate tools for agents based on requirements',
      `You select and configure tools for agents. When given agent requirements:
1. Identify what actions the agent needs to perform
2. Map actions to available tools
3. Configure tool parameters
4. Ensure tool compatibility
5. Document tool usage`,
      {
        tags: ['meta'],
        priority: 10,
      }
    )
  }

  // Platform Integrator - enables multi-platform support via MCP
  if (!getSkillByName('platform-integrator')) {
    createSkill(
      'platform-integrator',
      'Enables multi-platform support via Model Context Protocol (MCP)',
      `You enable platform integration for agents. When configuring platform support:
1. Identify required platforms (Slack, Discord, Twitter, etc.)
2. Configure MCP servers for each platform
3. Ensure platform-agnostic agent design
4. Test platform connectivity
5. Document platform-specific behaviors`,
      {
        tags: ['meta'],
        priority: 10,
      }
    )
  }
}

// Initialize on module load
if (typeof window === 'undefined') {
  initializeMetaSkills()
}

