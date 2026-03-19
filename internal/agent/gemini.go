package agent

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/FanBB2333/skim/internal/linker"
	"github.com/FanBB2333/skim/internal/model"
)

const (
	managedBegin = "<!-- skim:managed:begin -->"
	managedEnd   = "<!-- skim:managed:end -->"
)

func skillBeginTag(name string) string { return fmt.Sprintf("<!-- skim:skill:%s:begin -->", name) }
func skillEndTag(name string) string   { return fmt.Sprintf("<!-- skim:skill:%s:end -->", name) }

var skillTagRe = regexp.MustCompile(`<!-- skim:skill:([^:]+):begin -->`)

// GeminiAgent manages skills by injecting fenced sections into ~/.gemini/GEMINI.md.
type GeminiAgent struct {
	baseDir string // absolute path to ~/.gemini
}

func NewGeminiAgent(baseDir string) *GeminiAgent {
	return &GeminiAgent{baseDir: baseDir}
}

func (g *GeminiAgent) Name() string     { return "Gemini CLI" }
func (g *GeminiAgent) ID() string       { return "gemini" }
func (g *GeminiAgent) SkillDir() string { return g.baseDir }

func (g *GeminiAgent) IsAvailable() bool {
	_, err := os.Stat(g.baseDir)
	return err == nil
}

func (g *GeminiAgent) geminiMDPath() string {
	return filepath.Join(g.baseDir, "GEMINI.md")
}

func (g *GeminiAgent) ListSkills() ([]model.SkillRef, error) {
	content, err := os.ReadFile(g.geminiMDPath())
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var refs []model.SkillRef
	matches := skillTagRe.FindAllStringSubmatch(string(content), -1)
	for _, m := range matches {
		refs = append(refs, model.SkillRef{
			Name:      m[1],
			Path:      g.geminiMDPath(),
			IsManaged: true,
		})
	}
	return refs, nil
}

func (g *GeminiAgent) InstallSkill(skill model.Skill, _ linker.Linker) error {
	// Read SKILL.md content from the store
	skillContent, err := os.ReadFile(filepath.Join(skill.StorePath, "SKILL.md"))
	if err != nil {
		return fmt.Errorf("read skill content: %w", err)
	}

	// Read existing GEMINI.md
	existing := ""
	if data, err := os.ReadFile(g.geminiMDPath()); err == nil {
		existing = string(data)
	}

	// Build the skill section
	section := skillBeginTag(skill.Name) + "\n" + strings.TrimSpace(string(skillContent)) + "\n" + skillEndTag(skill.Name)

	// Check if a managed block already exists
	if strings.Contains(existing, managedBegin) {
		// Remove any existing section for this skill
		existing = g.removeSkillSection(existing, skill.Name)
		// Insert the new section before the managed end tag
		existing = strings.Replace(existing, managedEnd, section+"\n"+managedEnd, 1)
	} else {
		// Append a new managed block
		if existing != "" && !strings.HasSuffix(existing, "\n") {
			existing += "\n"
		}
		existing += "\n" + managedBegin + "\n" + section + "\n" + managedEnd + "\n"
	}

	return g.atomicWrite(existing)
}

func (g *GeminiAgent) RemoveSkill(skillName string, _ linker.Linker) error {
	data, err := os.ReadFile(g.geminiMDPath())
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	content := string(data)
	content = g.removeSkillSection(content, skillName)

	// If no more skills in managed block, remove the block entirely
	if strings.Contains(content, managedBegin) {
		// Check if block is empty
		beginIdx := strings.Index(content, managedBegin)
		endIdx := strings.Index(content, managedEnd)
		if beginIdx >= 0 && endIdx >= 0 {
			between := strings.TrimSpace(content[beginIdx+len(managedBegin) : endIdx])
			if between == "" {
				// Remove the entire managed block
				before := content[:beginIdx]
				after := content[endIdx+len(managedEnd):]
				content = strings.TrimRight(before, "\n") + after
			}
		}
	}

	return g.atomicWrite(content)
}

func (g *GeminiAgent) removeSkillSection(content, skillName string) string {
	begin := skillBeginTag(skillName)
	end := skillEndTag(skillName)

	beginIdx := strings.Index(content, begin)
	endIdx := strings.Index(content, end)
	if beginIdx < 0 || endIdx < 0 {
		return content
	}

	before := content[:beginIdx]
	after := content[endIdx+len(end):]
	// Clean up extra newline
	if len(after) > 0 && after[0] == '\n' {
		after = after[1:]
	}
	return before + after
}

func (g *GeminiAgent) atomicWrite(content string) error {
	tmpPath := g.geminiMDPath() + ".tmp"
	if err := os.WriteFile(tmpPath, []byte(content), 0o644); err != nil {
		return err
	}
	return os.Rename(tmpPath, g.geminiMDPath())
}
