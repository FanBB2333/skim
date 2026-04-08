package linker

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"syscall"
	"time"

	"gopkg.in/yaml.v3"
)

// HardlinkLinker deploys skills by recreating the directory tree and hard-linking files.
type HardlinkLinker struct{}

func NewHardlinkLinker() *HardlinkLinker {
	return &HardlinkLinker{}
}

func (h *HardlinkLinker) LinkDir(src, dst string) error {
	absSrc, err := filepath.Abs(src)
	if err != nil {
		return fmt.Errorf("resolve absolute path: %w", err)
	}

	if err := filepath.WalkDir(absSrc, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}

		rel, err := filepath.Rel(absSrc, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)

		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}

		// Always write a fresh marker for the installed copy.
		if rel == markerFile {
			return nil
		}

		if err := os.Link(path, target); err != nil {
			if errors.Is(err, syscall.EXDEV) {
				return fmt.Errorf("hardlink %s -> %s: source and destination are on different filesystems", target, path)
			}
			return fmt.Errorf("hardlink %s -> %s: %w", target, path, err)
		}

		return nil
	}); err != nil {
		return err
	}

	marker := ManagedMarker{
		InstalledAt: time.Now(),
		Source:      absSrc,
	}
	data, err := yaml.Marshal(marker)
	if err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(dst, markerFile), data, 0o644)
}

func (h *HardlinkLinker) UnlinkDir(path string) error {
	return os.RemoveAll(path)
}

func (h *HardlinkLinker) IsManaged(path string) (bool, error) {
	_, err := os.Stat(filepath.Join(path, markerFile))
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
