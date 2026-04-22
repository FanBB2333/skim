package core

import (
	"fmt"
	"time"

	"github.com/FanBB2333/skim/internal/agent"
	"github.com/FanBB2333/skim/internal/linker"
	"github.com/FanBB2333/skim/internal/model"
)

// Activator orchestrates activating and deactivating environments.
type Activator struct {
	store    *StoreManager
	env      *EnvManager
	state    *StateManager
	registry *agent.Registry
	linker   linker.Linker
}

func NewActivator(store *StoreManager, env *EnvManager, state *StateManager, registry *agent.Registry, lnk linker.Linker) *Activator {
	return &Activator{
		store:    store,
		env:      env,
		state:    state,
		registry: registry,
		linker:   lnk,
	}
}

// ActivateResult holds the result of an activation attempt.
type ActivateResult struct {
	Succeeded int
	Failed    int
	Errors    []string
}

// Activate deploys an environment's skills to all available agents.
func (a *Activator) Activate(envName string) (*ActivateResult, error) {
	// Load current state — deactivate if another env is active
	currentState, err := a.state.Load()
	if err != nil {
		return nil, fmt.Errorf("load state: %w", err)
	}
	if currentState.ActiveEnv != "" {
		if _, err := a.Deactivate(); err != nil {
			return nil, fmt.Errorf("deactivate current env: %w", err)
		}
	}

	// Load the target environment
	envDef, err := a.env.Get(envName)
	if err != nil {
		return nil, fmt.Errorf("load environment %q: %w", envName, err)
	}

	agents := a.registry.Available()
	result := &ActivateResult{}
	var managedSkills []model.ManagedSkillEntry

	for _, skillName := range envDef.Skills {
		skill, err := a.store.Get(skillName)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("skill %q: not found in store", skillName))
			continue
		}

		entry := model.ManagedSkillEntry{Skill: skillName}

		for _, ag := range agents {
			if err := ag.InstallSkill(*skill, a.linker); err != nil {
				result.Failed++
				result.Errors = append(result.Errors, fmt.Sprintf("skill %q -> %s: %s", skillName, ag.Name(), err))
				continue
			}
			entry.DeployedTo = append(entry.DeployedTo, ag.ID())
			result.Succeeded++
		}

		managedSkills = append(managedSkills, entry)
	}

	// Save state
	now := time.Now()
	newState := model.State{
		ActiveEnv:     envName,
		ActivatedAt:   &now,
		ManagedSkills: managedSkills,
	}
	if err := a.state.Save(newState); err != nil {
		return result, fmt.Errorf("save state: %w", err)
	}

	return result, nil
}

// Deactivate removes all skim-managed skills from agents.
// If any removal fails the entries that remain deployed are preserved in state
// so the next deactivate call can retry them, and the active environment is
// kept so subsequent commands still see the partial deployment.
func (a *Activator) Deactivate() (*ActivateResult, error) {
	state, err := a.state.Load()
	if err != nil {
		return nil, fmt.Errorf("load state: %w", err)
	}
	if state.ActiveEnv == "" {
		return nil, fmt.Errorf("no active environment")
	}

	result := &ActivateResult{}
	var remaining []model.ManagedSkillEntry

	for _, entry := range state.ManagedSkills {
		var stillDeployed []string
		for _, agentID := range entry.DeployedTo {
			ag := a.registry.Get(agentID)
			if ag == nil {
				// Agent is no longer registered; we cannot drive cleanup
				// through the removed agent, so drop the reference.
				continue
			}
			if err := ag.RemoveSkill(entry.Skill, a.linker); err != nil {
				result.Failed++
				result.Errors = append(result.Errors, fmt.Sprintf("skill %q from %s: %s", entry.Skill, ag.Name(), err))
				stillDeployed = append(stillDeployed, agentID)
				continue
			}
			result.Succeeded++
		}
		if len(stillDeployed) > 0 {
			remaining = append(remaining, model.ManagedSkillEntry{
				Skill:      entry.Skill,
				DeployedTo: stillDeployed,
			})
		}
	}

	var newState model.State
	if len(remaining) > 0 {
		newState = model.State{
			ActiveEnv:     state.ActiveEnv,
			ActivatedAt:   state.ActivatedAt,
			ManagedSkills: remaining,
		}
	}
	if err := a.state.Save(newState); err != nil {
		return result, fmt.Errorf("save state: %w", err)
	}

	if len(remaining) > 0 {
		return result, fmt.Errorf("%d skill deployment(s) could not be removed; state preserved for retry", result.Failed)
	}
	return result, nil
}
