package cli

import (
	"fmt"

	"github.com/FanBB2333/skim/internal/agent"
	"github.com/FanBB2333/skim/internal/linker"
	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

func newInstallCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "install -t <agent> <path>",
		Short: "Add a skill to the store and install it to one specific agent via symlink",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			target, _ := cmd.Flags().GetString("target")
			if target == "" {
				return fmt.Errorf("target agent is required; use -t <agent>")
			}

			ag, err := cliAgentByID(target)
			if err != nil {
				return err
			}
			if !ag.IsAvailable() {
				return fmt.Errorf("agent %q is not available on this machine", target)
			}

			skill, err := svc.Store.Add(args[0])
			if err != nil {
				return fmt.Errorf("add skill: %w", err)
			}

			// Direct installs to a specific agent default to symlinks.
			if err := ag.InstallSkill(*skill, linker.NewSymlinkLinker()); err != nil {
				return fmt.Errorf("install %q to %s: %w", skill.Name, ag.Name(), err)
			}

			color.Green("Installed skill %q to %s via symlink", skill.Name, ag.Name())
			return nil
		},
	}
	cmd.Flags().StringP("target", "t", "", "target agent id (for example: qoder)")
	return cmd
}

func cliAgentByID(id string) (agent.Agent, error) {
	ac, ok := svc.Config.Agents[id]
	if !ok {
		return nil, fmt.Errorf("agent %q is not configured", id)
	}
	return agent.NewAgentFromConfig(id, ac), nil
}
