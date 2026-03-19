package core

import (
	"os"
	"path/filepath"

	"github.com/FanBB2333/skim/internal/config"
	"github.com/FanBB2333/skim/internal/model"
	"gopkg.in/yaml.v3"
)

// StateManager handles reading and writing ~/.skim/state.yaml.
type StateManager struct{}

func NewStateManager() *StateManager {
	return &StateManager{}
}

func (s *StateManager) statePath() string {
	return filepath.Join(config.SkimDir(), "state.yaml")
}

// Load reads the current state. Returns an empty state if the file doesn't exist.
func (s *StateManager) Load() (model.State, error) {
	data, err := os.ReadFile(s.statePath())
	if err != nil {
		if os.IsNotExist(err) {
			return model.State{}, nil
		}
		return model.State{}, err
	}
	var state model.State
	if err := yaml.Unmarshal(data, &state); err != nil {
		return model.State{}, err
	}
	return state, nil
}

// Save writes the state to disk.
func (s *StateManager) Save(state model.State) error {
	data, err := yaml.Marshal(state)
	if err != nil {
		return err
	}
	return os.WriteFile(s.statePath(), data, 0o644)
}
