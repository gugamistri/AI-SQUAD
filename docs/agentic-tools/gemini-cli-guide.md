# AI-SQUAD Guide for Gemini CLI

For the complete workflow, see the [AI-SQUAD Workflow Guide](../bmad-workflow-guide.md).

_Based on the BMad Method framework by Brian (BMad) Madison._

## Installation

When running `npx ai-squad install`, select **Gemini CLI** as your IDE. This creates:

- `.gemini/agents/` directory with all agent context files
- `.gemini/settings.json` configured to load all agents automatically

## Using AI-SQUAD Agents with Gemini CLI

Simply mention the agent in your prompt:

- "As @dev, implement the login feature"
- "Acting as @architect, review this system design"
- "@sm, create the next story for our project"

The Gemini CLI automatically loads the appropriate agent context.

## Gemini CLI-Specific Features

- **Context files**: All agents loaded as context in `.gemini/agents/`
- **Automatic loading**: Settings.json ensures agents are always available
- **Natural language**: No special syntax needed, just mention the agent

## Tips for Gemini CLI Users

- Be explicit about which agent you're addressing
- You can switch agents mid-conversation by mentioning a different one
- The CLI maintains context across your session
