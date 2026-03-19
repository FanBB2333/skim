package core

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/FanBB2333/skim/internal/config"
	"github.com/FanBB2333/skim/internal/model"
	"gopkg.in/yaml.v3"
)

// EnvManager manages environment definitions in ~/.skim/envs/.
type EnvManager struct{}

func NewEnvManager() *EnvManager {
	return &EnvManager{}
}

func (e *EnvManager) envsDir() string {
	return filepath.Join(config.SkimDir(), "envs")
}

func (e *EnvManager) envPath(name string) string {
	return filepath.Join(e.envsDir(), name+".yaml")
}

// List returns all defined environments.
func (e *EnvManager) List() ([]model.Environment, error) {
	entries, err := os.ReadDir(e.envsDir())
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var envs []model.Environment
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if filepath.Ext(name) != ".yaml" {
			continue
		}
		envName := name[:len(name)-len(".yaml")]
		env, err := e.Get(envName)
		if err != nil {
			continue
		}
		envs = append(envs, *env)
	}
	return envs, nil
}

// Get returns a single environment by name.
func (e *EnvManager) Get(name string) (*model.Environment, error) {
	data, err := os.ReadFile(e.envPath(name))
	if err != nil {
		return nil, err
	}
	var env model.Environment
	if err := yaml.Unmarshal(data, &env); err != nil {
		return nil, err
	}
	return &env, nil
}

// Create creates a new empty environment.
func (e *EnvManager) Create(name string) error {
	path := e.envPath(name)
	if _, err := os.Stat(path); err == nil {
		return fmt.Errorf("environment %q already exists", name)
	}
	env := model.Environment{
		Name:   name,
		Skills: []string{},
	}
	return e.save(env)
}

// Remove deletes an environment.
func (e *EnvManager) Remove(name string) error {
	return os.Remove(e.envPath(name))
}

// EnableSkill adds a skill to an environment.
func (e *EnvManager) EnableSkill(envName, skillName string) error {
	env, err := e.Get(envName)
	if err != nil {
		return err
	}
	for _, s := range env.Skills {
		if s == skillName {
			return fmt.Errorf("skill %q is already enabled in environment %q", skillName, envName)
		}
	}
	env.Skills = append(env.Skills, skillName)
	return e.save(*env)
}

// DisableSkill removes a skill from an environment.
func (e *EnvManager) DisableSkill(envName, skillName string) error {
	env, err := e.Get(envName)
	if err != nil {
		return err
	}
	found := false
	filtered := make([]string, 0, len(env.Skills))
	for _, s := range env.Skills {
		if s == skillName {
			found = true
			continue
		}
		filtered = append(filtered, s)
	}
	if !found {
		return fmt.Errorf("skill %q is not in environment %q", skillName, envName)
	}
	env.Skills = filtered
	return e.save(*env)
}

func (e *EnvManager) save(env model.Environment) error {
	data, err := yaml.Marshal(env)
	if err != nil {
		return err
	}
	return os.WriteFile(e.envPath(env.Name), data, 0o644)
}
