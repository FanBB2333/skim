package cli

import (
	"fmt"
	"os"

	"github.com/FanBB2333/skim/internal/config"
	"github.com/FanBB2333/skim/internal/core"
	"github.com/spf13/cobra"
)

var svc *core.Service

// NewRootCmd creates the root skim command.
func NewRootCmd() *cobra.Command {
	root := &cobra.Command{
		Use:   "skim",
		Short: "Skill Version Manager for coding agents",
		Long:  "skim manages skills across multiple coding agent frameworks (Claude, Codex, Gemini, Qoder, QoderWork) using a global store with environment-based switching.",
		PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("load config: %w", err)
			}
			svc = core.NewService(cfg)
			return nil
		},
		SilenceUsage: true,
	}

	root.AddCommand(newStatusCmd())
	root.AddCommand(newEnvCmd())
	root.AddCommand(newActivateCmd())
	root.AddCommand(newDeactivateCmd())
	root.AddCommand(newSkillCmd())
	root.AddCommand(newAgentCmd())
	root.AddCommand(newInitCmd())
	root.AddCommand(newCompletionCmd())

	return root
}

// Execute runs the root command.
func Execute() {
	if err := NewRootCmd().Execute(); err != nil {
		os.Exit(1)
	}
}
