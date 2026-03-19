package cli

import (
	"fmt"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

func newAgentCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "agent",
		Short: "Manage coding agent frameworks",
	}

	cmd.AddCommand(newAgentListCmd())
	cmd.AddCommand(newAgentScanCmd())

	return cmd
}

func newAgentListCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List supported agents and their installation status",
		RunE: func(cmd *cobra.Command, args []string) error {
			agents := svc.Registry.All()
			if len(agents) == 0 {
				fmt.Println("No agents configured.")
				return nil
			}

			for _, ag := range agents {
				status := color.RedString("not installed")
				if ag.IsAvailable() {
					status = color.GreenString("available")
					skills, err := ag.ListSkills()
					if err == nil {
						status += fmt.Sprintf(" (%d skills)", len(skills))
					}
				}
				fmt.Printf("  %-12s %-30s %s\n", ag.ID(), ag.SkillDir(), status)
			}
			return nil
		},
	}
}

func newAgentScanCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "scan",
		Short: "Scan all agents and import existing skills to the global store",
		RunE: func(cmd *cobra.Command, args []string) error {
			result, err := svc.Scanner.ScanAll()
			if err != nil {
				return err
			}

			color.Green("Scan complete")
			fmt.Printf("  Imported: %d\n", result.Imported)
			fmt.Printf("  Skipped:  %d (already in store)\n", result.Skipped)

			for _, e := range result.Errors {
				color.Yellow("  warning: %s", e)
			}

			return nil
		},
	}
}
