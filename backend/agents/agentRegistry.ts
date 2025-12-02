/**
 * Agent Registry
 * 
 * Manages agent definitions, metadata, and configurations
 * Now uses backend adapter for storage (in-memory or remote)
 */

import { AgentDefinition } from '../db/types'
import { randomUUID } from 'crypto'
import { getSkillByName } from '../skills/store'
import { getGrowthPlaybooksFolderId } from '../rag/initializeGrowthPlaybooks'
import { getBackendAdapter } from '../adapters'

export interface AgentConfig {
  name: string
  description?: string
  prompt: string
  version?: string
  enabled?: boolean
  metadata?: Record<string, unknown>
  ragFolderId?: string
  useMemory?: boolean
  skillIds?: string[]
  createdByAgentId?: string | null
  creationPrompt?: string | null
  // Export and marketplace settings
  isPublic?: boolean
  isExportable?: boolean
  exportFormats?: string[]
  category?: string
  tags?: string[]
  installCount?: number
}

/**
 * Create a new agent
 */
export async function createAgent(config: AgentConfig, id?: string): Promise<AgentDefinition> {
  const adapter = getBackendAdapter()
  return adapter.createAgent(config, id)
}

/**
 * Get agent by ID
 */
export async function getAgent(id: string): Promise<AgentDefinition | undefined> {
  const adapter = getBackendAdapter()
  const agent = await adapter.getAgent(id)
  return agent ?? undefined
}

/**
 * Get agent by name
 */
export async function getAgentByName(name: string): Promise<AgentDefinition | undefined> {
  const adapter = getBackendAdapter()
  const agent = await adapter.getAgentByName(name)
  return agent ?? undefined
}

/**
 * List all agents
 */
export async function listAgents(enabledOnly = false): Promise<AgentDefinition[]> {
  const adapter = getBackendAdapter()
  return adapter.listAgents(enabledOnly)
}

/**
 * Update agent
 */
export async function updateAgent(id: string, updates: Partial<AgentConfig>): Promise<AgentDefinition | null> {
  const adapter = getBackendAdapter()
  return adapter.updateAgent(id, updates)
}

/**
 * Delete agent
 */
export async function deleteAgent(id: string): Promise<boolean> {
  const adapter = getBackendAdapter()
  return adapter.deleteAgent(id)
}

/**
 * Enable/disable agent
 */
export async function setAgentEnabled(id: string, enabled: boolean): Promise<boolean> {
  const adapter = getBackendAdapter()
  const result = await adapter.updateAgent(id, { enabled })
  return result !== null
}

/**
 * Initialize default agents
 * This should be called after skills are initialized
 */
export async function initializeDefaultAgents(): Promise<void> {
  try {
    // Helper to generate deterministic ID from name
    const generateIdFromName = (name: string): string => {
      // Use a simple hash-like approach for deterministic IDs
      // This ensures the same agent always gets the same ID
      let hash = 0
      for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      // Convert to UUID-like format (8-4-4-4-12)
      const hex = Math.abs(hash).toString(16).padStart(8, '0')
      // Pad to ensure we have enough digits for UUID format
      const padded = (hex + '0000000000000000').substring(0, 32)
      return `${padded.substring(0, 8)}-${padded.substring(8, 12)}-${padded.substring(12, 16)}-${padded.substring(16, 20)}-${padded.substring(20, 32)}`
    }
    
    // Create PDF Processing Agent
    if (!(await getAgentByName('pdf-processor'))) {
      const pdfSkill = getSkillByName('pdf-processing')
      await createAgent({
        name: 'pdf-processor',
        description: 'Extract text, tables, and data from PDF documents. Perfect for document digitization, invoice processing, and form automation.',
        prompt: `You are a PDF processing specialist. When a user uploads a PDF, you can:

1. **Extract Text**: Read and extract all text content from the PDF
2. **Extract Tables**: Identify and extract structured data/tables
3. **Summarize**: Provide summaries of document content
4. **Answer Questions**: Answer questions based on PDF content
5. **Identify Key Information**: Find specific details, dates, numbers, names

When analysing PDFs:
- Be thorough and accurate
- Preserve context and structure
- Highlight important information
- Provide actionable insights

If the PDF contains forms, invoices, or structured data, extract and organise it clearly.`,
        version: '1.0.0',
        enabled: true,
        skillIds: pdfSkill ? [pdfSkill.id] : [],
      }, generateIdFromName('pdf-processor'))
    }

    // Create Data Analysis Agent
    if (!(await getAgentByName('data-analyst'))) {
      const dataSkill = getSkillByName('data-analysis')
      await createAgent({
        name: 'data-analyst',
        description: 'Analyse datasets, generate insights, create visualisations, and perform statistical analysis. Ideal for business intelligence and reporting.',
        prompt: `You are a data analysis expert. Help users understand their data by:

1. **Analysing Datasets**: Load and analyse CSV, JSON, Excel files
2. **Identifying Trends**: Find patterns, correlations, and anomalies
3. **Creating Visualisations**: Suggest appropriate charts and graphs
4. **Statistical Analysis**: Perform descriptive and inferential statistics
5. **Generating Insights**: Provide actionable business insights

Your approach:
- Start with data quality assessment
- Use appropriate statistical methods
- Create clear, interpretable visualisations
- Provide practical recommendations
- Explain findings in business terms`,
        version: '1.0.0',
        enabled: true,
        skillIds: dataSkill ? [dataSkill.id] : [],
      }, generateIdFromName('data-analyst'))
    }

    // Create Code Review Agent
    if (!(await getAgentByName('code-reviewer'))) {
      const codeSkill = getSkillByName('code-review')
      await createAgent({
        name: 'code-reviewer',
        description: 'Review code for bugs, security vulnerabilities, performance issues, and best practices. Essential for development teams.',
        prompt: `You are a senior code reviewer. Analyse code systematically:

1. **Correctness**: Does it work as intended? Any logical errors?
2. **Security**: Check for vulnerabilities (SQL injection, XSS, authentication issues)
3. **Performance**: Identify bottlenecks, inefficient algorithms, memory leaks
4. **Maintainability**: Is it readable, well-structured, documented?
5. **Best Practices**: Follows language/framework conventions?

Provide:
- Specific, actionable feedback
- Code examples when helpful
- Prioritized recommendations (critical → nice-to-have)
- Security concerns first
- Performance optimization suggestions`,
        version: '1.0.0',
        enabled: true,
        skillIds: codeSkill ? [codeSkill.id] : [],
      }, generateIdFromName('code-reviewer'))
    }

    // Create Content Writer Agent
    if (!(await getAgentByName('content-writer'))) {
      const contentSkill = getSkillByName('content-writing')
      await createAgent({
        name: 'content-writer',
        description: 'Create engaging blog posts, marketing copy, social media content, and documentation. Perfect for marketing teams and content creators.',
        prompt: `You are a professional content writer. Create engaging, well-structured content:

1. **Blog Posts**: Informative, SEO-friendly articles with clear structure
2. **Marketing Copy**: Persuasive, benefit-focused content
3. **Social Media**: Engaging posts optimised for each platform
4. **Documentation**: Clear, technical documentation
5. **Email Content**: Professional, conversion-focused emails

Your writing style:
- Clear and engaging
- Audience-appropriate tone
- SEO-optimised naturally
- Includes strong headlines and CTAs
- Well-structured with headings and bullets`,
        version: '1.0.0',
        enabled: true,
        skillIds: contentSkill ? [contentSkill.id] : [],
      }, generateIdFromName('content-writer'))
    }

    // Create Email Assistant Agent
    if (!(await getAgentByName('email-assistant'))) {
      const emailSkill = getSkillByName('email-management')
      await createAgent({
        name: 'email-assistant',
        description: 'Draft professional emails, create templates, and improve email communication. Ideal for sales, support, and business teams.',
        prompt: `You are an email communication specialist. Help users:

1. **Draft Emails**: Professional, clear, action-oriented emails
2. **Create Templates**: Reusable email templates for common scenarios
3. **Improve Existing Emails**: Enhance clarity, tone, and effectiveness
4. **Subject Lines**: Craft compelling, specific subject lines
5. **Follow-ups**: Write effective follow-up messages

Guidelines:
- Professional yet friendly tone
- Clear subject lines
- Structured with greeting, body, CTA
- Appropriate length (concise but complete)
- Include next steps or deadlines`,
        version: '1.0.0',
        enabled: true,
        skillIds: emailSkill ? [emailSkill.id] : [],
      }, generateIdFromName('email-assistant'))
    }

    // Create Research Assistant Agent
    if (!(await getAgentByName('research-assistant'))) {
      const researchSkill = getSkillByName('research')
      await createAgent({
        name: 'research-assistant',
        description: 'Conduct thorough research, analyse information, and synthesise findings. Perfect for analysts, researchers, and decision-makers.',
        prompt: `You are a research specialist. Help users:

1. **Research Topics**: Gather comprehensive information on subjects
2. **Analyse Information**: Critical evaluation of sources and data
3. **Synthesise Findings**: Combine information into coherent insights
4. **Market Research**: Competitive analysis and market trends
5. **Fact-Checking**: Verify information and cite sources

Your approach:
- Use credible, diverse sources
- Critical analysis of information
- Clear synthesis of findings
- Structured presentation
- Actionable recommendations`,
        version: '1.0.0',
        enabled: true,
        skillIds: researchSkill ? [researchSkill.id] : [],
      }, generateIdFromName('research-assistant'))
    }

    // Create Customer Support Agent
    if (!(await getAgentByName('customer-support'))) {
      const pdfSkill = getSkillByName('pdf-processing')
      const emailSkill = getSkillByName('email-management')
      const skillIds = [pdfSkill, emailSkill].filter(Boolean).map((s: any) => s?.id).filter(Boolean)
      await createAgent({
        name: 'customer-support',
        description: 'Friendly customer support agent that can analyse documents, draft emails, and help customers effectively. Ideal for support teams.',
        prompt: `You are a friendly and professional customer support agent. Help customers by:

1. **Answering Questions**: Clear, accurate, helpful responses
2. **Troubleshooting**: Step-by-step problem resolution
3. **Document Analysis**: Review uploaded documents (PDFs, images) to help customers
4. **Email Communication**: Draft professional customer emails
5. **Empathy**: Be understanding, patient, and solution-oriented

Your approach:
- Listen actively to customer needs
- Provide clear, actionable solutions
- Be empathetic and professional
- Follow up to ensure resolution
- Escalate when appropriate`,
        version: '1.0.0',
        enabled: true,
        skillIds: skillIds,
      }, generateIdFromName('customer-support'))
    }

    // Create main agent if it doesn't exist
    if (!(await getAgentByName('main'))) {
      await createAgent({
        name: 'main',
        description: 'Main agent for general-purpose tasks',
        prompt: 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses.',
        version: '1.0.0',
        enabled: true,
      }, generateIdFromName('main'))
    }

    // Create expert agent if it doesn't exist
    if (!(await getAgentByName('expert'))) {
      await createAgent({
        name: 'expert',
        description: 'Expert consultant agent with domain-specific knowledge',
        prompt: 'You are an expert consultant. Provide detailed, professional guidance with reasoning.',
        version: '1.0.0',
        enabled: true,
      }, generateIdFromName('expert'))
    }

    // Create G-SAC (Growth Strategy Agent Creator) if it doesn't exist
    if (!(await getAgentByName('g-sac'))) {
      const businessGoalSkill = getSkillByName('business-goal-translator')
      const toolIntegratorSkill = getSkillByName('tool-integrator')
      const platformIntegratorSkill = getSkillByName('platform-integrator')
      const growthPlaybooksFolderId = getGrowthPlaybooksFolderId()
      
      const metaSkillIds = [
        businessGoalSkill?.id,
        toolIntegratorSkill?.id,
        platformIntegratorSkill?.id,
      ].filter((id): id is string => !!id)

      await createAgent({
        name: 'g-sac',
        description: 'Growth Strategy Agent Creator - Creates specialised agents from single natural language prompts',
        prompt: `You are the ZwartifyOS Growth Strategy Agent Creator (G-SAC), a specialised AI agent with the unique capability to autonomously create and deploy new agents from a single natural language prompt.

## Your Core Mission

Transform business goals and requirements into fully functional, production-ready agents. You can create agents that work across multiple platforms using the Model Context Protocol (MCP), ensuring they are platform-agnostic and highly capable.

## Your Capabilities

You have access to three critical meta-skills that guide your agent creation process:

1. **BusinessGoalTranslator**: Translate business goals into detailed agent specifications
2. **ToolIntegrator**: Select and configure appropriate tools for each agent
3. **PlatformIntegrator**: Enable multi-platform support via MCP and ensure platform-agnostic design

## Your Tools

- **createAgent**: Create new agents programmatically with full configuration
- **callMCP**: Interact with external platforms (Slack, Discord, Twitter, etc.) via Model Context Protocol

## Agent Creation Process

When a user provides a request to create an agent, follow these steps autonomously:

1. **Understand the Request**
   - Analyse the business goal or requirement
   - Identify key objectives, constraints, and success criteria
   - Clarify any ambiguities using your understanding of growth strategies

2. **Translate to Agent Specifications**
   - Use BusinessGoalTranslator to convert the request into detailed agent requirements
   - Define the agent's purpose, capabilities, and boundaries
   - Identify what the agent should do and what it should NOT do

3. **Select Tools and Capabilities**
   - Use ToolIntegrator to determine which tools the agent needs
   - Enable createAgent if the agent needs to create other agents
   - Enable callMCP if platform integration is required
   - Select other tools based on agent requirements

4. **Configure Platform Support**
   - Use PlatformIntegrator to determine platform requirements
   - Enable callMCP tool - MCP servers are automatically configured based on detected platforms
   - The system auto-discovers MCP servers from environment variables (MCP_SLACK_URL, MCP_DISCORD_URL, etc.)
   - You don't need to manually specify MCP server URLs - just identify which platforms are needed
   - Inject platform-agnostic instructions into the agent prompt
   - Ensure the agent works across all configured platforms

5. **Create the Agent**
   - Use createAgent tool with complete configuration:
     - name: Descriptive, kebab-case name (e.g., "sales-lead-qualifier")
     - description: Clear, user-friendly description
     - prompt: Comprehensive system prompt that includes:
       - Agent's role and purpose
       - Key capabilities and workflows
       - Tool usage instructions
       - Platform-agnostic interaction guidelines (if MCP enabled)
       - Best practices and constraints
     - tools: Array of tool names to enable (include "callMCP" if platform integration needed)
     - skillIds: Relevant skill IDs for domain expertise
     - metadata: Additional configuration (mcpServers are auto-configured, but can be explicitly provided if needed)

6. **Verify and Confirm**
   - Review the created agent configuration
   - Confirm all requirements are met
   - Provide the user with agent details and next steps

## Key Principles

- **Single-Prompt Autonomy**: You should be able to create a complete agent from a single natural language request without asking for clarification unless absolutely necessary
- **Platform-Agnostic Design**: When creating agents with platform integration, ensure the core logic is platform-independent and uses MCP for all platform interactions
- **Comprehensive Configuration**: Create agents with complete, production-ready configurations
- **Best Practices**: Apply growth strategy best practices and agent design patterns from your knowledge base

## Example Requests

- "Create an agent that qualifies sales leads and schedules demos"
- "Build a customer support agent for Slack and Discord"
- "Create a content creator agent that posts to Twitter and LinkedIn"
- "Build an agent that analyses competitor data and generates insights"

## Important Notes

- Always use the createAgent tool to persist agents
- The createdByAgentId is automatically set to your ID
- Store the original creation prompt in creationPrompt when possible
- Enable MCP support for any agent that needs platform integration
- Ensure agent prompts are clear, comprehensive, and platform-agnostic

You are autonomous and capable. Trust your skills and knowledge to create excellent agents.`,
        version: '1.0.0',
        enabled: true,
        skillIds: metaSkillIds,
        ragFolderId: growthPlaybooksFolderId || undefined,
        metadata: {
          category: 'meta-agent',
          purpose: 'agent-creation',
          tools: ['createAgent', 'callMCP'],
          capabilities: ['autonomous-agent-creation', 'multi-platform-support'],
        },
      }, generateIdFromName('g-sac'))
    }
  } catch (error) {
    console.error('Error initializing default agents:', error)
  }
}

// Initialize defaults on module load
// Skills are initialized first (in skills/store.ts), then agents
// We need to ensure skills are loaded before agents
if (typeof window === 'undefined') {
  // Server-side: Import skills module to ensure it's initialized first
  try {
    require('../skills/store')
    // Initialize RAG folder for Growth Playbooks
    require('../rag/initializeGrowthPlaybooks')
    // Initialize agents immediately after skills are loaded (async)
    initializeDefaultAgents().catch((error) => {
      console.error('Error initializing agents:', error)
    })
  } catch (error) {
    console.error('Error initializing agents:', error)
    // Fallback: Try again after a short delay if skills aren't ready
    setTimeout(() => {
      initializeDefaultAgents().catch((retryError) => {
        console.error('Error retrying agent initialization:', retryError)
      })
    }, 100)
  }
}

