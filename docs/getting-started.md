# Getting Started

This guide walks you through installing and setting up skim.

## Prerequisites

- Go 1.21 or later
- One or more supported coding agents installed:
  - Claude (`~/.claude/skills`)
  - Codex (`~/.codex/skills`)
  - Gemini (`~/.gemini`)
  - Qoder (`~/.qoder/skills`)
  - QoderWork (`~/.qoderwork/skills`)

## Installation

### Using Go Install

```bash
go install github.com/FanBB2333/skim/cmd/skim@latest
```

### Building from Source

```bash
git clone https://github.com/FanBB2333/skim.git
cd skim
make build
make install
```

## Initial Setup

After installation, run the init command to set up skim:

```bash
skim init
```

This creates the skim directory structure at `~/.skim/`:

```
~/.skim/
├── config.yaml    # Configuration file
├── store/         # Global skill store
├── envs/          # Environment definitions
└── state.yaml     # Current state (active env, etc.)
```

## Importing Existing Skills

If you already have skills installed in your agents, scan them into the global store:

```bash
skim agent scan
```

This discovers and imports all existing skills from your installed agents.

## Verifying Installation

Check the current status:

```bash
skim status
```

List available agents:

```bash
skim agent list
```

## Shell Completion

Enable shell completion for a better experience:

### Bash

```bash
skim completion bash > /etc/bash_completion.d/skim
```

### Zsh

```bash
skim completion zsh > "${fpath[1]}/_skim"
```

### Fish

```bash
skim completion fish > ~/.config/fish/completions/skim.fish
```

## Next Steps

- [Concepts](concepts.md) — Understand how skim works
- [Configuration](configuration.md) — Customize skim settings
