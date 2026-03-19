package model

// Skill represents a skill stored in the global store.
type Skill struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description,omitempty"`
	Version     string `yaml:"version,omitempty"`
	StorePath   string `yaml:"-"` // absolute path in ~/.skim/store/
}

// SkillRef is a lightweight reference to a skill found in an agent directory.
type SkillRef struct {
	Name      string `yaml:"name"`
	Path      string `yaml:"-"`
	IsManaged bool   `yaml:"-"` // placed by skim?
}
