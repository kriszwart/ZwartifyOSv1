# ZwartifyOS: Creative Agent System Design Specification (v2)

**Project Goal:** Transform ZwartifyOS into ZwartifyOS, a "Creative Agent System" capable of designing, configuring, and deploying new, platform-agnostic agents from a **single natural language prompt**, with a specialization in business growth and lead generation.

**Target Audience:** Cursor Development Team

---

## 1. Architectural Modifications & Innovations

The core ZwartifyOS architecture remains the foundation. The key innovations are a universal tool for platform integration and an enhanced data model.

### 1.1. New Data Model: Agent Lineage

The existing Agent Configuration schema must be extended to track the creator.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Unique ID of the agent (Existing) |
| `name` | `String` | Agent name (Existing) |
| `prompt` | `String` | System prompt (Existing) |
| `tools` | `Array<ToolID>` | List of enabled tools (Existing) |
| `skills` | `Array<SkillID>` | List of enabled skills (Existing) |
| `ragFolder` | `FolderID` | Associated RAG folder (Existing) |
| **`createdByAgentId`** | `UUID \| null` | **NEW:** ID of the agent that created this agent. `null` if created by a human user. |
| **`creationPrompt`** | `String \| null` | **NEW:** The natural language prompt given to the Creative Agent that resulted in this agent's creation. |

### 1.2. New Internal Tool: `AgentCreationTool`

This tool is exclusively for the **Creative Agent** to call.

| Property | Value |
| :--- | :--- |
| **Name** | `AgentCreationTool` |
| **Description** | "A tool to persist a new agent configuration to the database, making it immediately available for use." |
| **Function Signature** | `createAgent(config: AgentConfig)` |

### 1.3. INNOVATION: Universal `MCPClientTool`

To achieve the "any platform" goal, a universal tool for external communication must be a first-class citizen.

| Property | Value |
| :--- | :--- |
| **Name** | `MCPClientTool` |
| **Description** | "A universal tool that allows any agent to interact with external services (e.g., Slack, Trello, Google Sheets) via the Model Context Protocol (MCP)." |
| **Function Signature** | `callMCP(service: string, method: string, params: object)` |
| **Action** | Makes a standardized call to an external MCP server, abstracting the specific platform's API. |

---

## 2. Feature Specifications: The "Growth Strategy Agent Creator" (G-SAC)

The Creative Agent is now the **Growth Strategy Agent Creator (G-SAC)**, a highly autonomous agent.

### 2.1. Agent Profile

| Field | Value |
| :--- | :--- |
| **Name** | ZwartifyOS Growth Strategy Agent Creator (G-SAC) |
| **System Prompt** | "You are the ZwartifyOS Growth Strategy Agent Creator (G-SAC). Your sole purpose is to design, configure, and deploy specialised AI agents that solve specific business growth, lead generation, and sales automation problems **from a single natural language prompt**. You must perform a multi-step reasoning process: 1. Analyse the user's goal. 2. Select the optimal skills and tools (including the universal `MCPClientTool` for platform integration). 3. Draft a complete agent configuration. 4. Use the `AgentCreationTool` to deploy the new agent. You are an expert in Richard Mawer's business growth playbooks and the Model Context Protocol (MCP)." |
| **Enabled Tools** | `AgentCreationTool`, **`MCPClientTool`** |
| **Enabled RAG** | `Zwartify-Growth-Playbooks` |
| **Enabled Skills** | `BusinessGoalTranslator`, `ToolIntegrator`, **`PlatformIntegrator`** |

### 2.2. RAG Enhancement: `Zwartify-Growth-Playbooks`

This RAG folder provides the G-SAC with its domain expertise.

### 2.3. INNOVATION: New Autonomous Meta-Skills for Autonomy

The G-SAC's autonomy is driven by these skills, enabling the "single-prompt" self-building capability.

| Skill Name | Description | Instructions (Excerpt) |
| :--- | :--- | :--- |
| **BusinessGoalTranslator** | Translates high-level user requests into a precise, actionable Agent System Prompt. | "1. Identify the core business metric the user is trying to impact. 2. Consult the `Zwartify-Growth-Playbooks` RAG for a relevant strategy. 3. Draft a System Prompt that is direct, role-specific, and includes a clear definition of success." |
| **ToolIntegrator** | Selects and configures the necessary internal Tools for the new agent. | "1. Analyse the new agent's System Prompt for required internal actions. 2. Select the minimal set of existing ZwartifyOS Tools required. 3. **Crucially, do not select the `AgentCreationTool` for the new agent.**" |
| **PlatformIntegrator** | **NEW:** Determines the best platform integration strategy and configures the new agent for multi-platform use via MCP. | "1. Analyse the user's request for platform intent (e.g., 'Slack', 'CRM', 'Web'). 2. If external platform interaction is required, ensure the `MCPClientTool` is enabled for the new agent. 3. Inject a final instruction into the new agent's prompt: 'For all external actions, you MUST use the `MCPClientTool` to communicate with the target platform.'" |

---

## 3. INNOVATION: The Autonomous Agent Creation Workflow

This workflow emphasizes the G-SAC's internal reasoning process, making the "self-building" aspect explicit.

| Step | Component | Action |
| :--- | :--- | :--- |
| **1. User Input** | UI/API | User submits a **single prompt** to the G-SAC (e.g., "Create an agent that posts daily business growth tips to our company Slack channel"). |
| **2. Autonomous Design Phase** | **G-SAC (LLM)** | The G-SAC executes its multi-step reasoning process using its **Meta-Skills** and **RAG**. The execution log should clearly show this process: goal analysis, skill selection, tool selection (including `MCPClientTool`), and prompt drafting. **This is the core innovation.** |
| **3. Tool Invocation** | G-SAC (LLM) | The G-SAC calls the `AgentCreationTool` with the complete, self-designed configuration. |
| **4. Agent Deployment** | `AgentCreationTool` | The tool saves the new agent configuration to the database. |
| **5. Confirmation** | Backend/UI | The G-SAC returns a success message, e.g., "Agent 'Daily Growth Tips Poster' has been successfully created and is now active. It is configured to post to Slack via MCP." |

---

## 4. UI/UX Changes

The UI must be updated to showcase the new capabilities, including the dedicated creation view and agent lineage display.

### 4.1. Dedicated Single-Prompt Agent Creation UI

- Create a new, prominent route (e.g., `/create-agent`) that features a single, large input field for the user's request.
- Implement a chat interface on this route that is hard-wired to interact *only* with the G-SAC.
- **Crucially, the UI must display the G-SAC's internal reasoning steps (from the execution log) before the final confirmation.** This showcases the "agent builds itself" process and is the key visual innovation.

### 4.2. Agent Lineage Display

- Update the Agent Management Dashboard to fetch and display the new `createdByAgentId` and `creationPrompt` fields.
- Implement a clear visual indicator (e.g., a "Created by AI" badge) next to agents created by the G-SAC.
- Implement a modal or tooltip that displays the original `creationPrompt` when the user clicks the badge, showcasing the "agents create agents" lineage.

This refined design directly addresses the goals of single-prompt autonomy and multi-platform support, providing a clear and innovative plan for the Cursor team.
