package cli

import (
	"fmt"

	"github.com/FanBB2333/skim/internal/config"
	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

func newInitCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "init",
		Short: "Initialize skim and create a base environment snapshot from current agent skills",
		RunE: func(cmd *cobra.Command, args []string) error {
			// Ensure directories exist
			if err := config.EnsureDirs(); err != nil {
				return fmt.Errorf("create directories: %w", err)
			}

			// Load (creates default config if missing)
			_, err := config.Load()
			if err != nil {
				return fmt.Errorf("create config: %w", err)
			}

			// Create the base snapshot environment if it doesn't exist yet.
			if _, err := svc.Env.Get("base"); err != nil {
				snapshot, err := svc.Scanner.SnapshotAll()
				if err != nil {
					return fmt.Errorf("snapshot current agent skills: %w", err)
				}
				if err := svc.Env.CreateWithSkills("base", snapshot.Skills); err != nil {
					return fmt.Errorf("create base environment: %w", err)
				}
				color.Green("Created 'base' environment from current agent skills")
				fmt.Printf("  %d skill(s) captured", len(snapshot.Skills))
				if snapshot.Imported > 0 || snapshot.Skipped > 0 {
					fmt.Printf(" (%d imported, %d already in store)", snapshot.Imported, snapshot.Skipped)
				}
				fmt.Println()
				for _, e := range snapshot.Errors {
					color.Yellow("  warning: %s", e)
				}
			}

			color.Green("Skim initialized at %s", config.SkimDir())
			fmt.Println("\nQuick start:")
			fmt.Println("  skim env list             # See the generated base environment snapshot")
			fmt.Println("  skim add <path>           # Add a new skill to the global store")
			fmt.Println("  skim install -t qoder <path>  # Install a skill to one specific agent")
			fmt.Println("  skim activate base        # Deploy the base environment to all enabled agents")
			fmt.Println("  skim status               # Check current status")

			return nil
		},
	}
}
