# skim

Skill Version Manager for coding agents. Manage and switch skills across multiple AI coding assistant frameworks with environment-based isolation.

## Features

- **Multi-Agent Support** — Works with Claude, Codex, Gemini, Qoder, and QoderWork
- **Global Skill Store** — Centralized skill management with easy import/export
- **Environment Switching** — Create isolated skill sets and switch between them instantly
- **One-Command Deploy** — Activate an environment to deploy skills to all agents at once

## Installation

```bash
go install github.com/FanBB2333/skim/cmd/skim@latest
```

Or build from source:

```bash
make build
make install
```

## Quick Start

```bash
# Initialize skim
skim init

# See the base environment snapshot created from current agents
skim env list

# Add the bundled example skill to the global store
skim add ./examples/demo-skill

# Install the bundled example skill to a specific agent
skim install -t qoder ./examples/demo-skill

# Create an environment
skim env create work

# Enable skills in the environment
skim skill enable demo-skill --env work

# Activate the environment (deploys to all agents)
skim activate work
```

## Commands

| Command | Description |
|---------|-------------|
| `skim status` | Show current status |
| `skim init` | Initialize skim configuration |
| `skim add <path>` | Add a skill from local path to the global store |
| `skim install -t <agent> <path>` | Add to the store and install to one target agent |
| `skim env list` | List all environments |
| `skim env create <name>` | Create a new environment |
| `skim env remove <name>` | Remove an environment |
| `skim activate <env>` | Activate an environment |
| `skim deactivate` | Deactivate current environment |
| `skim skill list` | List skills in the global store |
| `skim skill add <path>` | Add a skill from local path |
| `skim skill remove <name>` | Remove a skill from the store |
| `skim skill enable <name>` | Enable a skill in an environment |
| `skim skill disable <name>` | Disable a skill in an environment |
| `skim agent list` | List supported agents and status |
| `skim agent scan` | Import existing skills to the store |
| `skim completion` | Generate shell completion scripts |

## Documentation

See [docs/](docs/) for detailed documentation:

- [Getting Started](docs/getting-started.md)
- [Concepts](docs/concepts.md)
- [Configuration](docs/configuration.md)
- [Command Reference](docs/commands.md)

## License

MIT
