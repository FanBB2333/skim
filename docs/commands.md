# Command Reference

Complete reference for all skim commands.

## Global Commands

### skim

```
skim [command]
```

Root command. Run with no arguments to see help.

### skim init

```
skim init
```

Initialize skim configuration. Creates the `~/.skim/` directory structure, default configuration file, and a `base` environment snapshot from currently available agent skills.

### skim add

```
skim add <path>
```

Add a skill from a local path to the global store.

**Arguments:**
- `path` — Path to the skill directory

**Example:**

```bash
skim add ./examples/demo-skill
```

### skim install

```
skim install -t <agent> <path>
```

Add a skill to the global store and install it to one specific agent via symlink.

**Arguments:**
- `path` — Path to the skill directory

**Flags:**
- `-t, --target` — Target agent ID such as `qoder`, `codex`, or `claude`

**Example:**

```bash
skim install -t qoder ./examples/demo-skill
```

### skim pack

```
skim pack [-o <archive>] [--env <env>]
```

Pack skim-managed skills and environments into a portable `.tar.gz` archive.

Without `--env`, the archive includes all skills in `~/.skim/store` and all environments in `~/.skim/envs`. With `--env`, it includes only that environment and the skills it references.

The archive contains `manifest.yaml`, `config.yaml`, selected `store/` entries, and selected `envs/` entries. The manifest records the pack format, format version, skim version, pack time, packed skills, packed environments, and symlink handling mode.

Symlinked files and directories inside skills are dereferenced into regular archive entries so the pack can be moved to another machine.

**Flags:**
- `-o, --output` — Output archive path
- `--env` — Pack only one environment and its referenced skills

**Examples:**

```bash
# Pack everything
skim pack -o skim-all.tar.gz

# Pack one environment and its skills
skim pack --env work -o work-skills.tar.gz
```

### skim unpack

```
skim unpack <archive> [--force]
```

Import a skim pack archive into the current machine's `~/.skim` directory.

By default, unpack refuses to overwrite existing skills, environments, or `config.yaml`. Use `--force` to replace only the paths contained in the archive. `unpack` does not restore active deployment state; run `skim activate <env>` after importing.

**Arguments:**
- `archive` — Path to a `.tar.gz` archive created by `skim pack`

**Flags:**
- `--force` — Overwrite archive-owned skills, environments, and config

**Example:**

```bash
skim unpack work-skills.tar.gz
skim activate work
```

### skim status

```
skim status
```

Display current skim status including:
- Active environment
- Number of skills in the store
- Agent availability

### skim completion

```
skim completion [bash|zsh|fish|powershell]
```

Generate shell completion scripts.

**Examples:**

```bash
# Bash
skim completion bash > /etc/bash_completion.d/skim

# Zsh
skim completion zsh > "${fpath[1]}/_skim"

# Fish
skim completion fish > ~/.config/fish/completions/skim.fish
```

---

## Environment Commands

### skim env list

```
skim env list
```

List all environments. The active environment is marked with `*`.

### skim env create

```
skim env create <name>
```

Create a new environment.

**Arguments:**
- `name` — Name for the new environment

**Example:**

```bash
skim env create work
```

### skim env remove

```
skim env remove <name>
```

Remove an environment. Cannot remove the currently active environment.

**Arguments:**
- `name` — Name of the environment to remove

---

## Activation Commands

### skim activate

```
skim activate <env>
```

Activate an environment, deploying its skills to all enabled agents.

**Arguments:**
- `env` — Name of the environment to activate

**Example:**

```bash
skim activate work
```

### skim deactivate

```
skim deactivate
```

Deactivate the current environment, removing managed skills from all agents.

---

## Skill Commands

### skim skill list

```
skim skill list
```

List all skills in the global store.

### skim skill add

```
skim skill add <path>
```

Add a skill from a local path to the global store.

**Arguments:**
- `path` — Path to the skill file or directory

**Example:**

```bash
skim skill add ./my-custom-skill
```

### skim skill remove

```
skim skill remove <name>
```

Remove a skill from the global store.

**Arguments:**
- `name` — Name of the skill to remove

### skim skill enable

```
skim skill enable <name> [--env <env>]
```

Enable a skill in an environment.

**Arguments:**
- `name` — Name of the skill to enable

**Flags:**
- `--env` — Target environment (defaults to active environment)

**Example:**

```bash
skim skill enable my-skill --env work
```

### skim skill disable

```
skim skill disable <name> [--env <env>]
```

Disable a skill in an environment.

**Arguments:**
- `name` — Name of the skill to disable

**Flags:**
- `--env` — Target environment (defaults to active environment)

---

## Agent Commands

### skim agent list

```
skim agent list
```

List all supported agents and their installation status.

Output includes:
- Agent ID
- Skill directory path
- Availability status
- Number of installed skills

### skim agent scan

```
skim agent scan
```

Scan all installed agents and import existing skills to the global store.

This is useful when you have existing skills in agent directories that you want to manage with skim.

**Output:**
- Number of skills imported
- Number of skills skipped (already in store)
- Any warnings or errors
