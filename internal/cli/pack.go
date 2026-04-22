package cli

import (
	"fmt"

	"github.com/FanBB2333/skim/internal/core"
	"github.com/FanBB2333/skim/pkg/api"
	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

func newPackCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "pack",
		Short: "Pack skim skills and environments into a portable archive",
		RunE: func(cmd *cobra.Command, args []string) error {
			output, _ := cmd.Flags().GetString("output")
			envName, _ := cmd.Flags().GetString("env")

			result, err := svc.Pack.Pack(core.PackOptions{
				OutputPath:  output,
				EnvName:     envName,
				SkimVersion: api.Version,
			})
			if err != nil {
				return fmt.Errorf("pack: %w", err)
			}

			color.Green("Packed skim archive: %s", result.ArchivePath)
			fmt.Printf("  %d skill(s), %d environment(s)\n", len(result.Skills), len(result.Envs))
			if len(result.Symlinks) > 0 {
				fmt.Printf("  %d symlink(s) dereferenced\n", len(result.Symlinks))
			}
			return nil
		},
	}
	cmd.Flags().StringP("output", "o", "", "output archive path")
	cmd.Flags().String("env", "", "pack only one environment and its skills")
	return cmd
}

func newUnpackCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "unpack <archive>",
		Short: "Import a skim pack archive into this machine",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			force, _ := cmd.Flags().GetBool("force")

			result, err := svc.Pack.Unpack(core.UnpackOptions{
				ArchivePath: args[0],
				Force:       force,
			})
			if err != nil {
				return fmt.Errorf("unpack: %w", err)
			}

			color.Green("Unpacked skim archive")
			fmt.Printf("  %d skill(s), %d environment(s)\n", len(result.Skills), len(result.Envs))
			if result.WroteConfig {
				fmt.Println("  config.yaml imported")
			}
			fmt.Println("Run `skim activate <env>` to deploy an imported environment.")
			return nil
		},
	}
	cmd.Flags().Bool("force", false, "overwrite archive-owned skills, environments, and config")
	return cmd
}
