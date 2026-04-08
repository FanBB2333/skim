# Skim

**Skill Version Manager for AI Coding Assistants**

Skim is a tool for managing skills (custom instructions) across multiple AI coding assistant frameworks. Think of it like nvm or pyenv, but for AI agent skills.

## Features

- **Multi-agent support** — Manage skills for Claude, Codex, Gemini, and more
- **Environment-based** — Group skills into switchable environments
- **Global store** — Central repository for all your skills
- **GUI included** — Desktop application built with Wails + React
- **Flexible linking** — Deploy via symlink or hardlink

## Supported Agents

| Agent | Skill Directory | Format |
|-------|-----------------|--------|
| Claude Code | `~/.claude/skills` | SKILL.md |
| Codex | `~/.codex/skills` | SKILL.md |
| Gemini CLI | `~/.gemini` | GEMINI.md |
| Antigravity | `~/.gemini/antigravity/skills` | SKILL.md |
| OpenClaw | `~/.openclaw/skills` | SKILL.md |
| Qoder | `~/.qoder/skills` | SKILL.md |
| QoderWork | `~/.qoderwork/skills` | SKILL.md |

## Quick Start

```bash
# Install
go install github.com/FanBB2333/skim/cmd/skim@latest

# Initialize
skim init

# Inspect the base environment snapshot created from current agents
skim env list

# Add the bundled example skill to the store
skim add ./examples/demo-skill

# Install directly to one agent
skim install -t qoder ./examples/demo-skill

# Create an environment and add skills
skim env create work
skim skill enable demo-skill --env work

# Activate
skim activate work
```

## Architecture

```
~/.skim/
├── config.yaml    # Configuration
├── state.yaml     # Active environment state
├── store/         # Global skill store
└── envs/          # Environment definitions
```

## Next Steps

- [Getting Started](getting-started.md) — Installation and setup
- [Concepts](concepts.md) — Core terminology
- [Configuration](configuration.md) — Config file reference
- [Commands](commands.md) — CLI command reference
- [GUI](gui.md) — Desktop application guide
