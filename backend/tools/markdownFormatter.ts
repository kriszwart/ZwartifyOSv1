export const markdownFormatter = {
  name: "markdownFormatter",
  description: "Formats and cleans markdown text, adds proper headings, and ensures consistent styling",
  execute: async (input: { text?: string }) => {
    const text = input?.text || ""
    
    // Basic markdown formatting
    let formatted = text.trim()
    
    // Ensure proper line breaks
    formatted = formatted.replace(/\n{3,}/g, "\n\n")
    
    // Add headings if missing
    if (!formatted.match(/^#+\s/)) {
      const lines = formatted.split("\n")
      if (lines.length > 0 && lines[0].length > 0) {
        formatted = `# ${lines[0]}\n\n${lines.slice(1).join("\n")}`
      }
    }
    
    // Clean up spacing
    formatted = formatted.replace(/ +/g, " ")
    
    return {
      formatted,
      wordCount: formatted.split(/\s+/).length,
      hasHeadings: /^#+\s/m.test(formatted),
    }
  },
}

