# AI-SQUAD: AI System for Quick Unified Agile Development

_Based on the BMad-Method framework by Brian (BMad) Madison_

[![Version](https://img.shields.io/npm/v/ai-squad?color=blue&label=version)](https://www.npmjs.com/package/ai-squad)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289da?logo=discord&logoColor=white)](https://discord.gg/gk8jAdXWmj)

AI-SQUAD builds upon the foundations of the BMad Method (Breakthrough Method of Agile AI-Driven Development) to provide a universal AI agent framework. Transform any domain with specialized AI expertise: software development, entertainment, creative writing, business strategy to personal wellness just to name a few.

**[Subscribe to BMadCode on YouTube](https://www.youtube.com/@BMadCode?sub_confirmation=1)** - Original creator of the BMad Method framework

**[Join our Discord Community](https://discord.gg/gk8jAdXWmj)** - A growing community for AI enthusiasts! Get help, share ideas, explore AI agents & frameworks, collaborate on tech projects, enjoy hobbies, and help each other succeed. Whether you're stuck on AI-SQUAD, building your own agents, or just want to chat about the latest in AI - we're here for you!

⭐ **If you find this project helpful or useful, please give it a star in the upper right hand corner!** It helps others discover AI-SQUAD and you will be notified of updates!

## Overview

**AI-SQUAD's Two Key Innovations (inherited from BMad Method):**

**1. Agentic Planning:** Dedicated agents (Analyst, PM, Architect) collaborate with you to create detailed, consistent PRDs and Architecture documents. Through advanced prompt engineering and human-in-the-loop refinement, these planning agents produce comprehensive specifications that go far beyond generic AI task generation.

**2. Context-Engineered Development:** The Scrum Master agent then transforms these detailed plans into hyper-detailed development stories that contain everything the Dev agent needs - full context, implementation details, and architectural guidance embedded directly in story files.

This two-phase approach eliminates both **planning inconsistency** and **context loss** - the biggest problems in AI-assisted development. Your Dev agent opens a story file with complete understanding of what to build, how to build it, and why.

**📖 [See the complete workflow in the User Guide](docs/user-guide.md)** - Planning phase, development cycle, and all agent roles

## Quick Navigation

### Understanding the AI-SQUAD Workflow

**Before diving in, review these critical workflow diagrams that explain how AI-SQUAD works:**

1. **[Planning Workflow (Web UI)](docs/user-guide.md#the-planning-workflow-web-ui)** - How to create PRD and Architecture documents
2. **[Core Development Cycle (IDE)](docs/user-guide.md#the-core-development-cycle-ide)** - How SM, Dev, and QA agents collaborate through story files

> ⚠️ **These diagrams explain 90% of AI-SQUAD Agentic Agile flow confusion** - Understanding the PRD+Architecture creation and the SM/Dev/QA workflow and how agents pass notes through story files is essential - and also explains why this is NOT taskmaster or just a simple task runner!

### What would you like to do?

- **[Install and Build software with Full Stack Agile AI Team](#quick-start)** → Quick Start Instruction
- **[Learn how to use AI-SQUAD](docs/user-guide.md)** → Complete user guide and walkthrough
- **[See available AI agents](#available-agents)** → Specialized roles for your team
- **[Explore non-technical uses](#-beyond-software-development---expansion-packs)** → Creative writing, business, wellness, education
- **[Create my own AI agents](#creating-your-own-expansion-pack)** → Build agents for your domain
- **[Browse ready-made expansion packs](expansion-packs/)** → Game dev, DevOps, infrastructure and get inspired with ideas and examples
- **[Understand the architecture](docs/core-architecture.md)** → Technical deep dive
- **[Join the community](https://discord.gg/g6ypHytrCB)** → Get help and share ideas

## Important: Keep Your AI-SQUAD Installation Updated

**Stay up-to-date effortlessly!** If you already have AI-SQUAD installed in your project, simply run:

```bash
npx ai-squad install
# OR
git pull
npm run install:ai-squad
```

This will:

- ✅ Automatically detect your existing v4 installation
- ✅ Update only the files that have changed and add new files
- ✅ Create `.bak` backup files for any custom modifications you've made
- ✅ Preserve your project-specific configurations

This makes it easy to benefit from the latest improvements, bug fixes, and new agents without losing your customizations!

## Quick Start

### One Command for Everything (IDE Installation)

**Just run one of these commands:**

```bash
npx ai-squad install
# OR if you already have AI-SQUAD installed:
git pull
npm run install:ai-squad
```

This single command handles:

- **New installations** - Sets up AI-SQUAD in your project
- **Upgrades** - Updates existing installations automatically
- **Expansion packs** - Installs any expansion packs you've added to package.json

> **That's it!** Whether you're installing for the first time, upgrading, or adding expansion packs - these commands do everything.

**Prerequisites**: [Node.js](https://nodejs.org) v20+ required

### Fastest Start: Web UI Full Stack Team at your disposal (2 minutes)

1. **Get the bundle**: Save or clone the [full stack team file](dist/teams/team-fullstack.txt) or choose another team
2. **Create AI agent**: Create a new Gemini Gem or CustomGPT
3. **Upload & configure**: Upload the file and set instructions: "Your critical operating instructions are attached, do not break character as directed"
4. **Start Ideating and Planning**: Start chatting! Type `*help` to see available commands or pick an agent like `*analyst` to start right in on creating a brief.
5. **CRITICAL**: Talk to AI-SQUAD Orchestrator in the web at ANY TIME (#ai-squad-orchestrator command) and ask it questions about how this all works!
6. **When to moved to the IDE**: Once you have your PRD, Architecture, optional UX and Briefs - its time to switch over to the IDE to shard your docs, and start implementing the actual code! See the [User guide](docs/user-guide.md) for more details

### Alternative: Clone and Build

```bash
git clone https://github.com/bmadcode/bmad-method.git
npm run install:ai-squad # build and install all to a destination folder
```

## 🌟 Beyond Software Development - Expansion Packs

AI-SQUAD's natural language framework works in ANY domain. Expansion packs provide specialized AI agents for creative writing, business strategy, health & wellness, education, and more. Also expansion packs can expand the core AI-SQUAD framework with specific functionality that is not generic for all cases. [See the Expansion Packs Guide](docs/expansion-packs.md) and learn to create your own!

## Documentation & Resources

### Essential Guides

- 📖 **[User Guide](docs/user-guide.md)** - Complete walkthrough from project inception to completion
- 🏗️ **[Core Architecture](docs/core-architecture.md)** - Technical deep dive and system design
- 🚀 **[Expansion Packs Guide](docs/expansion-packs.md)** - Extend AI-SQUAD to any domain beyond software development
- [IDE Specific Guides available in this folder](docs/agentic-tools/)

## Support

- 💬 [Discord Community](https://discord.gg/g6ypHytrCB)
- 🐛 [Issue Tracker](https://github.com/bmadcode/bmad-method/issues) - Original BMad Method repository
- 💬 [Discussions](https://github.com/bmadcode/bmad-method/discussions) - Original BMad Method repository

## Contributing

**We're excited about contributions and welcome your ideas, improvements, and expansion packs!** 🎉

📋 **[Read CONTRIBUTING.md](CONTRIBUTING.md)** - Complete guide to contributing, including guidelines, process, and requirements

## License

MIT License - see [LICENSE](LICENSE) for details.

[![Contributors](https://contrib.rocks/image?repo=bmadcode/bmad-method)](https://github.com/bmadcode/bmad-method/graphs/contributors)

_AI-SQUAD is based on the BMad-Method created by Brian (BMad) Madison_

<sub>Built with ❤️ for the AI-assisted development community</sub>
