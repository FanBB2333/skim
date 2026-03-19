package agent

import (
	"github.com/FanBB2333/skim/internal/linker"
	"github.com/FanBB2333/skim/internal/model"
)

// Agent abstracts a coding agent framework's skill directory.
type Agent interface {
	// Name returns a human-readable display name.
	Name() string

	// ID returns a machine identifier (e.g., "claude", "gemini").
	ID() string

	// SkillDir returns the resolved absolute path to the agent's skill directory.
	SkillDir() string

	// IsAvailable returns true if the agent is installed on this machine.
	IsAvailable() bool

	// ListSkills enumerates skills currently in the agent's directory.
	ListSkills() ([]model.SkillRef, error)

	// InstallSkill places a skill into the agent's directory using the linker.
	InstallSkill(skill model.Skill, lnk linker.Linker) error

	// RemoveSkill removes a skim-managed skill from the agent's directory.
	RemoveSkill(skillName string, lnk linker.Linker) error
}
