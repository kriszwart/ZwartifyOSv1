# Contributing to ZwartifyOS

Thank you for your interest in contributing to ZwartifyOS! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on GitHub with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Your environment (OS, Node version, etc.)
- Screenshots if applicable

### Suggesting Features

We love feature suggestions! Please open an issue with:
- A clear description of the feature
- Use cases and benefits
- Any implementation ideas (optional)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Set up your development environment**
   ```bash
   npm install
   cp .env.example .env.local
   # Add your CLAUDE_API_KEY to .env.local
   npm run dev
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run build
   npm run lint
   ```

5. **Commit your changes**
   - Use clear, descriptive commit messages
   - Follow the format: `type: description`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - Example: `feat: add new tool for PDF processing`

6. **Push to your fork and submit a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Wait for review**
   - We'll review your PR as soon as possible
   - Be open to feedback and make requested changes
   - Once approved, we'll merge your contribution

## Code Style Guidelines

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Use the project's ESLint configuration
- **Naming**: Use camelCase for variables/functions, PascalCase for components/classes
- **Comments**: Add JSDoc comments for public functions
- **Imports**: Use absolute imports with `@/` prefix

## Project Structure

```
/app                 # Next.js app router pages
/backend            # Agent system, tools, RAG, etc.
  /agents           # Agent implementations
  /tools            # Tool definitions
  /rag              # RAG system
  /memory           # Memory/context management
  /scheduler        # Scheduling system
/docs               # Documentation
/lib                # Shared utilities
/public             # Static assets
/styles             # Global styles
```

## Adding New Features

### Adding a New Tool

1. Create a file in `/backend/tools/yourTool.ts`
2. Export an object with `name`, `description`, and `execute` function
3. Add the import to `/backend/tools/index.ts`
4. Document the tool in `/docs/feature-usage.md`

Example:
```typescript
export const myTool = {
  name: "myTool",
  description: "Does something useful",
  execute: async (args?: any) => {
    // Your implementation
    return "Tool result"
  }
}
```

### Adding a New Agent

1. Create a file in `/backend/agents/yourAgent.ts`
2. Implement the agent using the `agentClient`
3. Add documentation to `/docs/feature-usage.md`

Example:
```typescript
import { agentClient } from "./agentClient"
import { getTools } from "../tools"

export async function myAgent(input: string) {
  const tools = await getTools()
  const result = await agentClient.run(input, { tools })
  return { text: result.output_text }
}
```

### Adding Documentation

- Update relevant docs in `/docs/` folder
- Keep documentation clear, concise, and up-to-date
- Add code examples where helpful
- Update the main README.md if needed

## Development Workflow

### Using Claude Code for Web

ZwartifyOS is designed to work with Claude Code for Web:

1. Make changes in Cursor (local development)
2. Push to GitHub
3. Use Claude Code for Web for code review
4. Claude can commit improvements directly
5. Auto-sync pulls changes back to local (if enabled)
6. Review, merge, and deploy

### Testing

Before submitting a PR, ensure:
- The project builds successfully: `npm run build`
- Linting passes: `npm run lint`
- Your changes work in development: `npm run dev`
- You've tested the affected features manually

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Feature Requests**: Open a GitHub Issue
- **Security Issues**: Email security concerns privately (see SECURITY.md if available)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## License

By contributing to ZwartifyOS, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- Project documentation (for major features)

Thank you for making ZwartifyOS better! 🚀
