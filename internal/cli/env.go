package cli

import (
	"fmt"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

func newEnvCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "env",
		Short: "Manage skill environments",
	}

	cmd.AddCommand(newEnvListCmd())
	cmd.AddCommand(newEnvCreateCmd())
	cmd.AddCommand(newEnvRemoveCmd())

	return cmd
}

func newEnvListCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List all environments",
		RunE: func(cmd *cobra.Command, args []string) error {
			envs, err := svc.Env.List()
			if err != nil {
				return err
			}

			state, err := svc.State.Load()
			if err != nil {
				return err
			}

			if len(envs) == 0 {
				fmt.Println("No environments. Create one with: skim env create <name>")
				return nil
			}

			green := color.New(color.FgGreen)
			for _, env := range envs {
				prefix := "  "
				if env.Name == state.ActiveEnv {
					prefix = "* "
				}
				if env.Name == state.ActiveEnv {
					green.Printf("%s%s", prefix, env.Name)
				} else {
					fmt.Printf("%s%s", prefix, env.Name)
				}
				fmt.Printf("  (%d skills)\n", len(env.Skills))
			}
			return nil
		},
	}
}

func newEnvCreateCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "create <name>",
		Short: "Create a new environment",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			name := args[0]
			if err := svc.Env.Create(name); err != nil {
				return err
			}
			color.Green("Created environment %q", name)
			return nil
		},
	}
}

func newEnvRemoveCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "remove <name>",
		Short: "Remove an environment",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			name := args[0]

			// Check if the env is active
			state, err := svc.State.Load()
			if err != nil {
				return err
			}
			if state.ActiveEnv == name {
				return fmt.Errorf("cannot remove active environment %q; run 'skim deactivate' first", name)
			}

			if err := svc.Env.Remove(name); err != nil {
				return err
			}
			color.Green("Removed environment %q", name)
			return nil
		},
	}
}
