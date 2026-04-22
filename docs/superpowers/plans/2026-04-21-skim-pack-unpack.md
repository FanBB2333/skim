# skim Pack/Unpack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `skim pack` and `skim unpack` for portable migration of skim-managed skill environments.

**Architecture:** Add core pack/unpack logic in `internal/core/pack.go`, expose it through `core.Service`, and register CLI commands in `internal/cli/pack.go`. Use Go standard library `archive/tar` and `compress/gzip`; dereference symlinks during pack so archives are portable.

**Tech Stack:** Go, Cobra, YAML, tar.gz archives, existing black-box CLI tests.

---

### Task 1: CLI Workflow Test

**Files:**
- Modify: `tests/cli_workflow_test.go`

- [ ] **Step 1: Write the failing migration test**

Add a test that creates a source HOME, adds a skill containing symlinked file and directory entries, packs it, unpacks into a second HOME, and activates the imported environment.

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./tests -run TestCLIPackUnpackMigratesSkillsWithSymlinks -count=1`

Expected: FAIL because `skim pack` is not registered.

- [ ] **Step 3: Keep the test unchanged while implementing**

The production code must satisfy the test without weakening its assertions.

### Task 2: Core Pack/Unpack

**Files:**
- Create: `internal/core/pack.go`
- Modify: `internal/core/service.go`

- [ ] **Step 1: Add `PackManager` and manifest types**

Create `PackManager` with `Pack` and `Unpack` methods. Add manifest fields for format, format version, skim version, packed time, scope, environment, skills, envs, symlink mode, and symlink records.

- [ ] **Step 2: Implement tar.gz writing**

Use `archive/tar` and `compress/gzip`. Walk selected store/env/config paths. For symlinks, resolve and archive target content as regular entries.

- [ ] **Step 3: Implement safe unpack**

Extract archive to a temporary directory, validate paths stay inside the temp directory, validate manifest format, and copy archive paths into `~/.skim`. Refuse overwrite unless `Force` is true.

- [ ] **Step 4: Wire manager into `Service`**

Add `Pack *PackManager` to `core.Service` and initialize it in `NewService`.

### Task 3: CLI Commands

**Files:**
- Create: `internal/cli/pack.go`
- Modify: `internal/cli/root.go`

- [ ] **Step 1: Add `pack` command**

Register `skim pack`, with `-o/--output` and `--env` flags. Print the archive path and packed counts.

- [ ] **Step 2: Add `unpack` command**

Register `skim unpack <archive>`, with `--force`. Print imported counts and a reminder to activate an environment.

### Task 4: Docs and Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/commands.md`

- [ ] **Step 1: Document commands**

Add concise command entries and examples for pack/unpack.

- [ ] **Step 2: Run full verification**

Run: `go test ./...`

Expected: PASS.
