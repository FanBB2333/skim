package cli

import (
	"fmt"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

func newActivateCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "activate <env>",
		Short: "Activate an environment (deploy its skills to all agents)",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			envName := args[0]
			result, err := svc.Activator.Activate(envName)
			if err != nil {
				return err
			}

			color.Green("Activated environment %q", envName)
			fmt.Printf("  %d deployment(s) succeeded", result.Succeeded)
			if result.Failed > 0 {
				color.Yellow(", %d failed", result.Failed)
			}
			fmt.Println()

			for _, e := range result.Errors {
				color.Yellow("  warning: %s", e)
			}

			return nil
		},
	}
}

func newDeactivateCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "deactivate",
		Short: "Deactivate the current environment (remove managed skills from agents)",
		RunE: func(cmd *cobra.Command, args []string) error {
			result, err := svc.Activator.Deactivate()
			if err != nil {
				return err
			}

			color.Green("Deactivated environment")
			fmt.Printf("  %d removal(s) succeeded", result.Succeeded)
			if result.Failed > 0 {
				color.Yellow(", %d failed", result.Failed)
			}
			fmt.Println()

			for _, e := range result.Errors {
				color.Yellow("  warning: %s", e)
			}

			return nil
		},
	}
}
