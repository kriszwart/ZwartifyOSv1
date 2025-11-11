# Quick Start Guide - ZwartifyOS Agent Platform

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Claude API key (from Anthropic)

### Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Key**
   Create `.env.local` file in the root directory:
   ```env
   CLAUDE_API_KEY=sk-ant-your-api-key-here
   # OR
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to: `http://localhost:3000`

---

## 🎯 Example Agents (Ready to Test!)

ZwartifyOS comes with **7 pre-built example agents** with specialised skills:

### 📄 PDF Processor
- **Skill:** PDF Processing
- **Best For:** Office Workers, Accountants, Legal Professionals, Administrators
- **Use Cases:** Document digitization, invoice processing, form automation, report generation
- **Test:** Upload a PDF and ask "Summarize this document" or "Extract all text"
- **Location:** `/agents` → Click "View" on "pdf-processor"

### 📊 Data Analyst
- **Skill:** Data Analysis
- **Best For:** Data Analysts, Business Analysts, Researchers, Product Managers
- **Use Cases:** Sales reporting, customer behaviour analysis, performance metrics, A/B testing
- **Test:** "Analyse this dataset and find trends" or "What are the key insights?"
- **Location:** `/agents` → Click "View" on "data-analyst"

### 🔍 Code Reviewer
- **Skill:** Code Review
- **Best For:** Developers, Engineering Teams, Code Reviewers, Tech Leads
- **Use Cases:** Pre-merge code reviews, security audits, code quality improvements, onboarding
- **Test:** Paste code and ask "Review this code for security vulnerabilities"
- **Location:** `/agents` → Click "View" on "code-reviewer"

### ✍️ Content Writer
- **Skill:** Content Writing
- **Best For:** Content Writers, Marketing Teams, Bloggers, Social Media Managers
- **Use Cases:** Blog content creation, social media campaigns, email marketing, SEO optimization
- **Test:** "Write a blog post about AI agents" or "Create social media content for product launch"
- **Location:** `/agents` → Click "View" on "content-writer"

### 📧 Email Assistant
- **Skill:** Email Management
- **Best For:** Sales Teams, Customer Support, Executives, HR Teams
- **Use Cases:** Customer communication, sales outreach, internal communications, template creation
- **Test:** "Draft a professional follow-up email" or "Create an email template for customer support"
- **Location:** `/agents` → Click "View" on "email-assistant"

### 🔬 Research Assistant
- **Skill:** Research
- **Best For:** Researchers, Analysts, Product Managers, Consultants, Students
- **Use Cases:** Market research, competitive analysis, due diligence, trend analysis
- **Test:** "Research competitors in the AI agent space" or "Analyse market trends for SaaS products"
- **Location:** `/agents` → Click "View" on "research-assistant"

### 💬 Customer Support
- **Skills:** PDF Processing + Email Management
- **Best For:** Customer Support Teams, Help Desks, Service Teams
- **Use Cases:** Customer communication, document analysis, troubleshooting, email templates
- **Test:** Upload a customer document and ask "Help me understand this customer issue"
- **Location:** `/agents` → Click "View" on "customer-support"

### How to Test Example Agents

1. **View All Agents:**
   - Go to `/agents` - you'll see all 7 example agents listed
   - Each agent shows its assigned skills as badges

2. **Test Individual Agent:**
   - Click **"View"** on any agent card
   - You'll see the agent detail page with:
     - Agent info, prompt, and skills
     - Test interface to chat with the agent
     - PDF and image upload support

3. **Test via Main Interface:**
   - Go to `/agent` (main test interface)
   - Agents automatically detect relevant skills from your input
   - Type questions like "Extract text from PDF" or "Analyse data"

---

## 📖 Your First Agent (5 Minutes)

### Step 1: Create an Agent
1. Go to `/agents` or click "Agents" in the navigation
2. Click "+ Create Agent"
3. Fill in:
   - **Name**: `my-first-agent`
   - **Description**: `A helpful assistant`
   - **Prompt**: `You are a helpful AI assistant. Answer questions clearly and concisely.`
   - **Enabled**: ✓ (checked)
   - **Skills**: (Optional) Select skills from the dropdown
4. Click "Create Agent"

### Step 2: Test Your Agent
1. Go to `/agent` or click "Test" in navigation
2. Type: `Tell me a joke about programming`
3. Click Send
4. See your agent's response!

### Step 3: View Execution Logs
1. Go back to `/agents`
2. Click "View" on your agent
3. See detailed execution logs including:
   - Input/output
   - Execution time
   - Any tool calls
   - Error details (if any)

---

## 🧠 Using RAG (Knowledge Base)

### Step 1: Create a RAG Folder
1. Go to `/rag`
2. Click "+ Create Folder"
3. Name it: `my-knowledge-base`
4. Click "Create Folder"

### Step 2: Upload Documents
1. Select your folder
2. Click "+ Upload File"
3. Choose a file (.txt, .md, .pdf, .html, .json, etc.)
4. File is automatically processed and chunked

### Step 3: Use RAG with Agent
When creating/editing an agent, you can assign a RAG folder to automatically enhance its context.

---

## 🎯 Using Skills

### View Available Skills
1. Go to `/skills` to see all available skills
2. Each skill shows:
   - **Target Audience**: Who would benefit from this skill
   - **Use Cases**: Real-world applications
   - **Industries**: Where it's commonly used
3. Default skills include:
   - **PDF Processing** - Extract text, tables, fill forms (Finance, Legal, Accounting)
   - **Data Analysis** - Analyse datasets, create visualisations (E-commerce, Marketing, SaaS)
   - **Code Review** - Review code for bugs, security, best practices (Software Development, FinTech)
   - **Content Writing** - Create blogs, marketing copy, social media (Marketing, E-commerce, Media)
   - **Email Management** - Draft emails, create templates (Sales, Customer Service, HR)
   - **Research** - Conduct research, analyse information (Consulting, Research, Education)
   - **API Integration** - Design and integrate APIs (FinTech, E-commerce, SaaS)

### Assign Skills to Agents
1. When creating/editing an agent, scroll to "Skills" section
2. Select skills from the checklist
3. Agents automatically use assigned skills when relevant
4. Skills provide domain expertise and workflows to enhance agent capabilities

---

## 📊 Dashboard Overview

Visit `/dashboard` to see:
- **Total Executions**: How many times agents have run
- **Success Rate**: Percentage of successful executions
- **Agent Statistics**: Number of agents and their status
- **Recent Executions**: Latest agent runs

---

## 🚀 Next Steps

1. **Test Example Agents** - Try the 7 pre-built agents at `/agents`
2. **Explore Skills** - See available skills at `/skills` with use cases and target audiences
3. **Create Your Own** - Build custom agents with specific skills
4. **Upload Documents** - Use RAG for knowledge-based agents
5. **View Logs** - Monitor agent performance and execution history
6. **Schedule Agents** - Automate agent runs with cron schedules

---

## 🕐 Scheduling Agents

### Create a Schedule
1. Use the API to create a schedule:
   ```bash
   curl -X POST http://localhost:3000/api/schedules \
     -H "Content-Type: application/json" \
     -d '{
       "agentId": "your-agent-id",
       "cronExpression": "0 9 * * *",
       "enabled": true,
       "metadata": {
         "input": "Generate daily report"
       }
     }'
   ```

### Cron Expression Examples
- `0 9 * * *` - Every day at 9 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 1` - Every Monday at midnight
- `*/30 * * * *` - Every 30 minutes

---

## 💾 Conversation Memory

Agents automatically maintain conversation history when:
- `useMemory` option is enabled (default: true)
- Agent has an `agentId` set

The agent will remember previous messages in the conversation and use them for context.

---

## 🔧 API Usage Examples

### Create an Agent
```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "helper",
    "description": "General purpose helper",
    "prompt": "You are helpful",
    "enabled": true
  }'
```

### Run an Agent
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What is 2+2?",
    "agentId": "your-agent-id",
    "metadata": {
      "source": "api"
    }
  }'
```

### Get Agent Executions
```bash
curl http://localhost:3000/api/agents/{agent-id}/executions?limit=10
```

### Upload File to RAG Folder
```bash
curl -X POST http://localhost:3000/api/rag/folders/{folder-id}/files \
  -F "file=@/path/to/your/file.txt"
```

---

## 🎯 Common Use Cases

### 1. Customer Support Agent
- Create agent with customer service prompt
- Upload company FAQ documents to RAG folder
- Agent can answer questions using company knowledge

### 2. Content Generator
- Create agent with creative writing prompt
- Schedule daily content generation
- View generated content in execution logs

### 3. Data Analyst
- Create agent with data analysis prompt
- Upload datasets to RAG folder
- Agent can analyse and report on data

### 4. Code Assistant
- Create agent with programming expertise prompt
- Use memory for context-aware code help
- Agent remembers previous code discussions

---

## 🐛 Troubleshooting

### Agent Not Responding
1. Check API key in `.env.local`
2. Restart dev server after changing `.env.local`
3. Check execution logs for error details

### RAG Not Working
1. Ensure files are uploaded and processed
2. Check file format is supported
3. Verify folder is assigned to agent

### Schedules Not Running
1. Ensure scheduler is started (check console logs)
2. Verify cron expression is valid
3. Check schedule is enabled

---

## 📚 Next Steps

- Explore the **Dashboard** to see system statistics
- Create multiple agents for different tasks
- Set up RAG folders for domain-specific knowledge
- Schedule agents for automated tasks
- Review execution logs to optimise prompts

---

## 🔗 Useful Links

- **Dashboard**: `/dashboard`
- **Agents**: `/agents`
- **Agent Testing**: `/agent`
- **RAG Management**: `/rag`
- **Agent Logs**: `/agents/[id]/logs`

---

## 💡 Tips

1. **Start Simple**: Begin with basic prompts, then refine
2. **Use RAG**: Upload relevant documents for better context
3. **Monitor Logs**: Review execution logs to improve prompts
4. **Enable Memory**: Use conversation memory for better continuity
5. **Test Often**: Use the `/agent` page to test before deploying

---

Happy Building! 🎉

