package core

import (
	"fmt"
	"sort"

	"github.com/FanBB2333/skim/internal/agent"
)

// Scanner imports existing skills from agent directories into the global store.
type Scanner struct {
	store    *StoreManager
	registry *agent.Registry
}

func NewScanner(store *StoreManager, registry *agent.Registry) *Scanner {
	return &Scanner{store: store, registry: registry}
}

// ScanResult holds the outcome of scanning agents.
type ScanResult struct {
	Imported int
	Skipped  int
	Errors   []string
}

// SnapshotResult captures the skills currently visible across available agents.
type SnapshotResult struct {
	Imported int
	Skipped  int
	Skills   []string
	Errors   []string
}

// ScanAll scans all available agents and imports discovered skills to the store.
func (s *Scanner) ScanAll() (*ScanResult, error) {
	result := &ScanResult{}

	for _, ag := range s.registry.Available() {
		refs, err := ag.ListSkills()
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("%s: %s", ag.Name(), err))
			continue
		}

		for _, ref := range refs {
			if ref.IsManaged {
				// Skip skills placed by skim
				continue
			}
			if s.store.Exists(ref.Name) {
				result.Skipped++
				continue
			}
			if _, err := s.store.Add(ref.Path); err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("import %q from %s: %s", ref.Name, ag.Name(), err))
				continue
			}
			result.Imported++
		}
	}

	return result, nil
}

// SnapshotAll imports visible agent skills into the store and returns a deduplicated skill list.
func (s *Scanner) SnapshotAll() (*SnapshotResult, error) {
	result := &SnapshotResult{}
	seen := map[string]struct{}{}

	for _, ag := range s.registry.Available() {
		refs, err := ag.ListSkills()
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("%s: %s", ag.Name(), err))
			continue
		}

		for _, ref := range refs {
			if !s.store.Exists(ref.Name) {
				if _, err := s.store.Add(ref.Path); err != nil {
					result.Errors = append(result.Errors, fmt.Sprintf("snapshot %q from %s: %s", ref.Name, ag.Name(), err))
					continue
				}
				result.Imported++
			} else {
				result.Skipped++
			}

			if _, ok := seen[ref.Name]; ok {
				continue
			}
			seen[ref.Name] = struct{}{}
			result.Skills = append(result.Skills, ref.Name)
		}
	}

	sort.Strings(result.Skills)
	return result, nil
}
