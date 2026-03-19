package model

type Config struct {
	Version      int                    `yaml:"version"`
	LinkStrategy string                 `yaml:"link_strategy"`
	Agents       map[string]AgentConfig `yaml:"agents"`
}

type AgentConfig struct {
	SkillDir string `yaml:"skill_dir"`
	Enabled  bool   `yaml:"enabled"`
	Format   string `yaml:"format"` // "standard" or "gemini"
}

func DefaultConfig() Config {
	return Config{
		Version:      1,
		LinkStrategy: "copy",
		Agents: map[string]AgentConfig{
			"claude":    {SkillDir: "~/.claude/skills", Enabled: true, Format: "standard"},
			"codex":     {SkillDir: "~/.codex/skills", Enabled: true, Format: "standard"},
			"gemini":    {SkillDir: "~/.gemini", Enabled: true, Format: "gemini"},
			"qoder":     {SkillDir: "~/.qoder/skills", Enabled: true, Format: "standard"},
			"qoderwork": {SkillDir: "~/.qoderwork/skills", Enabled: true, Format: "standard"},
		},
	}
}
