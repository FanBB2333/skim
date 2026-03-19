package core

import (
	"fmt"

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
