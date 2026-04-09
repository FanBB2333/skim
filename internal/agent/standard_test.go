package agent

import (
	"os"
	"path/filepath"
	"testing"
)

func TestStandardAgentListSkillsIncludesSymlinkedSkills(t *testing.T) {
	skillsDir := t.TempDir()
	storeSkillDir := filepath.Join(t.TempDir(), "demo-skill")

	mustMkdirAll(t, storeSkillDir)
	writeSkillMD(t, storeSkillDir, "demo-skill")
	writeMarker(t, storeSkillDir)

	if err := os.Symlink(storeSkillDir, filepath.Join(skillsDir, "demo-skill")); err != nil {
		t.Fatalf("symlink skill dir: %v", err)
	}

	ag := NewStandardAgent("QoderWork", "qoderwork", skillsDir)
	refs, err := ag.ListSkills()
	if err != nil {
		t.Fatalf("list skills: %v", err)
	}

	if len(refs) != 1 {
		t.Fatalf("expected 1 skill, got %d", len(refs))
	}
	if refs[0].Name != "demo-skill" {
		t.Fatalf("expected demo-skill, got %q", refs[0].Name)
	}
	if !refs[0].IsManaged {
		t.Fatalf("expected symlinked skill to be treated as managed")
	}
}

func TestStandardAgentListSkillsSkipsHiddenAndBackupEntries(t *testing.T) {
	skillsDir := t.TempDir()

	for _, name := range []string{".backup", "demo-skill.backup", "demo-skill.bak"} {
		dir := filepath.Join(skillsDir, name)
		mustMkdirAll(t, dir)
		writeSkillMD(t, dir, name)
	}

	validDir := filepath.Join(skillsDir, "valid-skill")
	mustMkdirAll(t, validDir)
	writeSkillMD(t, validDir, "valid-skill")

	ag := NewStandardAgent("QoderWork", "qoderwork", skillsDir)
	refs, err := ag.ListSkills()
	if err != nil {
		t.Fatalf("list skills: %v", err)
	}

	if len(refs) != 1 {
		t.Fatalf("expected only 1 valid skill, got %d", len(refs))
	}
	if refs[0].Name != "valid-skill" {
		t.Fatalf("expected valid-skill, got %q", refs[0].Name)
	}
}

func mustMkdirAll(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(path, 0o755); err != nil {
		t.Fatalf("mkdir %s: %v", path, err)
	}
}

func writeSkillMD(t *testing.T, dir, name string) {
	t.Helper()
	content := "---\nname: " + name + "\n---\n\n# " + name + "\n"
	if err := os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte(content), 0o644); err != nil {
		t.Fatalf("write SKILL.md: %v", err)
	}
}

func writeMarker(t *testing.T, dir string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(dir, ".skim-managed"), []byte("managed"), 0o644); err != nil {
		t.Fatalf("write marker: %v", err)
	}
}
