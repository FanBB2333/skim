package core

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"

	"github.com/FanBB2333/skim/internal/config"
	"github.com/FanBB2333/skim/internal/model"
	"gopkg.in/yaml.v3"
)

// StoreManager manages the global skill store at ~/.skim/store/.
type StoreManager struct{}

func NewStoreManager() *StoreManager {
	return &StoreManager{}
}

func (s *StoreManager) storeDir() string {
	return filepath.Join(config.SkimDir(), "store")
}

// List returns all skills in the global store.
func (s *StoreManager) List() ([]model.Skill, error) {
	dir := s.storeDir()
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var skills []model.Skill
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		skill, err := s.loadSkill(e.Name())
		if err != nil {
			continue // skip malformed skills
		}
		skills = append(skills, skill)
	}
	return skills, nil
}

// Get returns a single skill by name.
func (s *StoreManager) Get(name string) (*model.Skill, error) {
	skill, err := s.loadSkill(name)
	if err != nil {
		return nil, err
	}
	return &skill, nil
}

// Exists checks if a skill exists in the store.
func (s *StoreManager) Exists(name string) bool {
	p := filepath.Join(s.storeDir(), name)
	_, err := os.Stat(p)
	return err == nil
}

// Add copies a skill from a local path into the global store.
func (s *StoreManager) Add(source string) (*model.Skill, error) {
	source, err := filepath.Abs(source)
	if err != nil {
		return nil, err
	}

	// Parse SKILL.md to get the skill name
	meta, err := ParseSkillMD(filepath.Join(source, "SKILL.md"))
	if err != nil {
		return nil, err
	}

	name := meta.Name
	if name == "" {
		name = filepath.Base(source)
	}

	dst := filepath.Join(s.storeDir(), name)
	if err := copyDir(source, dst); err != nil {
		return nil, err
	}

	skill := model.Skill{
		Name:        name,
		Description: meta.Description,
		Version:     meta.Version,
		StorePath:   dst,
	}
	return &skill, nil
}

// Remove deletes a skill from the global store.
func (s *StoreManager) Remove(name string) error {
	return os.RemoveAll(filepath.Join(s.storeDir(), name))
}

func (s *StoreManager) loadSkill(name string) (model.Skill, error) {
	dir := filepath.Join(s.storeDir(), name)
	skillMDPath := filepath.Join(dir, "SKILL.md")

	skill := model.Skill{
		Name:      name,
		StorePath: dir,
	}

	meta, err := ParseSkillMD(skillMDPath)
	if err == nil {
		if meta.Name != "" {
			skill.Name = meta.Name
		}
		skill.Description = meta.Description
		skill.Version = meta.Version
	}

	return skill, nil
}

// SkillMeta holds metadata parsed from SKILL.md YAML frontmatter.
type SkillMeta struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
	Version     string `yaml:"version"`
}

// ParseSkillMD parses the YAML frontmatter from a SKILL.md file.
func ParseSkillMD(path string) (SkillMeta, error) {
	f, err := os.Open(path)
	if err != nil {
		return SkillMeta{}, err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	var inFrontmatter bool
	var yamlLines []string

	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		if trimmed == "---" {
			if !inFrontmatter {
				inFrontmatter = true
				continue
			}
			// End of frontmatter
			break
		}
		if inFrontmatter {
			yamlLines = append(yamlLines, line)
		}
	}

	if len(yamlLines) == 0 {
		return SkillMeta{}, nil
	}

	var meta SkillMeta
	if err := yaml.Unmarshal([]byte(strings.Join(yamlLines, "\n")), &meta); err != nil {
		return SkillMeta{}, err
	}
	return meta, nil
}

// copyDir recursively copies src directory to dst.
func copyDir(src, dst string) error {
	return filepath.WalkDir(src, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}

		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)

		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}

		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, data, 0o644)
	})
}
