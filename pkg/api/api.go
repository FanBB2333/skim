package api

import (
	"context"
	"fmt"

	"github.com/FanBB2333/skim/internal/agent"
	"github.com/FanBB2333/skim/internal/config"
	"github.com/FanBB2333/skim/internal/core"
	"github.com/FanBB2333/skim/internal/model"
)

// App is the API binding for the Wails frontend.
type App struct {
	ctx context.Context
	svc *core.Service
}

// NewApp creates a new App instance.
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	cfg, err := config.Load()
	if err != nil {
		return
	}
	a.svc = core.NewService(cfg)
}

// Status response types
type StatusResponse struct {
	ActiveEnv     string         `json:"activeEnv"`
	ActivatedAt   string         `json:"activatedAt"`
	ManagedSkills []ManagedSkill `json:"managedSkills"`
	Agents        []AgentInfo    `json:"agents"`
	StoreCount    int            `json:"storeCount"`
	EnvCount      int            `json:"envCount"`
}

type ManagedSkill struct {
	Skill      string   `json:"skill"`
	DeployedTo []string `json:"deployedTo"`
}

type AgentInfo struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	SkillDir   string `json:"skillDir"`
	Available  bool   `json:"available"`
	SkillCount int    `json:"skillCount"`
}

type SkillInfo struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Version     string `json:"version"`
}

type EnvInfo struct {
	Name   string   `json:"name"`
	Skills []string `json:"skills"`
	Active bool     `json:"active"`
}

type OperationResult struct {
	Success   bool     `json:"success"`
	Message   string   `json:"message"`
	Succeeded int      `json:"succeeded"`
	Failed    int      `json:"failed"`
	Errors    []string `json:"errors"`
}

// GetStatus returns the current skim status.
func (a *App) GetStatus() (*StatusResponse, error) {
	if a.svc == nil {
		return nil, fmt.Errorf("service not initialized")
	}

	state, err := a.svc.State.Load()
	if err != nil {
		return nil, err
	}

	resp := &StatusResponse{
		ActiveEnv: state.ActiveEnv,
	}

	if state.ActivatedAt != nil {
		resp.ActivatedAt = state.ActivatedAt.Format("2006-01-02 15:04:05")
	}

	for _, ms := range state.ManagedSkills {
		resp.ManagedSkills = append(resp.ManagedSkills, ManagedSkill{
			Skill:      ms.Skill,
			DeployedTo: ms.DeployedTo,
		})
	}

	for _, ag := range a.svc.Registry.All() {
		info := AgentInfo{
			ID:        ag.ID(),
			Name:      ag.Name(),
			SkillDir:  ag.SkillDir(),
			Available: ag.IsAvailable(),
		}
		if ag.IsAvailable() {
			if skills, err := ag.ListSkills(); err == nil {
				info.SkillCount = len(skills)
			}
		}
		resp.Agents = append(resp.Agents, info)
	}

	skills, _ := a.svc.Store.List()
	resp.StoreCount = len(skills)

	envs, _ := a.svc.Env.List()
	resp.EnvCount = len(envs)

	return resp, nil
}

// GetSkills returns all skills in the global store.
func (a *App) GetSkills() ([]SkillInfo, error) {
	skills, err := a.svc.Store.List()
	if err != nil {
		return nil, err
	}

	var result []SkillInfo
	for _, s := range skills {
		result = append(result, SkillInfo{
			Name:        s.Name,
			Description: s.Description,
			Version:     s.Version,
		})
	}
	return result, nil
}

// GetEnvs returns all environments.
func (a *App) GetEnvs() ([]EnvInfo, error) {
	envs, err := a.svc.Env.List()
	if err != nil {
		return nil, err
	}

	state, _ := a.svc.State.Load()

	var result []EnvInfo
	for _, e := range envs {
		result = append(result, EnvInfo{
			Name:   e.Name,
			Skills: e.Skills,
			Active: e.Name == state.ActiveEnv,
		})
	}
	return result, nil
}

// GetAgents returns all agents and their status.
func (a *App) GetAgents() ([]AgentInfo, error) {
	var result []AgentInfo
	for _, ag := range a.svc.Registry.All() {
		info := AgentInfo{
			ID:        ag.ID(),
			Name:      ag.Name(),
			SkillDir:  ag.SkillDir(),
			Available: ag.IsAvailable(),
		}
		if ag.IsAvailable() {
			if skills, err := ag.ListSkills(); err == nil {
				info.SkillCount = len(skills)
			}
		}
		result = append(result, info)
	}
	return result, nil
}

// CreateEnv creates a new environment.
func (a *App) CreateEnv(name string) *OperationResult {
	if err := a.svc.Env.Create(name); err != nil {
		return &OperationResult{Success: false, Message: err.Error()}
	}
	return &OperationResult{Success: true, Message: fmt.Sprintf("Created environment %q", name)}
}

// RemoveEnv removes an environment.
func (a *App) RemoveEnv(name string) *OperationResult {
	state, _ := a.svc.State.Load()
	if state.ActiveEnv == name {
		return &OperationResult{Success: false, Message: "Cannot remove active environment"}
	}
	if err := a.svc.Env.Remove(name); err != nil {
		return &OperationResult{Success: false, Message: err.Error()}
	}
	return &OperationResult{Success: true, Message: fmt.Sprintf("Removed environment %q", name)}
}

// EnableSkill enables a skill in an environment.
func (a *App) EnableSkill(envName, skillName string) *OperationResult {
	if err := a.svc.Env.EnableSkill(envName, skillName); err != nil {
		return &OperationResult{Success: false, Message: err.Error()}
	}
	return &OperationResult{Success: true, Message: fmt.Sprintf("Enabled %q in %q", skillName, envName)}
}

// DisableSkill disables a skill in an environment.
func (a *App) DisableSkill(envName, skillName string) *OperationResult {
	if err := a.svc.Env.DisableSkill(envName, skillName); err != nil {
		return &OperationResult{Success: false, Message: err.Error()}
	}
	return &OperationResult{Success: true, Message: fmt.Sprintf("Disabled %q in %q", skillName, envName)}
}

// Activate activates an environment.
func (a *App) Activate(envName string) *OperationResult {
	result, err := a.svc.Activator.Activate(envName)
	if err != nil {
		return &OperationResult{Success: false, Message: err.Error()}
	}
	return &OperationResult{
		Success:   true,
		Message:   fmt.Sprintf("Activated environment %q", envName),
		Succeeded: result.Succeeded,
		Failed:    result.Failed,
		Errors:    result.Errors,
	}
}

// Deactivate deactivates the current environment.
func (a *App) Deactivate() *OperationResult {
	result, err := a.svc.Activator.Deactivate()
	if err != nil {
		return &OperationResult{Success: false, Message: err.Error()}
	}
	return &OperationResult{
		Success:   true,
		Message:   "Deactivated environment",
		Succeeded: result.Succeeded,
		Failed:    result.Failed,
		Errors:    result.Errors,
	}
}

// ScanAgents scans all agents and imports skills to the store.
func (a *App) ScanAgents() *OperationResult {
	result, err := a.svc.Scanner.ScanAll()
	if err != nil {
		return &OperationResult{Success: false, Message: err.Error()}
	}
	return &OperationResult{
		Success:   true,
		Message:   fmt.Sprintf("Imported %d skills, skipped %d", result.Imported, result.Skipped),
		Succeeded: result.Imported,
		Failed:    len(result.Errors),
		Errors:    result.Errors,
	}
}

// RemoveSkill removes a skill from the global store.
func (a *App) RemoveSkill(name string) *OperationResult {
	if err := a.svc.Store.Remove(name); err != nil {
		return &OperationResult{Success: false, Message: err.Error()}
	}
	return &OperationResult{Success: true, Message: fmt.Sprintf("Removed skill %q", name)}
}

// GetAgentSkills returns skills for a specific agent.
func (a *App) GetAgentSkills(agentID string) ([]model.SkillRef, error) {
	ag := a.svc.Registry.Get(agentID)
	if ag == nil {
		return nil, fmt.Errorf("agent %q not found", agentID)
	}
	return ag.ListSkills()
}

// Ensure agent interface is available for type assertions
var _ agent.Agent = (*agent.StandardAgent)(nil)
