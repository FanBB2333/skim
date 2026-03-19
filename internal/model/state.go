package model

import "time"

// State tracks the current runtime state of skim.
type State struct {
	ActiveEnv     string              `yaml:"active_env,omitempty"`
	ActivatedAt   *time.Time          `yaml:"activated_at,omitempty"`
	ManagedSkills []ManagedSkillEntry `yaml:"managed_skills,omitempty"`
}

// ManagedSkillEntry records a skill deployed to specific agents.
type ManagedSkillEntry struct {
	Skill      string   `yaml:"skill"`
	DeployedTo []string `yaml:"deployed_to"`
}
