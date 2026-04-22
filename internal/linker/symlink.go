package linker

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

// SymlinkLinker deploys skills by creating symlinks from the agent directory to the store.
// The managed marker is written as a sibling file (".skim-managed.<name>") alongside
// the symlink rather than inside the symlinked target, to avoid polluting the shared store.
type SymlinkLinker struct{}

func NewSymlinkLinker() *SymlinkLinker {
	return &SymlinkLinker{}
}

// siblingMarkerPath returns the sibling marker path for a deployed skill at path.
// e.g. "/home/x/.claude/skills/foo" -> "/home/x/.claude/skills/.skim-managed.foo"
func siblingMarkerPath(path string) string {
	return filepath.Join(filepath.Dir(path), markerFile+"."+filepath.Base(path))
}

func (s *SymlinkLinker) LinkDir(src, dst string) error {
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return fmt.Errorf("create parent dir: %w", err)
	}

	if fi, err := os.Lstat(dst); err == nil {
		if fi.Mode()&os.ModeSymlink != 0 {
			if err := os.Remove(dst); err != nil {
				return fmt.Errorf("remove old symlink: %w", err)
			}
		} else {
			return fmt.Errorf("destination %s already exists and is not a symlink", dst)
		}
	}

	absSrc, err := filepath.Abs(src)
	if err != nil {
		return fmt.Errorf("resolve absolute path: %w", err)
	}
	if err := os.Symlink(absSrc, dst); err != nil {
		return fmt.Errorf("symlink %s -> %s: %w", dst, absSrc, err)
	}

	marker := ManagedMarker{
		InstalledAt: time.Now(),
		Source:      absSrc,
	}
	data, err := yaml.Marshal(marker)
	if err != nil {
		return err
	}
	if err := os.WriteFile(siblingMarkerPath(dst), data, 0o644); err != nil {
		// If marker write fails, unlink the symlink so the deployment isn't half-done.
		_ = os.Remove(dst)
		return fmt.Errorf("write marker: %w", err)
	}
	return nil
}

func (s *SymlinkLinker) UnlinkDir(path string) error {
	// Best-effort marker removal; ignore not-exist.
	if err := os.Remove(siblingMarkerPath(path)); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove marker: %w", err)
	}

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
	return os.RemoveAll(path)
}

func (s *SymlinkLinker) IsManaged(path string) (bool, error) {
	// Primary location: sibling marker alongside the symlink.
	if _, err := os.Stat(siblingMarkerPath(path)); err == nil {
		return true, nil
	} else if !os.IsNotExist(err) {
		return false, err
	}
	// Backward compatibility: older versions wrote the marker through the
	// symlink into the store. Accept it so legacy deployments can still be
	// recognised and cleaned up.
	if _, err := os.Stat(filepath.Join(path, markerFile)); err == nil {
		return true, nil
	} else if !os.IsNotExist(err) {
		return false, err
	}
	return false, nil
}
