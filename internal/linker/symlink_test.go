package linker

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSymlinkLinkerWritesMarkerAsSiblingNotInStore(t *testing.T) {
	storeDir := filepath.Join(t.TempDir(), "demo-skill")
	if err := os.MkdirAll(storeDir, 0o755); err != nil {
		t.Fatalf("mkdir store: %v", err)
	}
	if err := os.WriteFile(filepath.Join(storeDir, "SKILL.md"), []byte("# demo\n"), 0o644); err != nil {
		t.Fatalf("write SKILL.md: %v", err)
	}

	agentDir := t.TempDir()
	dst := filepath.Join(agentDir, "demo-skill")

	lnk := NewSymlinkLinker()
	if err := lnk.LinkDir(storeDir, dst); err != nil {
		t.Fatalf("LinkDir: %v", err)
	}

	// Symlink was created.
	fi, err := os.Lstat(dst)
	if err != nil {
		t.Fatalf("lstat dst: %v", err)
	}
	if fi.Mode()&os.ModeSymlink == 0 {
		t.Fatalf("expected %s to be a symlink", dst)
	}

	// Marker lives beside the symlink, not inside the store.
	siblingMarker := filepath.Join(agentDir, ".skim-managed.demo-skill")
	if _, err := os.Stat(siblingMarker); err != nil {
		t.Fatalf("expected sibling marker at %s: %v", siblingMarker, err)
	}
	if _, err := os.Stat(filepath.Join(storeDir, ".skim-managed")); !os.IsNotExist(err) {
		t.Fatalf("expected store to be untouched; got err=%v", err)
	}

	// IsManaged recognises the sibling marker.
	managed, err := lnk.IsManaged(dst)
	if err != nil {
		t.Fatalf("IsManaged: %v", err)
	}
	if !managed {
		t.Fatalf("expected IsManaged=true after LinkDir")
	}

	// UnlinkDir cleans up both the symlink and the sibling marker.
	if err := lnk.UnlinkDir(dst); err != nil {
		t.Fatalf("UnlinkDir: %v", err)
	}
	if _, err := os.Lstat(dst); !os.IsNotExist(err) {
		t.Fatalf("expected symlink removed, got err=%v", err)
	}
	if _, err := os.Stat(siblingMarker); !os.IsNotExist(err) {
		t.Fatalf("expected sibling marker removed, got err=%v", err)
	}
}

func TestSymlinkLinkerIsManagedLegacyInStoreMarker(t *testing.T) {
	// A skill that was deployed by an older skim version will have its
	// marker inside the store (through the symlink). We keep recognising it
	// so those deployments can still be cleaned up.
	storeDir := filepath.Join(t.TempDir(), "legacy-skill")
	if err := os.MkdirAll(storeDir, 0o755); err != nil {
		t.Fatalf("mkdir store: %v", err)
	}
	if err := os.WriteFile(filepath.Join(storeDir, ".skim-managed"), []byte("legacy"), 0o644); err != nil {
		t.Fatalf("write marker: %v", err)
	}

	agentDir := t.TempDir()
	dst := filepath.Join(agentDir, "legacy-skill")
	if err := os.Symlink(storeDir, dst); err != nil {
		t.Fatalf("symlink: %v", err)
	}

	lnk := NewSymlinkLinker()
	managed, err := lnk.IsManaged(dst)
	if err != nil {
		t.Fatalf("IsManaged: %v", err)
	}
	if !managed {
		t.Fatalf("expected legacy in-store marker to be recognised")
	}
}
