package cli

import (
	"fmt"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

func newStatusCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "status",
		Short: "Show current skim status",
		RunE: func(cmd *cobra.Command, args []string) error {
			state, err := svc.State.Load()
			if err != nil {
				return err
			}

			bold := color.New(color.Bold)
			green := color.New(color.FgGreen)
			yellow := color.New(color.FgYellow)

			bold.Println("Skim Status")
			fmt.Println()

			// Active environment
			if state.ActiveEnv != "" {
				fmt.Printf("  Active env: ")
				green.Println(state.ActiveEnv)
				if state.ActivatedAt != nil {
					fmt.Printf("  Activated:  %s\n", state.ActivatedAt.Format("2006-01-02 15:04:05"))
				}
			} else {
				fmt.Printf("  Active env: ")
				yellow.Println("(none)")
			}
			fmt.Println()

			// Managed skills
			if len(state.ManagedSkills) > 0 {
				bold.Println("  Deployed skills:")
				for _, entry := range state.ManagedSkills {
					fmt.Printf("    - %s -> %v\n", entry.Skill, entry.DeployedTo)
				}
			}
			fmt.Println()

			// Agents
			bold.Println("  Agents:")
			for _, ag := range svc.Registry.All() {
				status := color.RedString("not installed")
				if ag.IsAvailable() {
					status = color.GreenString("available")
				}
				fmt.Printf("    %-12s %s  (%s)\n", ag.ID(), status, ag.SkillDir())
			}
			fmt.Println()

			// Store summary
			skills, err := svc.Store.List()
			if err != nil {
				return err
			}
			fmt.Printf("  Store: %d skill(s)\n", len(skills))

			// Envs summary
			envs, err := svc.Env.List()
			if err != nil {
				return err
			}
			fmt.Printf("  Envs:  %d environment(s)\n", len(envs))

			return nil
		},
	}
}
