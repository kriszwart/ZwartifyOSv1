"use client"

import Link from "next/link"

export default function MCPPage() {
  const integrations = [
    {
      name: "Slack",
      icon: "💬",
      description: "Send messages, create channels, manage workspaces",
      examples: [
        "Customer support bots",
        "Team notifications",
        "Automated reporting",
        "Channel management"
      ],
      methods: ["sendMessage", "createChannel", "postToChannel", "getChannels"],
      color: "purple"
    },
    {
      name: "Discord",
      icon: "🎮",
      description: "Community management and engagement",
      examples: [
        "Community moderation",
        "Automated announcements",
        "Event reminders",
        "Support tickets"
      ],
      methods: ["sendMessage", "createThread", "manageRoles", "getMembers"],
      color: "blue"
    },
    {
      name: "Twitter/X",
      icon: "🐦",
      description: "Social media posting and engagement",
      examples: [
        "Content scheduling",
        "Trend monitoring",
        "Engagement tracking",
        "Auto-replies"
      ],
      methods: ["postTweet", "getTimeline", "searchTweets", "replyToTweet"],
      color: "cyan"
    },
    {
      name: "CRM Systems",
      icon: "📊",
      description: "Salesforce, HubSpot, and custom CRM integrations",
      examples: [
        "Lead qualification",
        "Contact management",
        "Pipeline updates",
        "Deal tracking"
      ],
      methods: ["createContact", "updateDeal", "getLeads", "logActivity"],
      color: "green"
    },
    {
      name: "Email",
      icon: "📧",
      description: "Email automation and management",
      examples: [
        "Auto-responses",
        "Email campaigns",
        "Inbox management",
        "Follow-up automation"
      ],
      methods: ["sendEmail", "getEmails", "replyToEmail", "scheduleEmail"],
      color: "yellow"
    },
    {
      name: "Calendar",
      icon: "📅",
      description: "Google Calendar, Outlook, and scheduling systems",
      examples: [
        "Meeting scheduling",
        "Availability checking",
        "Event management",
        "Reminder automation"
      ],
      methods: ["createEvent", "getAvailability", "updateEvent", "sendInvite"],
      color: "pink"
    },
    {
      name: "Database",
      icon: "🗄️",
      description: "PostgreSQL, MySQL, MongoDB connections",
      examples: [
        "Data analysis",
        "Report generation",
        "Data updates",
        "Query automation"
      ],
      methods: ["query", "insert", "update", "delete"],
      color: "cyan"
    },
    {
      name: "GitHub",
      icon: "💻",
      description: "Code repository management",
      examples: [
        "PR management",
        "Issue tracking",
        "Code reviews",
        "Deployment automation"
      ],
      methods: ["createPR", "getIssues", "commentOnPR", "mergePR"],
      color: "green"
    },
    {
      name: "Notion",
      icon: "📝",
      description: "Knowledge base and documentation",
      examples: [
        "Document creation",
        "Knowledge management",
        "Task tracking",
        "Content organisation"
      ],
      methods: ["createPage", "updatePage", "searchPages", "addToDatabase"],
      color: "purple"
    },
    {
      name: "Stripe",
      icon: "💳",
      description: "Payment processing and subscriptions",
      examples: [
        "Subscription management",
        "Invoice generation",
        "Payment tracking",
        "Customer billing"
      ],
      methods: ["createSubscription", "getInvoices", "updateCustomer", "processPayment"],
      color: "green"
    },
    {
      name: "Google Sheets",
      icon: "📈",
      description: "Spreadsheet automation",
      examples: [
        "Data entry",
        "Report generation",
        "Data analysis",
        "Automated updates"
      ],
      methods: ["readSheet", "writeToSheet", "updateCell", "createSheet"],
      color: "yellow"
    },
    {
      name: "Custom APIs",
      icon: "🔌",
      description: "Connect to any REST API",
      examples: [
        "Custom integrations",
        "Internal systems",
        "Third-party services",
        "Legacy system connections"
      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      color: "cyan"
    }
  ]

  const superpowers = [
    {
      title: "Universal Platform Access",
      description: "One tool, infinite platforms. Connect to Slack, Discord, Twitter, CRM, and any custom API without writing integration code.",
      icon: "🌐"
    },
    {
      title: "Zero Configuration Required",
      description: "MCP servers handle authentication, retries, and error handling. Just specify service and method—we handle the rest.",
      icon: "⚡"
    },
    {
      title: "Platform-Agnostic Agents",
      description: "Build agents that work across multiple platforms simultaneously. Post to Slack and Twitter in one action.",
      icon: "🚀"
    },
    {
      title: "Self-Configuring Integration",
      description: "G-SAC automatically detects when agents need platform integration and enables MCP—no manual configuration.",
      icon: "🧠"
    },
    {
      title: "Enterprise Security",
      description: "Secure authentication, environment-based configuration, and audit logging built-in.",
      icon: "🔒"
    },
    {
      title: "Custom MCP Servers",
      description: "Easily add your own MCP servers for internal systems or proprietary APIs.",
      icon: "⚙️"
    }
  ]

  const comparisons = [
    {
      feature: "Platform Integration",
      toolhouse: "Built-in integrations only",
      zwartify: "Universal MCP—connect to anything",
      winner: "zwartify"
    },
    {
      feature: "Custom Integrations",
      toolhouse: "Requires API code",
      zwartify: "Zero code—just configure MCP server",
      winner: "zwartify"
    },
    {
      feature: "Multi-Platform Agents",
      toolhouse: "One platform per agent",
      zwartify: "Agents work across all platforms",
      winner: "zwartify"
    },
    {
      feature: "Self-Configuration",
      toolhouse: "Manual setup required",
      zwartify: "G-SAC auto-detects and configures",
      winner: "zwartify"
    },
    {
      feature: "Cost",
      toolhouse: "Subscription pricing",
      zwartify: "Open source—self-hosted",
      winner: "zwartify"
    },
    {
      feature: "Extensibility",
      toolhouse: "Platform-dependent",
      zwartify: "Add any MCP server",
      winner: "zwartify"
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      purple: "border-purple-400/50 bg-purple-400/5 text-purple-300 hover:border-purple-400 hover:bg-purple-400/10",
      blue: "border-blue-400/50 bg-blue-400/5 text-blue-300 hover:border-blue-400 hover:bg-blue-400/10",
      cyan: "border-cyan-400/50 bg-cyan-400/5 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-400/10",
      green: "border-green-400/50 bg-green-400/5 text-green-300 hover:border-green-400 hover:bg-green-400/10",
      yellow: "border-yellow-400/50 bg-yellow-400/5 text-yellow-300 hover:border-yellow-400 hover:bg-yellow-400/10",
      pink: "border-pink-400/50 bg-pink-400/5 text-pink-300 hover:border-pink-400 hover:bg-pink-400/10"
    }
    return colors[color] || colors.green
  }

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      
      {/* Scanline Effect */}
      <div className="scanline fixed inset-0 pointer-events-none" />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="border-b border-green-400/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-green-400 hover:text-green-300 transition-colors font-mono"
            >
              ← HOME
            </Link>
            <span className="text-green-400/50">|</span>
            <Link
              href="/docs"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Docs
            </Link>
          </div>
          <h1 className="text-2xl font-bold font-mono">MCP Superpowers</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/create-agent"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Create Agent
            </Link>
            <Link
              href="/playground"
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-sm"
            >
              Playground
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🌐</div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Model Context Protocol
            </h2>
            <p className="text-xl text-green-300/80 max-w-3xl mx-auto mb-6">
              Universal platform integration. Connect to Slack, Discord, Twitter, CRM, and any API—all through one powerful protocol.
            </p>
            <p className="text-lg text-green-400/60 max-w-2xl mx-auto mb-8">
              Unlike Toolhouse.ai, ZwartifyOS gives you unlimited platform access with zero integration code. Just configure your MCP servers and go.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/create-agent"
                className="px-8 py-4 border-2 border-purple-400 bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 transition-colors font-mono font-bold"
              >
                Build with MCP →
              </Link>
              <Link
                href="/docs?tab=tools"
                className="px-8 py-4 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-colors font-mono"
              >
                View Documentation
              </Link>
            </div>
          </div>

          {/* Why MCP Section */}
          <div className="bg-gradient-to-r from-green-400/10 to-cyan-400/10 border-2 border-green-400/50 p-8 rounded-lg mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Why MCP?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {superpowers.map((power, idx) => (
                <div key={idx} className="bg-black/50 border border-green-400/30 p-6 rounded-lg">
                  <div className="text-4xl mb-3">{power.icon}</div>
                  <h3 className="text-xl font-bold text-green-400 mb-2">{power.title}</h3>
                  <p className="text-green-300/70 text-sm">{power.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Available Integrations */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Available Integrations</h2>
            <p className="text-center text-green-300/70 mb-8 max-w-3xl mx-auto">
              Connect to these platforms out of the box. Add your own custom MCP servers for unlimited extensibility.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-lg p-6 transition-all cursor-pointer ${getColorClasses(integration.color)}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">{integration.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{integration.name}</h3>
                      <p className="text-sm opacity-80">{integration.description}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xs font-mono uppercase opacity-60 mb-2">Examples:</div>
                    <ul className="space-y-1 text-sm">
                      {integration.examples.map((example, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">→</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-current/20">
                    <div className="text-xs font-mono uppercase opacity-60 mb-2">Methods:</div>
                    <div className="flex flex-wrap gap-2">
                      {integration.methods.map((method, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-black/50 border border-current/30 rounded font-mono"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison with Toolhouse */}
          <div className="bg-gradient-to-r from-purple-400/10 via-cyan-400/10 to-green-400/10 border-2 border-purple-400/50 p-8 rounded-lg mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">ZwartifyOS vs Toolhouse.ai</h2>
            <p className="text-center text-green-300/70 mb-8 max-w-2xl mx-auto">
              We're not just matching Toolhouse—we're surpassing it. Here's how:
            </p>
            <div className="space-y-4">
              {comparisons.map((comp, idx) => (
                <div
                  key={idx}
                  className="bg-black/50 border border-green-400/30 p-6 rounded-lg"
                >
                  <div className="grid md:grid-cols-3 gap-4 items-center">
                    <div className="font-bold text-green-400">{comp.feature}</div>
                    <div className={`text-sm ${comp.winner === 'toolhouse' ? 'text-green-400' : 'text-green-300/60'}`}>
                      <div className="font-mono text-xs opacity-60 mb-1">Toolhouse:</div>
                      {comp.toolhouse}
                    </div>
                    <div className={`text-sm ${comp.winner === 'zwartify' ? 'text-green-400 font-bold' : 'text-green-300/60'}`}>
                      <div className="font-mono text-xs opacity-60 mb-1">ZwartifyOS:</div>
                      {comp.zwartify}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg text-center">
                <div className="text-4xl mb-4">1️⃣</div>
                <h3 className="text-xl font-bold text-green-400 mb-3">Configure MCP Server</h3>
                <p className="text-green-300/70 text-sm mb-4">
                  Set environment variables or configure your MCP server endpoint. That's it—no code required.
                </p>
                <div className="bg-black border border-green-400/30 p-3 rounded font-mono text-xs text-left">
                  <div className="text-green-400/60">export MCP_SLACK_ENDPOINT=...</div>
                  <div className="text-green-400/60">export MCP_API_KEY=...</div>
                </div>
              </div>

              <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg text-center">
                <div className="text-4xl mb-4">2️⃣</div>
                <h3 className="text-xl font-bold text-green-400 mb-3">Create Agent</h3>
                <p className="text-green-300/70 text-sm mb-4">
                  Use G-SAC to create an agent. It automatically detects platform needs and enables MCP.
                </p>
                <div className="bg-black border border-green-400/30 p-3 rounded font-mono text-xs text-left">
                  <div className="text-green-400/60">"Create an agent that posts</div>
                  <div className="text-green-400/60">to Slack and Twitter"</div>
                </div>
              </div>

              <div className="bg-black/50 border-2 border-green-400/50 p-6 rounded-lg text-center">
                <div className="text-4xl mb-4">3️⃣</div>
                <h3 className="text-xl font-bold text-green-400 mb-3">Agent Uses MCP</h3>
                <p className="text-green-300/70 text-sm mb-4">
                  Your agent calls MCP methods naturally. Authentication, retries, and errors are handled automatically.
                </p>
                <div className="bg-black border border-green-400/30 p-3 rounded font-mono text-xs text-left">
                  <div className="text-green-400/60">callMCP('slack',</div>
                  <div className="text-green-400/60">  'sendMessage', ...)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-green-400/10 via-purple-400/10 to-cyan-400/10 border-2 border-green-400/50 p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-lg text-green-300/80 mb-6 max-w-2xl mx-auto">
              Create agents that work across all platforms. No integration code. No limits. Just configure MCP and go.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/create-agent"
                className="px-8 py-4 border-2 border-purple-400 bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 transition-colors font-mono font-bold"
              >
                Create Your First MCP Agent
              </Link>
              <Link
                href="/playground"
                className="px-8 py-4 border-2 border-green-400 bg-green-400/20 text-green-300 hover:bg-green-400/30 transition-colors font-mono font-bold"
              >
                Try Playground
              </Link>
              <Link
                href="/docs?tab=tools"
                className="px-8 py-4 border-2 border-green-400 text-green-400 hover:bg-green-400/10 transition-colors font-mono"
              >
                Read Documentation
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

