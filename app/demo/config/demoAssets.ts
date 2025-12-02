/**
 * Demo Assets Configuration
 * Stores text-based demo queries and configurations for the interactive demo
 * All demos are self-contained with no external dependencies
 */

export const demoAssets = {
  // Text-based demo queries (no external dependencies)
  demoQueries: {
    contentWriter: {
      input: "Write a short blog post (200 words) about how AI agents are transforming business workflows",
      agentName: "content-writer",
    },
    researchAssistant: {
      input: "Research competitors in the AI agent space. Summarize the top 3 platforms and their key differentiators.",
      agentName: "research-assistant",
    },
    codeReviewer: {
      input: "Review this code for security vulnerabilities:\n\n```javascript\nfunction login(username, password) {\n  const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;\n  return db.query(query);\n}\n```",
      agentName: "code-reviewer",
    },
    emailAssistant: {
      input: "Draft a professional follow-up email to a potential client after a product demo",
      agentName: "email-assistant",
    },
  },
  
  // G-SAC prompts (simple, text-based)
  gsacPrompts: {
    simple: "Create a social media content creator agent that can write engaging posts for Twitter and LinkedIn",
    advanced: "Create a customer support agent that can answer FAQs and escalate complex issues",
  },
}

