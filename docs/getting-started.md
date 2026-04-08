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

This creates the skim directory structure at `~/.skim/` and a `base` environment snapshot from your currently installed agent skills:

```
~/.skim/
├── config.yaml    # Configuration file
├── store/         # Global skill store
├── envs/          # Environment definitions
└── state.yaml     # Current state (active env, etc.)
```

## Base Snapshot Environment

Right after initialization, inspect the generated `base` environment:

```bash
skim env list
```

If your agents already had skills installed, `skim init` has already imported them into the global store and recorded the snapshot in `base`.

## Adding and Installing Skills

Add a skill to the global store:

```bash
skim add ./examples/demo-skill
```

Install a skill directly to one target agent:

```bash
skim install -t qoder ./examples/demo-skill
```

`skim install` adds the skill to the store first, then installs it to the target agent via symlink.

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
