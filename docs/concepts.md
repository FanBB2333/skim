# Concepts

This document explains the core concepts in skim.

## Overview

skim is a skill version manager inspired by tools like nvm (Node Version Manager) and pyenv. Instead of managing language versions, skim manages **skills** (custom instructions and tools) across multiple AI coding assistant frameworks.

## Skills

A **skill** is a configuration file (usually markdown) that extends an AI coding assistant's capabilities. Skills can include:

- Custom instructions for specific tasks
- Project-specific guidelines
- Code style preferences
- Domain knowledge

Skills are stored in the **global store** (`~/.skim/store/`) and can be deployed to any supported agent.

### Skill Structure

```yaml
name: my-skill
description: A custom skill for my project
version: 1.0.0
```

## Environments

An **environment** is a named collection of skills. Environments allow you to:

- Group related skills together
- Switch between different skill sets instantly
- Maintain separate configurations for different projects or workflows

### Example Environments

```
work/
├── company-guidelines
├── code-review
└── testing-best-practices

personal/
├── side-project
└── learning-rust
```

### Environment Lifecycle

1. **Create** — `skim env create <name>`
2. **Configure** — Enable/disable skills with `skim skill enable/disable`
3. **Activate** — Deploy skills with `skim activate <env>`
4. **Deactivate** — Remove deployed skills with `skim deactivate`

## Agents

An **agent** is a supported AI coding assistant framework. Each agent has its own skill directory where skim deploys skills.

### Supported Agents

| Agent | Skill Directory | Format |
|-------|-----------------|--------|
| Claude | `~/.claude/skills` | standard |
| Codex | `~/.codex/skills` | standard |
| Gemini | `~/.gemini` | gemini |
| Qoder | `~/.qoder/skills` | standard |
| QoderWork | `~/.qoderwork/skills` | standard |

### Agent Detection

skim automatically detects which agents are installed by checking for their skill directories.

## Global Store

The **global store** (`~/.skim/store/`) is where all skills are centrally stored. Benefits include:

- Single source of truth for all skills
- Easy backup and sync
- Skills can be shared across environments

## Activation

**Activation** is the process of deploying skills from an environment to all enabled agents. When you activate an environment:

1. skim reads the environment's skill list
2. For each enabled agent, skim copies skills to the agent's directory
3. The active environment is recorded in the state file

### Link Strategy

skim uses a **copy** strategy by default, copying skill files to agent directories. This ensures:

- Skills work even if skim is uninstalled
- No dependency on symlinks
- Consistent behavior across platforms
