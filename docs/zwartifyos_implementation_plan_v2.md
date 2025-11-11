# ZwartifyOS: Implementation Plan for Cursor Development Team (v2)

**Project:** ZwartifyOS - Creative Agent System
**Goal:** Transform ZwartifyOS into ZwartifyOS, a platform where a specialized "Creative Agent" can design and deploy new, platform-agnostic agents from a **single natural language prompt**.
**Reference Documents:** `zwartifyos_design_spec_v2.md`

---

## 1. Overview and Phasing

This plan is divided into three distinct phases, allowing for clear milestones and testing at each stage.

| Phase | Focus | Key Deliverable | Estimated Time |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Foundation & Data Layer** | Extended Agent Data Model & Functional `AgentCreationTool` & `MCPClientTool` | 1 Week |
| **Phase 2** | **Core Agent Logic & RAG** | Fully Configured "Growth Strategy Agent Creator" with Autonomous Skills | 1 Week |
| **Phase 3** | **User Experience & Polish** | Integrated UI/UX for Single-Prompt Agent Creation and Lineage Tracking | 1 Week |

---

## 2. Phase 1: Foundation & Data Layer (Backend)

**Goal:** Establish the necessary data structures and the core tools for agent creation and multi-platform integration.

### 2.1. Task: Extend Agent Data Model

| Sub-Task | Description |
| :--- | :--- |
| **2.1.1** | Add `createdByAgentId: UUID \| null` to the Agent configuration schema. |
| **2.1.2** | Add `creationPrompt: String \| null` to the Agent configuration schema. |
| **2.1.3** | Update all CRUD operations and API handlers to safely manage these new fields. |

### 2.2. Task: Implement `AgentCreationTool`

| Sub-Task | Description |
| :--- | :--- |
| **2.2.1** | Define the `AgentCreationTool` with the signature `createAgent(config: AgentConfig)`. |
| **2.2.2** | Implement the tool's logic: **Validate** the incoming `AgentConfig`, **Generate** a new UUID, **Persist** the new agent to the database, and **Return** a success message. |
| **2.2.3** | Ensure the tool automatically sets the `createdByAgentId` based on the calling agent's ID. |
| **2.2.4** | **Testing:** Write unit tests to ensure the tool successfully creates a new agent entry. |

### 2.3. INNOVATION: Implement `MCPClientTool`

**Target Files:** Tool Definition (e.g., `src/tools/MCPClientTool.ts`), API Handler (e.g., `src/api/tools.ts`)

| Sub-Task | Description |
| :--- | :--- |
| **2.3.1** | Define the `MCPClientTool` with the signature `callMCP(service: string, method: string, params: object)`. |
| **2.3.2** | Implement the tool's logic to handle the generic Model Context Protocol (MCP) communication. This tool should be a thin wrapper around a generic HTTP client that forwards requests to a pre-configured MCP server endpoint. |
| **2.3.3** | **Testing:** Write integration tests to ensure the tool can successfully communicate with a mock MCP endpoint. |

---

## 3. Phase 2: Core Agent Logic & RAG (Backend)

**Goal:** Configure the specialized "Growth Strategy Agent Creator" (G-SAC) with the necessary knowledge and autonomous skills.

### 3.1. Task: RAG Enhancement - `Zwartify-Growth-Playbooks`

| Sub-Task | Description |
| :--- | :--- |
| **3.1.1** | Create a new, dedicated RAG folder named `Zwartify-Growth-Playbooks`. |
| **3.1.2** | Populate this folder with relevant content (e.g., sales scripts, marketing frameworks, agent design best practices). *This content will be provided by the CTO/CEO.* |
| **3.1.3** | Verify that the RAG system correctly indexes and retrieves content from this new folder. |

### 3.2. INNOVATION: Define New Autonomous Meta-Skills

**Target Files:** Skills Definition (e.g., `src/skills/meta-skills.ts`)

| Sub-Task | Description |
| :--- | :--- |
| **3.2.1** | Define the `BusinessGoalTranslator` skill. |
| **3.2.2** | Define the `ToolIntegrator` skill. |
| **3.2.3** | **NEW:** Define the `PlatformIntegrator` skill, which includes the logic to automatically enable the `MCPClientTool` and inject platform-specific instructions into the new agent's prompt. |
| **3.2.4** | Ensure these skills are correctly formatted to be injected into the G-SAC's system prompt. |

### 3.3. Task: Configure the "Growth Strategy Agent Creator" (G-SAC)

**Target Files:** Agent Configuration (e.g., `data/agents/creative-agent.json`)

| Sub-Task | Description |
| :--- | :--- |
| **3.3.1** | Create the agent configuration with the name "ZwartifyOS Growth Strategy Agent Creator (G-SAC)." |
| **3.3.2** | Set the detailed System Prompt as defined in the design spec (v2), emphasizing **single-prompt autonomy**. |
| **3.3.3** | Enable the `AgentCreationTool` and the **`MCPClientTool`** for the G-SAC. |
| **3.3.4** | Enable the new `BusinessGoalTranslator`, `ToolIntegrator`, and `PlatformIntegrator` skills. |
| **3.3.5** | Assign the `Zwartify-Growth-Playbooks` RAG folder to the G-SAC. |
| **3.3.6** | **Testing:** Run end-to-end tests where the G-SAC successfully creates a new agent, including the `MCPClientTool` and the correct platform-agnostic prompt instructions. |

---

## 4. Phase 3: User Experience & Polish (Frontend)

**Goal:** Integrate the new functionality into the Next.js frontend for a "fucking cool" user experience that highlights the innovation.

### 4.1. INNOVATION: Dedicated Single-Prompt Agent Creation UI

**Target Files:** Frontend Routes (e.g., `app/create-agent/page.tsx`), Components (e.g., `components/CreativeAgentChat.tsx`)

| Sub-Task | Description |
| :--- | :--- |
| **4.1.1** | Create a new, prominent route (e.g., `/create-agent`) that features a single, large input field for the user's request. |
| **4.1.2** | Implement a chat interface on this route that is hard-wired to interact *only* with the G-SAC. |
| **4.1.3** | **Crucially, the UI must display the G-SAC's internal reasoning steps (from the execution log) before the final confirmation.** This showcases the "agent builds itself" process and is the key visual innovation. |

### 4.2. Task: Agent Lineage Display

| Sub-Task | Description |
| :--- | :--- |
| **4.2.1** | Update the Agent Management Dashboard to fetch and display the new `createdByAgentId` and `creationPrompt` fields. |
| **4.2.2** | Implement a clear visual indicator (e.g., a "Created by AI" badge) next to agents created by the G-SAC. |
| **4.2.3** | Implement a modal or tooltip that displays the original `creationPrompt` when the user clicks the badge, showcasing the "agents create agents" lineage. |

### 4.3. Task: Final Polish and Documentation

| Sub-Task | Description |
| :--- | :--- |
| **4.3.1** | Update all branding from "ZwartifyOS" to "ZwartifyOS" across the application and documentation. |
| **4.3.2** | Write a clear, concise `README.md` section detailing the new **Single-Prompt Autonomous Agent Creation** feature and how it uses the `MCPClientTool` for "any platform" support. |
| **4.3.3** | Perform final QA and cross-browser testing. |

This refined plan ensures the project is not only functional but also highly innovative and competitive.
