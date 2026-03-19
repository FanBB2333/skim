package config

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/FanBB2333/skim/internal/model"
	"gopkg.in/yaml.v3"
)

const skimDir = "~/.skim"

// SkimDir returns the absolute path to ~/.skim.
func SkimDir() string {
	return ExpandHome(skimDir)
}

// ExpandHome replaces a leading ~ with the user's home directory.
func ExpandHome(path string) string {
	if !strings.HasPrefix(path, "~") {
		return path
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return path
	}
	return filepath.Join(home, path[1:])
}

// EnsureDirs creates the skim directory tree if it doesn't exist.
func EnsureDirs() error {
	base := SkimDir()
	dirs := []string{
		base,
		filepath.Join(base, "store"),
		filepath.Join(base, "envs"),
	}
	for _, d := range dirs {
		if err := os.MkdirAll(d, 0o755); err != nil {
			return err
		}
	}
	return nil
}

// Load reads the config from ~/.skim/config.yaml. If the file doesn't exist,
// it creates a default config and writes it.
func Load() (model.Config, error) {
	if err := EnsureDirs(); err != nil {
		return model.Config{}, err
	}

	cfgPath := filepath.Join(SkimDir(), "config.yaml")
	data, err := os.ReadFile(cfgPath)
	if err != nil {
		if os.IsNotExist(err) {
			cfg := model.DefaultConfig()
			if writeErr := Save(cfg); writeErr != nil {
				return cfg, writeErr
			}
			return cfg, nil
		}
		return model.Config{}, err
	}

	var cfg model.Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return model.Config{}, err
	}
	return cfg, nil
}

// Save writes the config to ~/.skim/config.yaml.
func Save(cfg model.Config) error {
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(SkimDir(), "config.yaml"), data, 0o644)
}
