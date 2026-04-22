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
	Pack      *PackManager
	Registry  *agent.Registry
	Linker    linker.Linker
}

// NewLinker creates a Linker based on the given strategy string.
func NewLinker(strategy string) linker.Linker {
	switch strategy {
	case "hardlink":
		return linker.NewHardlinkLinker()
	case "copy":
		return linker.NewCopyLinker()
	default:
		return linker.NewSymlinkLinker()
	}
}

// NewService creates a fully wired Service from the given config.
func NewService(cfg model.Config) *Service {
	stateMgr := NewStateManager()
	storeMgr := NewStoreManager()
	envMgr := NewEnvManager()
	reg := agent.NewRegistry(cfg)
	lnk := NewLinker(cfg.LinkStrategy)
	activator := NewActivator(storeMgr, envMgr, stateMgr, reg, lnk)
	scanner := NewScanner(storeMgr, reg)
	packMgr := NewPackManager(storeMgr, envMgr)

	return &Service{
		Config:    cfg,
		State:     stateMgr,
		Store:     storeMgr,
		Env:       envMgr,
		Activator: activator,
		Scanner:   scanner,
		Pack:      packMgr,
		Registry:  reg,
		Linker:    lnk,
	}
}
