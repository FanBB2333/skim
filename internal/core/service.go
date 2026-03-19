package core

import (
	"github.com/FanBB2333/skim/internal/agent"
	"github.com/FanBB2333/skim/internal/linker"
	"github.com/FanBB2333/skim/internal/model"
)

// Service is the top-level entry point for all skim business logic.
// Both CLI and future GUI call the same Service methods.
type Service struct {
	Config    model.Config
	State     *StateManager
	Store     *StoreManager
	Env       *EnvManager
	Activator *Activator
	Scanner   *Scanner
	Registry  *agent.Registry
	Linker    linker.Linker
}

// NewService creates a fully wired Service from the given config.
func NewService(cfg model.Config) *Service {
	stateMgr := NewStateManager()
	storeMgr := NewStoreManager()
	envMgr := NewEnvManager()
	reg := agent.NewRegistry(cfg)
	lnk := linker.NewCopyLinker()
	activator := NewActivator(storeMgr, envMgr, stateMgr, reg, lnk)
	scanner := NewScanner(storeMgr, reg)

	return &Service{
		Config:    cfg,
		State:     stateMgr,
		Store:     storeMgr,
		Env:       envMgr,
		Activator: activator,
		Scanner:   scanner,
		Registry:  reg,
		Linker:    lnk,
	}
}
