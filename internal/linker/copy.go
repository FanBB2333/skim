package linker

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

const markerFile = ".skim-managed"

// ManagedMarker is the content of the .skim-managed file.
type ManagedMarker struct {
	Env         string    `yaml:"env"`
	InstalledAt time.Time `yaml:"installed_at"`
	Source      string    `yaml:"source"`
}

// CopyLinker deploys skills by recursively copying directory trees.
type CopyLinker struct{}

func NewCopyLinker() *CopyLinker {
	return &CopyLinker{}
}

func (c *CopyLinker) LinkDir(src, dst string) error {
	if err := filepath.WalkDir(src, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)

		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}

		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, data, 0o644)
	}); err != nil {
		return fmt.Errorf("copy %s -> %s: %w", src, dst, err)
	}

	// Write marker
	marker := ManagedMarker{
		InstalledAt: time.Now(),
		Source:      src,
	}
	data, err := yaml.Marshal(marker)
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dst, markerFile), data, 0o644)
}

func (c *CopyLinker) UnlinkDir(path string) error {
	return os.RemoveAll(path)
}

func (c *CopyLinker) IsManaged(path string) (bool, error) {
	_, err := os.Stat(filepath.Join(path, markerFile))
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
