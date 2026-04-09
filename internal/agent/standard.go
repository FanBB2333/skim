package agent

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/FanBB2333/skim/internal/linker"
	"github.com/FanBB2333/skim/internal/model"
)

// StandardAgent handles agents that use the {skillDir}/{skillName}/SKILL.md layout.
// This covers Claude, Codex, Qoder, and QoderWork.
type StandardAgent struct {
	name     string // display name
	id       string // machine identifier
	skillDir string // absolute path to the skills directory
}

func NewStandardAgent(name, id, skillDir string) *StandardAgent {
	return &StandardAgent{name: name, id: id, skillDir: skillDir}
}

func (a *StandardAgent) Name() string     { return a.name }
func (a *StandardAgent) ID() string       { return a.id }
func (a *StandardAgent) SkillDir() string { return a.skillDir }

func (a *StandardAgent) IsAvailable() bool {
	// Check if the parent directory exists (e.g., ~/.claude/ for ~/.claude/skills/)
	parent := filepath.Dir(a.skillDir)
	_, err := os.Stat(parent)
	return err == nil
}

func (a *StandardAgent) ListSkills() ([]model.SkillRef, error) {
	entries, err := os.ReadDir(a.skillDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var refs []model.SkillRef
	for _, e := range entries {
		name := e.Name()
		if shouldSkipSkillEntry(name) {
			continue
		}

		skillPath := filepath.Join(a.skillDir, name)
		info, err := os.Stat(skillPath)
		if err != nil || !info.IsDir() {
			continue
		}

		// Check for SKILL.md
		if _, err := os.Stat(filepath.Join(skillPath, "SKILL.md")); err != nil {
			continue
		}
		managed := false
		if _, err := os.Stat(filepath.Join(skillPath, ".skim-managed")); err == nil {
			managed = true
		}
		refs = append(refs, model.SkillRef{
			Name:      name,
			Path:      skillPath,
			IsManaged: managed,
		})
	}
	return refs, nil
}

func shouldSkipSkillEntry(name string) bool {
	if name == "" {
		return true
	}
	if strings.HasPrefix(name, ".") {
		return true
	}

	lower := strings.ToLower(name)
	if lower == "backup" {
		return true
	}

	for _, suffix := range []string{".backup", ".bak", ".tmp", ".temp", ".orig", "~"} {
		if strings.HasSuffix(lower, suffix) {
			return true
		}
	}

	return false
}

func (a *StandardAgent) InstallSkill(skill model.Skill, lnk linker.Linker) error {
	dst := filepath.Join(a.skillDir, skill.Name)

	// If the destination already exists, check if it's skim-managed
	if _, err := os.Stat(dst); err == nil {
		managed, err := lnk.IsManaged(dst)
		if err != nil {
			return fmt.Errorf("check managed status of %s: %w", dst, err)
		}
		if !managed {
			return fmt.Errorf("skill %q already exists in %s and was not placed by skim (use --force to overwrite)", skill.Name, a.name)
		}
		// Remove old managed version before re-deploying
		if err := lnk.UnlinkDir(dst); err != nil {
			return fmt.Errorf("remove old version: %w", err)
		}
	}

	// Ensure skill directory exists
	if err := os.MkdirAll(a.skillDir, 0o755); err != nil {
		return err
	}

	return lnk.LinkDir(skill.StorePath, dst)
}

func (a *StandardAgent) RemoveSkill(skillName string, lnk linker.Linker) error {
	dst := filepath.Join(a.skillDir, skillName)

	if _, err := os.Stat(dst); os.IsNotExist(err) {
		return nil // already gone, fine
	}

	managed, err := lnk.IsManaged(dst)
	if err != nil {
		return err
	}
	if !managed {
		return fmt.Errorf("skill %q in %s was not placed by skim, refusing to remove", skillName, a.name)
	}

	return lnk.UnlinkDir(dst)
}
