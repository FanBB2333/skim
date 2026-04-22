package tests

import (
	"archive/tar"
	"compress/gzip"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestCLIActivateAndDeactivateWorkflow(t *testing.T) {
	repoRoot := repoRoot(t)
	bin := buildSkimBinary(t, repoRoot)
	home := t.TempDir()

	mustMkdirAll(t, filepath.Join(home, ".codex"))
	mustMkdirAll(t, filepath.Join(home, ".claude"))
	mustMkdirAll(t, filepath.Join(home, ".gemini"))

	runSkim(t, repoRoot, bin, home, "init")
	runSkim(t, repoRoot, bin, home, "add", fixturePath(t, "demo-skill"))
	runSkim(t, repoRoot, bin, home, "env", "create", "work")
	runSkim(t, repoRoot, bin, home, "skill", "enable", "demo-skill", "--env", "work")
	runSkim(t, repoRoot, bin, home, "activate", "work")

	assertFileExists(t, filepath.Join(home, ".codex", "skills", "demo-skill", "SKILL.md"))
	assertFileExists(t, filepath.Join(home, ".claude", "skills", "demo-skill", "SKILL.md"))
	assertSymlink(t, filepath.Join(home, ".codex", "skills", "demo-skill"))
	assertSymlink(t, filepath.Join(home, ".claude", "skills", "demo-skill"))

	geminiContent := readFile(t, filepath.Join(home, ".gemini", "GEMINI.md"))
	if !strings.Contains(geminiContent, "<!-- skim:skill:demo-skill:begin -->") {
		t.Fatalf("expected GEMINI.md to contain managed demo-skill block, got:\n%s", geminiContent)
	}

	stateContent := readFile(t, filepath.Join(home, ".skim", "state.yaml"))
	if !strings.Contains(stateContent, "active_env: work") {
		t.Fatalf("expected state.yaml to record active environment, got:\n%s", stateContent)
	}

	runSkim(t, repoRoot, bin, home, "deactivate")

	assertPathMissing(t, filepath.Join(home, ".codex", "skills", "demo-skill"))
	assertPathMissing(t, filepath.Join(home, ".claude", "skills", "demo-skill"))

	geminiContent = readFile(t, filepath.Join(home, ".gemini", "GEMINI.md"))
	if strings.Contains(geminiContent, "demo-skill") {
		t.Fatalf("expected GEMINI.md managed section to be removed, got:\n%s", geminiContent)
	}
}

func TestCLIScanImportsUnmanagedSkill(t *testing.T) {
	repoRoot := repoRoot(t)
	bin := buildSkimBinary(t, repoRoot)
	home := t.TempDir()

	runSkim(t, repoRoot, bin, home, "init")

	mustMkdirAll(t, filepath.Join(home, ".codex", "skills", "local-skill"))
	writeFile(t, filepath.Join(home, ".codex", "skills", "local-skill", "SKILL.md"), `---
name: local-skill
description: Imported from a simulated agent directory.
version: 0.1.0
---

# Local Skill
`)

	runSkim(t, repoRoot, bin, home, "agent", "scan")

	storeSkill := filepath.Join(home, ".skim", "store", "local-skill", "SKILL.md")
	assertFileExists(t, storeSkill)

	content := readFile(t, storeSkill)
	if !strings.Contains(content, "Imported from a simulated agent directory.") {
		t.Fatalf("expected imported skill to be copied into store, got:\n%s", content)
	}
}

func TestCLIActivateWithHardlinkStrategy(t *testing.T) {
	repoRoot := repoRoot(t)
	bin := buildSkimBinary(t, repoRoot)
	home := t.TempDir()

	mustMkdirAll(t, filepath.Join(home, ".codex"))

	runSkim(t, repoRoot, bin, home, "init")
	configPath := filepath.Join(home, ".skim", "config.yaml")
	configContent := readFile(t, configPath)
	configContent = strings.Replace(configContent, "link_strategy: symlink", "link_strategy: hardlink", 1)
	writeFile(t, configPath, configContent)

	runSkim(t, repoRoot, bin, home, "add", fixturePath(t, "demo-skill"))
	runSkim(t, repoRoot, bin, home, "env", "create", "hardlink-env")
	runSkim(t, repoRoot, bin, home, "skill", "enable", "demo-skill", "--env", "hardlink-env")
	runSkim(t, repoRoot, bin, home, "activate", "hardlink-env")

	dstDir := filepath.Join(home, ".codex", "skills", "demo-skill")
	fi, err := os.Lstat(dstDir)
	if err != nil {
		t.Fatalf("lstat %s: %v", dstDir, err)
	}
	if fi.Mode()&os.ModeSymlink != 0 {
		t.Fatalf("expected %s to be a real directory under hardlink strategy", dstDir)
	}

	assertSameFile(t,
		filepath.Join(home, ".skim", "store", "demo-skill", "SKILL.md"),
		filepath.Join(home, ".codex", "skills", "demo-skill", "SKILL.md"),
	)
}

func TestCLIInitCreatesBaseSnapshotEnvironment(t *testing.T) {
	repoRoot := repoRoot(t)
	bin := buildSkimBinary(t, repoRoot)
	home := t.TempDir()

	mustMkdirAll(t, filepath.Join(home, ".codex", "skills", "local-skill"))
	writeFile(t, filepath.Join(home, ".codex", "skills", "local-skill", "SKILL.md"), `---
name: local-skill
description: Imported from codex during init.
---

# Local Skill
`)

	mustMkdirAll(t, filepath.Join(home, ".claude", "skills", "team-skill"))
	writeFile(t, filepath.Join(home, ".claude", "skills", "team-skill", "SKILL.md"), `---
name: team-skill
description: Imported from claude during init.
---

# Team Skill
`)

	runSkim(t, repoRoot, bin, home, "init")

	assertFileExists(t, filepath.Join(home, ".skim", "store", "local-skill", "SKILL.md"))
	assertFileExists(t, filepath.Join(home, ".skim", "store", "team-skill", "SKILL.md"))

	baseEnv := readFile(t, filepath.Join(home, ".skim", "envs", "base.yaml"))
	if !strings.Contains(baseEnv, "name: base") {
		t.Fatalf("expected base environment to be created, got:\n%s", baseEnv)
	}
	if !strings.Contains(baseEnv, "- local-skill") || !strings.Contains(baseEnv, "- team-skill") {
		t.Fatalf("expected base environment to snapshot current agent skills, got:\n%s", baseEnv)
	}
}

func TestCLIInstallTargetsSpecificAgentWithSymlink(t *testing.T) {
	repoRoot := repoRoot(t)
	bin := buildSkimBinary(t, repoRoot)
	home := t.TempDir()

	mustMkdirAll(t, filepath.Join(home, ".qoder"))

	runSkim(t, repoRoot, bin, home, "init")
	runSkim(t, repoRoot, bin, home, "install", "-t", "qoder", fixturePath(t, "demo-skill"))

	assertFileExists(t, filepath.Join(home, ".skim", "store", "demo-skill", "SKILL.md"))
	assertSymlink(t, filepath.Join(home, ".qoder", "skills", "demo-skill"))
	assertPathMissing(t, filepath.Join(home, ".codex", "skills", "demo-skill"))
}

func TestCLIAddDereferencesSymlinkedSkillAssets(t *testing.T) {
	repoRoot := repoRoot(t)
	bin := buildSkimBinary(t, repoRoot)
	home := t.TempDir()

	external := filepath.Join(home, "external")
	mustMkdirAll(t, filepath.Join(external, "prompts"))
	writeFile(t, filepath.Join(external, "shared.md"), "# Shared File\n")
	writeFile(t, filepath.Join(external, "prompts", "prompt.md"), "# Linked Prompt\n")

	skillDir := filepath.Join(home, "linked-skill")
	mustMkdirAll(t, skillDir)
	writeFile(t, filepath.Join(skillDir, "SKILL.md"), `---
name: linked-skill
description: Skill with linked assets.
---

# Linked Skill
`)
	mustSymlink(t, filepath.Join(external, "shared.md"), filepath.Join(skillDir, "shared.md"))
	mustSymlink(t, filepath.Join(external, "prompts"), filepath.Join(skillDir, "prompts"))

	runSkim(t, repoRoot, bin, home, "init")
	runSkim(t, repoRoot, bin, home, "add", skillDir)

	storeSkill := filepath.Join(home, ".skim", "store", "linked-skill")
	assertFileExists(t, filepath.Join(storeSkill, "shared.md"))
	assertFileExists(t, filepath.Join(storeSkill, "prompts", "prompt.md"))
	assertNotSymlink(t, filepath.Join(storeSkill, "shared.md"))
	assertNotSymlink(t, filepath.Join(storeSkill, "prompts"))
}

func TestCLIPackUnpackMigratesSkillsWithSymlinks(t *testing.T) {
	repoRoot := repoRoot(t)
	bin := buildSkimBinary(t, repoRoot)
	sourceHome := t.TempDir()
	targetHome := t.TempDir()
	archivePath := filepath.Join(t.TempDir(), "portable-skim.tar.gz")

	mustMkdirAll(t, filepath.Join(sourceHome, ".codex"))
	mustMkdirAll(t, filepath.Join(targetHome, ".codex"))

	external := filepath.Join(sourceHome, "external")
	mustMkdirAll(t, filepath.Join(external, "prompts"))
	writeFile(t, filepath.Join(external, "shared.md"), "# Shared File\n")
	writeFile(t, filepath.Join(external, "prompts", "prompt.md"), "# Linked Prompt\n")

	runSkim(t, repoRoot, bin, sourceHome, "init")

	storeSkill := filepath.Join(sourceHome, ".skim", "store", "portable-skill")
	mustMkdirAll(t, storeSkill)
	writeFile(t, filepath.Join(storeSkill, "SKILL.md"), `---
name: portable-skill
description: Skill with linked runtime assets.
version: 1.0.0
---

# Portable Skill
`)
	mustSymlink(t, filepath.Join(external, "shared.md"), filepath.Join(storeSkill, "shared.md"))
	mustSymlink(t, filepath.Join(external, "prompts"), filepath.Join(storeSkill, "prompts"))

	runSkim(t, repoRoot, bin, sourceHome, "env", "create", "portable")
	runSkim(t, repoRoot, bin, sourceHome, "skill", "enable", "portable-skill", "--env", "portable")
	runSkim(t, repoRoot, bin, sourceHome, "pack", "--env", "portable", "-o", archivePath)

	manifest := readTarFile(t, archivePath, "manifest.yaml")
	if !strings.Contains(manifest, "format: skim-pack-v1") {
		t.Fatalf("expected manifest to include pack format, got:\n%s", manifest)
	}
	if !strings.Contains(manifest, "packed_at:") {
		t.Fatalf("expected manifest to include packed_at, got:\n%s", manifest)
	}
	if !strings.Contains(manifest, "symlink_mode: dereference") {
		t.Fatalf("expected manifest to record symlink dereference mode, got:\n%s", manifest)
	}

	runSkim(t, repoRoot, bin, targetHome, "unpack", archivePath)
	runSkim(t, repoRoot, bin, targetHome, "activate", "portable")

	unpackedSkill := filepath.Join(targetHome, ".skim", "store", "portable-skill")
	assertFileExists(t, filepath.Join(unpackedSkill, "shared.md"))
	assertFileExists(t, filepath.Join(unpackedSkill, "prompts", "prompt.md"))
	assertNotSymlink(t, filepath.Join(unpackedSkill, "shared.md"))
	assertNotSymlink(t, filepath.Join(unpackedSkill, "prompts"))

	sharedContent := readFile(t, filepath.Join(unpackedSkill, "shared.md"))
	if !strings.Contains(sharedContent, "Shared File") {
		t.Fatalf("expected dereferenced file content, got:\n%s", sharedContent)
	}
	promptContent := readFile(t, filepath.Join(unpackedSkill, "prompts", "prompt.md"))
	if !strings.Contains(promptContent, "Linked Prompt") {
		t.Fatalf("expected dereferenced directory content, got:\n%s", promptContent)
	}

	assertFileExists(t, filepath.Join(targetHome, ".codex", "skills", "portable-skill", "shared.md"))
}

func TestCLIPackEnvIncludesOnlySelectedEnvironmentSkills(t *testing.T) {
	repoRoot := repoRoot(t)
	bin := buildSkimBinary(t, repoRoot)
	home := t.TempDir()
	archivePath := filepath.Join(t.TempDir(), "selected.tar.gz")

	runSkim(t, repoRoot, bin, home, "init")
	runSkim(t, repoRoot, bin, home, "add", fixturePath(t, "demo-skill"))

	otherSkill := filepath.Join(home, "other-skill")
	mustMkdirAll(t, otherSkill)
	writeFile(t, filepath.Join(otherSkill, "SKILL.md"), `---
name: other-skill
description: Should not be packed for the selected environment.
---

# Other Skill
`)
	runSkim(t, repoRoot, bin, home, "add", otherSkill)

	runSkim(t, repoRoot, bin, home, "env", "create", "selected")
	runSkim(t, repoRoot, bin, home, "skill", "enable", "demo-skill", "--env", "selected")
	runSkim(t, repoRoot, bin, home, "env", "create", "other")
	runSkim(t, repoRoot, bin, home, "skill", "enable", "other-skill", "--env", "other")

	runSkim(t, repoRoot, bin, home, "pack", "--env", "selected", "-o", archivePath)

	manifest := readTarFile(t, archivePath, "manifest.yaml")
	if !strings.Contains(manifest, "environment: selected") {
		t.Fatalf("expected selected environment in manifest, got:\n%s", manifest)
	}
	if !strings.Contains(manifest, "- demo-skill") {
		t.Fatalf("expected demo-skill in selected pack manifest, got:\n%s", manifest)
	}
	if strings.Contains(manifest, "other-skill") || strings.Contains(manifest, "- other") {
		t.Fatalf("expected selected pack to exclude unrelated skill/env, got:\n%s", manifest)
	}
}

func TestCLIUnpackRefusesOverwriteUnlessForce(t *testing.T) {
	repoRoot := repoRoot(t)
	bin := buildSkimBinary(t, repoRoot)
	sourceHome := t.TempDir()
	targetHome := t.TempDir()
	archivePath := filepath.Join(t.TempDir(), "overwrite.tar.gz")

	runSkim(t, repoRoot, bin, sourceHome, "init")
	runSkim(t, repoRoot, bin, sourceHome, "add", fixturePath(t, "demo-skill"))
	runSkim(t, repoRoot, bin, sourceHome, "env", "create", "portable")
	runSkim(t, repoRoot, bin, sourceHome, "skill", "enable", "demo-skill", "--env", "portable")
	runSkim(t, repoRoot, bin, sourceHome, "pack", "--env", "portable", "-o", archivePath)

	staleSkill := filepath.Join(targetHome, ".skim", "store", "demo-skill")
	mustMkdirAll(t, staleSkill)
	writeFile(t, filepath.Join(staleSkill, "SKILL.md"), "# stale\n")

	output, err := runSkimError(t, repoRoot, bin, targetHome, "unpack", archivePath)
	if err == nil {
		t.Fatalf("expected unpack to reject existing skill, got success:\n%s", output)
	}
	if !strings.Contains(output, "already exists") {
		t.Fatalf("expected overwrite error, got:\n%s", output)
	}
	assertPathMissing(t, filepath.Join(targetHome, ".skim", "config.yaml"))
	staleContent := readFile(t, filepath.Join(staleSkill, "SKILL.md"))
	if !strings.Contains(staleContent, "# stale") {
		t.Fatalf("expected failed unpack to preserve stale skill, got:\n%s", staleContent)
	}

	runSkim(t, repoRoot, bin, targetHome, "unpack", archivePath, "--force")
	importedContent := readFile(t, filepath.Join(staleSkill, "SKILL.md"))
	if !strings.Contains(importedContent, "Demo Skill") {
		t.Fatalf("expected forced unpack to replace stale skill, got:\n%s", importedContent)
	}
}

func buildSkimBinary(t *testing.T, repoRoot string) string {
	t.Helper()

	bin := filepath.Join(t.TempDir(), "skim")
	cmd := exec.Command("go", "build", "-o", bin, "./cmd/skim")
	cmd.Dir = repoRoot
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("build skim binary: %v\n%s", err, output)
	}
	return bin
}

func runSkim(t *testing.T, repoRoot, bin, home string, args ...string) string {
	t.Helper()

	cmd := exec.Command(bin, args...)
	cmd.Dir = repoRoot
	cmd.Env = append(os.Environ(), "HOME="+home)
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("run skim %v: %v\n%s", args, err, output)
	}
	return string(output)
}

func runSkimError(t *testing.T, repoRoot, bin, home string, args ...string) (string, error) {
	t.Helper()

	cmd := exec.Command(bin, args...)
	cmd.Dir = repoRoot
	cmd.Env = append(os.Environ(), "HOME="+home)
	output, err := cmd.CombinedOutput()
	return string(output), err
}

func repoRoot(t *testing.T) string {
	t.Helper()

	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("failed to resolve current file path")
	}
	return filepath.Dir(filepath.Dir(file))
}

func fixturePath(t *testing.T, name string) string {
	t.Helper()
	return filepath.Join(repoRoot(t), "tests", "fixtures", name)
}

func assertFileExists(t *testing.T, path string) {
	t.Helper()
	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("expected %s to exist: %v", path, err)
	}
	if info.IsDir() {
		t.Fatalf("expected %s to be a file, got directory", path)
	}
}

func assertSymlink(t *testing.T, path string) {
	t.Helper()
	info, err := os.Lstat(path)
	if err != nil {
		t.Fatalf("lstat %s: %v", path, err)
	}
	if info.Mode()&os.ModeSymlink == 0 {
		t.Fatalf("expected %s to be a symlink", path)
	}
}

func assertNotSymlink(t *testing.T, path string) {
	t.Helper()
	info, err := os.Lstat(path)
	if err != nil {
		t.Fatalf("lstat %s: %v", path, err)
	}
	if info.Mode()&os.ModeSymlink != 0 {
		t.Fatalf("expected %s to be a real filesystem entry, got symlink", path)
	}
}

func assertSameFile(t *testing.T, src, dst string) {
	t.Helper()
	srcInfo, err := os.Stat(src)
	if err != nil {
		t.Fatalf("stat %s: %v", src, err)
	}
	dstInfo, err := os.Stat(dst)
	if err != nil {
		t.Fatalf("stat %s: %v", dst, err)
	}
	if !os.SameFile(srcInfo, dstInfo) {
		t.Fatalf("expected %s and %s to be hardlinked to the same file", src, dst)
	}
}

func assertPathMissing(t *testing.T, path string) {
	t.Helper()
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatalf("expected %s to be removed, got err=%v", path, err)
	}
}

func mustMkdirAll(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(path, 0o755); err != nil {
		t.Fatalf("mkdir %s: %v", path, err)
	}
}

func writeFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}

func mustSymlink(t *testing.T, oldname, newname string) {
	t.Helper()
	if err := os.Symlink(oldname, newname); err != nil {
		t.Fatalf("symlink %s -> %s: %v", newname, oldname, err)
	}
}

func readFile(t *testing.T, path string) string {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	return string(data)
}

func readTarFile(t *testing.T, archivePath, name string) string {
	t.Helper()

	f, err := os.Open(archivePath)
	if err != nil {
		t.Fatalf("open archive %s: %v", archivePath, err)
	}
	defer f.Close()

	gzr, err := gzip.NewReader(f)
	if err != nil {
		t.Fatalf("open gzip reader for %s: %v", archivePath, err)
	}
	defer gzr.Close()

	tr := tar.NewReader(gzr)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatalf("read tar %s: %v", archivePath, err)
		}
		if hdr.Name != name {
			continue
		}
		data, err := io.ReadAll(tr)
		if err != nil {
			t.Fatalf("read %s from %s: %v", name, archivePath, err)
		}
		return string(data)
	}

	t.Fatalf("expected %s in archive %s", name, archivePath)
	return ""
}
