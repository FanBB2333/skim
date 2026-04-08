package cli

import (
	"fmt"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

func newAddCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "add <path>",
		Short: "Add a skill from a local path to the global store",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return runAddSkill(args[0])
		},
	}
}

func runAddSkill(source string) error {
	skill, err := svc.Store.Add(source)
	if err != nil {
		return fmt.Errorf("add skill: %w", err)
	}
	color.Green("Added skill %q to the store", skill.Name)
	return nil
}
