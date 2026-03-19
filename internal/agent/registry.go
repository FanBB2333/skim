package agent

import (
	"github.com/FanBB2333/skim/internal/config"
	"github.com/FanBB2333/skim/internal/model"
)

// Registry holds all known agents and provides lookup.
type Registry struct {
	agents []Agent
}

// NewRegistry creates a Registry from the config, instantiating appropriate agent types.
func NewRegistry(cfg model.Config) *Registry {
	var agents []Agent
	for id, ac := range cfg.Agents {
		if !ac.Enabled {
			continue
		}
		dir := config.ExpandHome(ac.SkillDir)
		switch ac.Format {
		case "gemini":
			agents = append(agents, NewGeminiAgent(dir))
		default:
			name := agentDisplayName(id)
			agents = append(agents, NewStandardAgent(name, id, dir))
		}
	}
	return &Registry{agents: agents}
}

// All returns all registered agents.
func (r *Registry) All() []Agent {
	return r.agents
}

// Available returns only agents that are installed on this machine.
func (r *Registry) Available() []Agent {
	var avail []Agent
	for _, a := range r.agents {
		if a.IsAvailable() {
			avail = append(avail, a)
		}
	}
	return avail
}

// Get returns an agent by ID.
func (r *Registry) Get(id string) Agent {
	for _, a := range r.agents {
		if a.ID() == id {
			return a
		}
	}
	return nil
}

func agentDisplayName(id string) string {
	names := map[string]string{
		"claude":    "Claude Code",
		"codex":     "Codex",
		"qoder":     "Qoder",
		"qoderwork": "QoderWork",
	}
	if n, ok := names[id]; ok {
		return n
	}
	return id
}
