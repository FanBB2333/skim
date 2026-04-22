package agent

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/FanBB2333/skim/internal/model"
)

func TestGeminiRemoveSkillStripsAllOrphanedSections(t *testing.T) {
	baseDir := t.TempDir()
	// Simulate a GEMINI.md that accumulated duplicate sections for the same
	// skill (e.g. because of a prior crashed write). Remove must strip every
	// instance, not just the first, so re-installing doesn't keep stacking.
	content := "# header\n\n" +
		managedBegin + "\n" +
		skillBeginTag("demo") + "\nalpha\n" + skillEndTag("demo") + "\n" +
		skillBeginTag("other") + "\nkeep me\n" + skillEndTag("other") + "\n" +
		skillBeginTag("demo") + "\nbeta\n" + skillEndTag("demo") + "\n" +
		managedEnd + "\n"

	if err := os.WriteFile(filepath.Join(baseDir, "GEMINI.md"), []byte(content), 0o644); err != nil {
		t.Fatalf("write GEMINI.md: %v", err)
	}

	ag := NewGeminiAgent(baseDir)
	if err := ag.RemoveSkill("demo", nil); err != nil {
		t.Fatalf("RemoveSkill: %v", err)
	}

	got, err := os.ReadFile(filepath.Join(baseDir, "GEMINI.md"))
	if err != nil {
		t.Fatalf("read GEMINI.md: %v", err)
	}
	out := string(got)

	if strings.Contains(out, skillBeginTag("demo")) {
		t.Fatalf("expected all demo sections removed, got:\n%s", out)
	}
	if !strings.Contains(out, skillBeginTag("other")) {
		t.Fatalf("expected unrelated sections preserved, got:\n%s", out)
	}
}

func TestGeminiInstallThenRemoveIsIdempotent(t *testing.T) {
	baseDir := t.TempDir()
	storeDir := filepath.Join(t.TempDir(), "demo")
	if err := os.MkdirAll(storeDir, 0o755); err != nil {
		t.Fatalf("mkdir store: %v", err)
	}
	if err := os.WriteFile(filepath.Join(storeDir, "SKILL.md"), []byte("# demo body"), 0o644); err != nil {
		t.Fatalf("write SKILL.md: %v", err)
	}

	ag := NewGeminiAgent(baseDir)
	skill := model.Skill{Name: "demo", StorePath: storeDir}

	if err := ag.InstallSkill(skill, nil); err != nil {
		t.Fatalf("install: %v", err)
	}
	// Install again — must not produce a second copy of the same section.
	if err := ag.InstallSkill(skill, nil); err != nil {
		t.Fatalf("install (2nd): %v", err)
	}

	got, err := os.ReadFile(filepath.Join(baseDir, "GEMINI.md"))
	if err != nil {
		t.Fatalf("read GEMINI.md: %v", err)
	}
	count := strings.Count(string(got), skillBeginTag("demo"))
	if count != 1 {
		t.Fatalf("expected exactly one demo begin tag, got %d:\n%s", count, got)
	}

	if err := ag.RemoveSkill("demo", nil); err != nil {
		t.Fatalf("remove: %v", err)
	}
	got, _ = os.ReadFile(filepath.Join(baseDir, "GEMINI.md"))
	if strings.Contains(string(got), "demo") {
		t.Fatalf("expected demo removed, got:\n%s", got)
	}
}
