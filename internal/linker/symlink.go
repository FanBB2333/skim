package linker

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

// SymlinkLinker deploys skills by creating symlinks from the agent directory to the store.
type SymlinkLinker struct{}

func NewSymlinkLinker() *SymlinkLinker {
	return &SymlinkLinker{}
}

func (s *SymlinkLinker) LinkDir(src, dst string) error {
	// Ensure parent directory exists
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return fmt.Errorf("create parent dir: %w", err)
	}

	// Remove existing if it's a symlink
	if fi, err := os.Lstat(dst); err == nil {
		if fi.Mode()&os.ModeSymlink != 0 {
			if err := os.Remove(dst); err != nil {
				return fmt.Errorf("remove old symlink: %w", err)
			}
		} else {
			return fmt.Errorf("destination %s already exists and is not a symlink", dst)
		}
	}

	// Create symlink
	absSrc, err := filepath.Abs(src)
	if err != nil {
		return fmt.Errorf("resolve absolute path: %w", err)
	}
	if err := os.Symlink(absSrc, dst); err != nil {
		return fmt.Errorf("symlink %s -> %s: %w", dst, absSrc, err)
	}

	// Write marker inside the source directory (store) so IsManaged can find it
	// For symlinks we write the marker in the target (symlinked) directory
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

func (s *SymlinkLinker) UnlinkDir(path string) error {
	// Check if it's a symlink
	fi, err := os.Lstat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	if fi.Mode()&os.ModeSymlink != 0 {
		return os.Remove(path)
	}
	// Fall back to removing the directory
	return os.RemoveAll(path)
}

func (s *SymlinkLinker) IsManaged(path string) (bool, error) {
	_, err := os.Stat(filepath.Join(path, markerFile))
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
