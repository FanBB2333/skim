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
		Short: "Initialize skim (create directories, config, and a default environment)",
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

			// Create default environment if it doesn't exist
			if _, err := svc.Env.Get("default"); err != nil {
				if err := svc.Env.Create("default"); err != nil {
					return fmt.Errorf("create default environment: %w", err)
				}
				color.Green("Created 'default' environment")
			}

			color.Green("Skim initialized at %s", config.SkimDir())
			fmt.Println("\nQuick start:")
			fmt.Println("  skim agent scan           # Import existing skills from your agents")
			fmt.Println("  skim skill list           # Show all skills in the store")
			fmt.Println("  skim skill enable <name>  # Enable a skill in the default environment")
			fmt.Println("  skim activate default     # Deploy skills to all agents")
			fmt.Println("  skim status               # Check current status")

			return nil
		},
	}
}
