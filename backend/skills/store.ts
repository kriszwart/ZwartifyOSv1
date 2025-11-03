/**
 * Skills System
 * 
 * Modular capabilities that extend agent functionality with domain-specific expertise.
 * Skills provide instructions, workflows, and best practices that agents use automatically.
 * 
 * Unlike tools (executable functions), Skills are instructional resources that guide
 * agent behaviour and decision-making.
 */

import { randomUUID } from 'crypto'

export interface Skill {
  id: string
  name: string
  description: string
  instructions: string // Main instructions/workflows
  examples?: string[] // Usage examples
  tags?: string[] // Categories/tags for discovery
  version?: string
  enabled: boolean
  priority?: number // Priority/weight for ordering (higher = more important, default: 0)
  dependsOn?: string[] // IDs of skills this skill depends on
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, unknown>
  resourceFolderId?: string // Optional RAG folder with additional resources
}

export interface SkillMetadata {
  name: string
  description: string
  tags?: string[]
  version?: string
}

// In-memory store (will be replaced with database)
const skills = new Map<string, Skill>()

/**
 * Create a new Skill
 */
export function createSkill(
  name: string,
  description: string,
  instructions: string,
  options?: {
    examples?: string[]
    tags?: string[]
    version?: string
    enabled?: boolean
    metadata?: Record<string, unknown>
    resourceFolderId?: string
    priority?: number
    dependsOn?: string[]
  }
): Skill {
  const now = new Date()
  const skill: Skill = {
    id: randomUUID(),
    name,
    description,
    instructions,
    examples: options?.examples || [],
    tags: options?.tags || [],
    version: options?.version || '1.0.0',
    enabled: options?.enabled !== false, // Default to true
    priority: options?.priority ?? 0,
    dependsOn: options?.dependsOn || [],
    createdAt: now,
    updatedAt: now,
    metadata: options?.metadata,
    resourceFolderId: options?.resourceFolderId,
  }

  skills.set(skill.id, skill)
  return skill
}

/**
 * Get skill by ID
 */
export function getSkill(id: string): Skill | undefined {
  return skills.get(id)
}

/**
 * Get skill by name
 */
export function getSkillByName(name: string): Skill | undefined {
  return Array.from(skills.values()).find(skill => skill.name === name)
}

/**
 * List all skills
 */
export function listSkills(enabledOnly = false): Skill[] {
  const allSkills = Array.from(skills.values())
  
  if (enabledOnly) {
    return allSkills.filter(skill => skill.enabled)
  }
  
  return allSkills.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

/**
 * Search skills by query (searches name, description, tags)
 */
export function searchSkills(query: string, enabledOnly = false): Skill[] {
  const allSkills = enabledOnly ? listSkills(true) : listSkills()
  const queryLower = query.toLowerCase()
  
  return allSkills.filter(skill => 
    skill.name.toLowerCase().includes(queryLower) ||
    skill.description.toLowerCase().includes(queryLower) ||
    skill.tags?.some(tag => tag.toLowerCase().includes(queryLower)) ||
    skill.instructions.toLowerCase().includes(queryLower)
  )
}

/**
 * Get skills by tags
 */
export function getSkillsByTags(tags: string[]): Skill[] {
  return Array.from(skills.values()).filter(skill =>
    skill.enabled && tags.some(tag => skill.tags?.includes(tag))
  )
}

/**
 * Update skill
 */
export function updateSkill(id: string, updates: Partial<Skill>): Skill | null {
  const skill = skills.get(id)
  if (!skill) return null

  const updated: Skill = {
    ...skill,
    ...updates,
    updatedAt: new Date(),
    // Preserve ID and createdAt
    id: skill.id,
    createdAt: skill.createdAt,
  }

  skills.set(id, updated)
  return updated
}

/**
 * Delete skill
 */
export function deleteSkill(id: string): boolean {
  return skills.delete(id)
}

/**
 * Enable/disable skill
 */
export function setSkillEnabled(id: string, enabled: boolean): boolean {
  const skill = skills.get(id)
  if (!skill) return false

  skill.enabled = enabled
  skill.updatedAt = new Date()
  skills.set(id, skill)
  return true
}

/**
 * Build skill context for agent prompt
 * Returns formatted instructions that can be injected into agent prompts
 * Now includes RAG context if resourceFolderId is specified
 * Includes dependencies automatically
 */
export async function buildSkillContext(skillIds: string[]): Promise<string> {
  // Resolve dependencies - include dependent skills automatically
  const resolvedSkillIds = new Set<string>(skillIds)
  
  for (const skillId of skillIds) {
    const skill = skills.get(skillId)
    if (skill?.dependsOn) {
      skill.dependsOn.forEach(depId => {
        const depSkill = skills.get(depId)
        if (depSkill?.enabled) {
          resolvedSkillIds.add(depId)
        }
      })
    }
  }
  
  const skillList = Array.from(resolvedSkillIds)
    .map(id => skills.get(id))
    .filter((skill): skill is Skill => skill !== undefined && skill.enabled)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)) // Sort by priority (higher first)
  
  if (skillList.length === 0) {
    return ''
  }

  // Build contexts for each skill (async to support RAG loading)
  const contexts = await Promise.all(skillList.map(async (skill) => {
    let context = `## ${skill.name}\n\n${skill.description}\n\n### Instructions\n\n${skill.instructions}`
    
    // Add dependency note if this skill was auto-included
    if (skill.dependsOn && skill.dependsOn.some(depId => skillIds.includes(depId))) {
      const depNames = skill.dependsOn
        .map(id => skills.get(id)?.name)
        .filter(Boolean)
        .join(', ')
      if (depNames) {
        context = `*This skill is used in conjunction with: ${depNames}*\n\n${context}`
      }
    }
    
    // Add RAG context if resource folder is specified
    if (skill.resourceFolderId) {
      try {
        const { getRAGContext } = await import('../rag/query')
        const ragContext = await getRAGContext(skill.resourceFolderId, skill.description, 3)
        if (ragContext) {
          context += `\n\n### Additional Resources\n\n${ragContext}`
        }
      } catch (error) {
        // If RAG loading fails, continue without it
        console.warn(`Failed to load RAG context for skill ${skill.name}:`, error)
      }
    }
    
    if (skill.examples && skill.examples.length > 0) {
      context += `\n\n### Examples\n\n${skill.examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}`
    }
    
    return context
  }))

  const formattedContexts = contexts.join('\n\n---\n\n')

  return `# Available Skills\n\n${formattedContexts}\n\nUse these Skills when relevant to the user's request.`
}

/**
 * Auto-detect relevant skills from user input
 * Improved version with better scoring and semantic matching
 */
export function detectRelevantSkills(input: string, limit = 3): Skill[] {
  const inputLower = input.toLowerCase()
  const enabledSkills = listSkills(true)
  
  // Extract keywords from input (simple word extraction)
  const inputWords = inputLower
    .split(/\s+/)
    .filter(word => word.length > 2) // Filter out short words
    .filter(word => !['the', 'and', 'or', 'but', 'for', 'with', 'from'].includes(word))
  
  // Score skills based on relevance
  const scoredSkills = enabledSkills.map(skill => {
    let score = 0
    
    // Check name match (exact match gets highest score)
    const skillNameLower = skill.name.toLowerCase()
    if (inputLower.includes(skillNameLower) || skillNameLower.includes(inputLower)) {
      score += 15 // Increased from 10
    } else {
      // Partial name match
      const nameWords = skillNameLower.split(/[-_\s]+/)
      nameWords.forEach(word => {
        if (inputWords.includes(word)) {
          score += 8
        }
      })
    }
    
    // Check description match (weighted)
    const descLower = skill.description.toLowerCase()
    inputWords.forEach(word => {
      if (descLower.includes(word)) {
        score += 6 // Increased from 5
      }
    })
    
    // Check tag match (weighted)
    skill.tags?.forEach(tag => {
      const tagLower = tag.toLowerCase()
      if (inputWords.includes(tagLower)) {
        score += 5 // Increased from 3
      }
      // Partial tag match
      if (inputLower.includes(tagLower) || tagLower.includes(inputLower)) {
        score += 3
      }
    })
    
    // Check examples match (lower weight)
    skill.examples?.forEach(example => {
      const exampleLower = example.toLowerCase()
      inputWords.forEach(word => {
        if (exampleLower.includes(word)) {
          score += 2
        }
      })
    })
    
    // Check instructions match (lowest weight, but check for key terms)
    const instructionsLower = skill.instructions.toLowerCase()
    inputWords.forEach(word => {
      if (instructionsLower.includes(word)) {
        score += 1 // Decreased from 2 (instructions are long)
      }
    })
    
    // Boost score if skill has resource folder (might be more comprehensive)
    if (skill.resourceFolderId) {
      score += 2
    }
    
    return { skill, score }
  })
  
  // Sort by score and return top matches
  return scoredSkills
    .filter(item => item.score > 0)
    .sort((a, b) => {
      // First sort by score
      if (b.score !== a.score) {
        return b.score - a.score
      }
      // Then by name (alphabetical) for consistency
      return a.skill.name.localeCompare(b.skill.name)
    })
    .slice(0, limit)
    .map(item => item.skill)
}

/**
 * Initialize default skills
 */
export function initializeDefaultSkills(): void {
  // PDF Processing Skill
  if (!getSkillByName('pdf-processing')) {
    createSkill(
      'pdf-processing',
      'Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.',
      `# PDF Processing

## Quick Start

When working with PDF files:

1. **Extract Text**: Use pdfplumber or PyPDF2 to extract text content
2. **Extract Tables**: Use pdfplumber for structured table extraction
3. **Form Filling**: Use PyPDF2 or reportlab for form manipulation
4. **Merge Documents**: Combine multiple PDFs using PyPDF2

## Best Practices

- Always validate PDF structure before processing
- Handle encryption and password-protected PDFs appropriately
- Preserve formatting when extracting structured data
- Use appropriate libraries based on PDF complexity`,
      {
        examples: [
          'Extract all text from this PDF file',
          'Find tables in this PDF and convert to CSV',
          'Fill out this PDF form with the provided data',
          'Merge these three PDF documents into one'
        ],
        tags: ['pdf', 'document', 'extraction', 'forms'],
        metadata: {
          targetAudience: ['Office Workers', 'Accountants', 'Legal Professionals', 'Data Analysts', 'Administrators'],
          useCases: [
            'Document digitization',
            'Invoice processing',
            'Form automation',
            'Report generation',
            'Document consolidation',
            'Data extraction from forms'
          ],
          industries: ['Finance', 'Legal', 'Accounting', 'Healthcare', 'Government', 'Insurance']
        }
      }
    )
  }

  // Data Analysis Skill
  if (!getSkillByName('data-analysis')) {
    createSkill(
      'data-analysis',
      'Analyse datasets, generate insights, create visualisations, and perform statistical analysis. Use when working with data, spreadsheets, or statistical questions.',
      `# Data Analysis

## Quick Start

When analysing data:

1. **Load Data**: Read CSV, JSON, Excel, or database sources
2. **Clean Data**: Handle missing values, outliers, duplicates
3. **Analyse**: Apply statistical methods, aggregations, groupings
4. **Visualise**: Create charts, graphs, and reports
5. **Interpret**: Provide insights and recommendations

## Common Tasks

- Descriptive statistics (mean, median, mode, variance)
- Correlation analysis
- Time series analysis
- Clustering and classification
- Data visualisation with matplotlib/seaborn`,
      {
        examples: [
          'Analyse this CSV file and find trends',
          'Create a visualisation of sales data',
          'What are the key insights from this dataset?',
          'Perform statistical analysis on this data'
        ],
        tags: ['data', 'analysis', 'statistics', 'visualisation'],
        metadata: {
          targetAudience: ['Data Analysts', 'Business Analysts', 'Researchers', 'Data Scientists', 'Product Managers'],
          useCases: [
            'Sales reporting',
            'Customer behaviour analysis',
            'Performance metrics',
            'A/B testing analysis',
            'Predictive analytics',
            'Business intelligence'
          ],
          industries: ['E-commerce', 'Finance', 'Marketing', 'Healthcare', 'Retail', 'SaaS']
        }
      }
    )
  }

  // Code Review Skill
  if (!getSkillByName('code-review')) {
    createSkill(
      'code-review',
      'Review code for bugs, security issues, performance problems, and best practices. Use when reviewing code, debugging, or improving code quality.',
      `# Code Review

## Review Checklist

When reviewing code, check for:

1. **Correctness**: Does it work as intended?
2. **Security**: Any vulnerabilities (SQL injection, XSS, etc.)?
3. **Performance**: Any bottlenecks or inefficiencies?
4. **Maintainability**: Is it readable and well-structured?
5. **Best Practices**: Follows language/framework conventions?
6. **Testing**: Are there appropriate tests?

## Common Issues

- Missing error handling
- Security vulnerabilities
- Performance anti-patterns
- Code duplication
- Missing documentation
- Inconsistent style`,
      {
        examples: [
          'Review this code for bugs and improvements',
          'Check this code for security vulnerabilities',
          'Suggest performance improvements',
          'Does this code follow best practices?'
        ],
        tags: ['code', 'review', 'security', 'quality'],
        metadata: {
          targetAudience: ['Developers', 'Engineering Teams', 'Code Reviewers', 'Tech Leads'],
          useCases: [
            'Pre-merge code reviews',
            'Security audits',
            'Code quality improvements',
            'Onboarding new developers',
            'Technical debt reduction'
          ],
          industries: ['Software Development', 'FinTech', 'SaaS', 'E-commerce']
        }
      }
    )
  }

  // Content Writing Skill
  if (!getSkillByName('content-writing')) {
    createSkill(
      'content-writing',
      'Create engaging, well-structured content for blogs, marketing, social media, and documentation. Use when writing articles, posts, or any written content.',
      `# Content Writing

## Writing Best Practices

1. **Structure**: Clear introduction, body, conclusion
2. **Tone**: Match audience and purpose
3. **SEO**: Natural keyword integration
4. **Readability**: Short sentences, clear paragraphs
5. **Engagement**: Hook readers, tell stories
6. **Call-to-Action**: Guide readers to next steps

## Content Types

- Blog posts and articles
- Social media posts
- Marketing copy
- Technical documentation
- Email campaigns
- Product descriptions`,
      {
        examples: [
          'Write a blog post about AI agents',
          'Create social media content for product launch',
          'Draft an email newsletter',
          'Write product documentation'
        ],
        tags: ['content', 'writing', 'marketing', 'seo'],
        metadata: {
          targetAudience: ['Content Writers', 'Marketing Teams', 'Bloggers', 'Product Managers', 'Social Media Managers'],
          useCases: [
            'Blog content creation',
            'Social media campaigns',
            'Email marketing',
            'Product documentation',
            'SEO content optimization',
            'Brand storytelling'
          ],
          industries: ['Marketing', 'E-commerce', 'Media', 'SaaS', 'Education']
        }
      }
    )
  }

  // Email Management Skill
  if (!getSkillByName('email-management')) {
    createSkill(
      'email-management',
      'Draft professional emails, manage email templates, and improve email communication. Use when composing emails, creating templates, or managing communications.',
      `# Email Management

## Email Best Practices

1. **Subject Lines**: Clear, specific, action-oriented
2. **Structure**: Greeting, clear message, call-to-action
3. **Tone**: Professional, friendly, appropriate for context
4. **Length**: Concise but complete
5. **Formatting**: Use bullets, paragraphs, white space
6. **Follow-up**: Include next steps or deadlines

## Email Types

- Business communications
- Customer support
- Sales and outreach
- Internal team updates
- Meeting requests
- Follow-ups`,
      {
        examples: [
          'Draft a professional follow-up email',
          'Create an email template for customer support',
          'Write a meeting request email',
          'Compose a sales outreach email'
        ],
        tags: ['email', 'communication', 'business', 'professional'],
        metadata: {
          targetAudience: ['Sales Teams', 'Customer Support', 'Executives', 'HR Teams', 'Project Managers'],
          useCases: [
            'Customer communication',
            'Sales outreach',
            'Internal communications',
            'Meeting coordination',
            'Client follow-ups',
            'Template creation'
          ],
          industries: ['Sales', 'Customer Service', 'Consulting', 'HR', 'Real Estate']
        }
      }
    )
  }

  // Research Skill
  if (!getSkillByName('research')) {
    createSkill(
      'research',
      'Conduct thorough research, analyse information, and synthesise findings. Use when researching topics, gathering information, or analysing data.',
      `# Research

## Research Methodology

1. **Define Scope**: Clearly understand what you're researching
2. **Gather Sources**: Use credible, diverse sources
3. **Analyse**: Critical evaluation of information
4. **Synthesise**: Combine findings into coherent insights
5. **Document**: Cite sources, track findings
6. **Present**: Clear, structured presentation of results

## Research Types

- Market research
- Competitive analysis
- Technical research
- Academic research
- Trend analysis
- Fact-checking`,
      {
        examples: [
          'Research competitors in the AI agent space',
          'Analyse market trends for SaaS products',
          'Find best practices for customer onboarding',
          'Research technical solutions for a problem'
        ],
        tags: ['research', 'analysis', 'information', 'knowledge'],
        metadata: {
          targetAudience: ['Researchers', 'Analysts', 'Product Managers', 'Consultants', 'Students', 'Journalists'],
          useCases: [
            'Market research',
            'Competitive analysis',
            'Due diligence',
            'Academic research',
            'Trend analysis',
            'Decision support'
          ],
          industries: ['Consulting', 'Research', 'Finance', 'Media', 'Education', 'Healthcare']
        }
      }
    )
  }

  // API Integration Skill
  if (!getSkillByName('api-integration')) {
    createSkill(
      'api-integration',
      'Design, integrate, and troubleshoot APIs. Use when working with REST APIs, webhooks, or building integrations.',
      `# API Integration

## API Best Practices

1. **Authentication**: Use appropriate auth methods (API keys, OAuth, etc.)
2. **Error Handling**: Handle errors gracefully
3. **Rate Limiting**: Respect API limits
4. **Documentation**: Clear API documentation
5. **Testing**: Test endpoints thoroughly
6. **Versioning**: Maintain API versioning

## Common Tasks

- REST API integration
- Webhook setup
- Authentication flows
- Error handling
- Data transformation
- API testing`,
      {
        examples: [
          'Integrate with Stripe payment API',
          'Set up webhooks for notifications',
          'Create API documentation',
          'Troubleshoot API authentication issues'
        ],
        tags: ['api', 'integration', 'development', 'technical'],
        metadata: {
          targetAudience: ['Developers', 'Backend Engineers', 'Integration Specialists', 'Technical Architects'],
          useCases: [
            'Payment integrations',
            'Third-party service connections',
            'Webhook implementations',
            'API documentation',
            'Integration troubleshooting',
            'Microservices communication'
          ],
          industries: ['FinTech', 'E-commerce', 'SaaS', 'IoT', 'Software Development']
        }
      }
    )
  }
}

// Initialize default skills on module load
initializeDefaultSkills()

// Initialize meta-skills after default skills
if (typeof window === 'undefined') {
  try {
    require('./meta-skills')
  } catch (error) {
    console.error('Error initializing meta-skills:', error)
  }
}

