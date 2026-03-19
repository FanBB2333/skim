# Configuration

skim stores its configuration in `~/.skim/config.yaml`. This document describes all available options.

## Configuration File

The default configuration looks like this:

```yaml
version: 1
link_strategy: copy
agents:
  claude:
    skill_dir: ~/.claude/skills
    enabled: true
    format: standard
  codex:
    skill_dir: ~/.codex/skills
    enabled: true
    format: standard
  gemini:
    skill_dir: ~/.gemini
    enabled: true
    format: gemini
  qoder:
    skill_dir: ~/.qoder/skills
    enabled: true
    format: standard
  qoderwork:
    skill_dir: ~/.qoderwork/skills
    enabled: true
    format: standard
```

## Options

### version

The configuration file version. Currently `1`.

### link_strategy

How skills are deployed to agent directories.

| Value | Description |
|-------|-------------|
| `copy` | Copy skill files to agent directories (default) |

### agents

A map of agent configurations. Each agent has the following options:

#### skill_dir

The path to the agent's skill directory. Supports `~` for home directory expansion.

#### enabled

Whether this agent should receive skills during activation. Set to `false` to skip an agent.

#### format

The skill format used by this agent:

| Format | Description |
|--------|-------------|
| `standard` | Standard markdown skill format |
| `gemini` | Gemini-specific format |

## Directory Structure

skim uses the following directory structure:

```
~/.skim/
├── config.yaml      # This configuration file
├── state.yaml       # Current state (active environment)
├── store/           # Global skill store
│   ├── skill-a/
│   ├── skill-b/
│   └── ...
└── envs/            # Environment definitions
    ├── work.yaml
    ├── personal.yaml
    └── ...
```

## Environment Files

Environment files are stored in `~/.skim/envs/` with the format:

```yaml
name: work
skills:
  - skill-a
  - skill-b
  - skill-c
```

## State File

The state file (`~/.skim/state.yaml`) tracks the current active environment:

```yaml
active_env: work
```

## Customizing Agent Directories

If your agent uses a non-standard skill directory, update the configuration:

```yaml
agents:
  claude:
    skill_dir: ~/custom/path/to/skills
    enabled: true
    format: standard
```

## Disabling Agents

To prevent skim from deploying skills to a specific agent:

```yaml
agents:
  gemini:
    skill_dir: ~/.gemini
    enabled: false
    format: gemini
```
