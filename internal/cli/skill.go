package cli

import (
	"fmt"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

func newSkillCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "skill",
		Short: "Manage skills in the global store",
	}

	cmd.AddCommand(newSkillListCmd())
	cmd.AddCommand(newSkillAddCmd())
	cmd.AddCommand(newSkillRemoveCmd())
	cmd.AddCommand(newSkillEnableCmd())
	cmd.AddCommand(newSkillDisableCmd())

	return cmd
}

func newSkillListCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List all skills in the global store",
		RunE: func(cmd *cobra.Command, args []string) error {
			skills, err := svc.Store.List()
			if err != nil {
				return err
			}

			if len(skills) == 0 {
				fmt.Println("No skills in the store. Add one with: skim skill add <path>")
				return nil
			}

			for _, s := range skills {
				name := color.New(color.Bold).Sprint(s.Name)
				if s.Description != "" {
					fmt.Printf("  %s — %s\n", name, s.Description)
				} else {
					fmt.Printf("  %s\n", name)
				}
			}
			return nil
		},
	}
}

func newSkillAddCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "add <path>",
		Short: "Add a skill from a local path to the global store",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			source := args[0]
			skill, err := svc.Store.Add(source)
			if err != nil {
				return fmt.Errorf("add skill: %w", err)
			}
			color.Green("Added skill %q to the store", skill.Name)
			return nil
		},
	}
}

func newSkillRemoveCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "remove <name>",
		Short: "Remove a skill from the global store",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			name := args[0]
			if !svc.Store.Exists(name) {
				return fmt.Errorf("skill %q not found in the store", name)
			}
			if err := svc.Store.Remove(name); err != nil {
				return err
			}
			color.Green("Removed skill %q from the store", name)
			return nil
		},
	}
}

func newSkillEnableCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "enable <skill-name>",
		Short: "Enable a skill in an environment",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			skillName := args[0]
			envName, _ := cmd.Flags().GetString("env")

			// Default to active env
			if envName == "" {
				state, err := svc.State.Load()
				if err != nil {
					return err
				}
				if state.ActiveEnv == "" {
					return fmt.Errorf("no active environment; specify one with --env <name>")
				}
				envName = state.ActiveEnv
			}

			if !svc.Store.Exists(skillName) {
				return fmt.Errorf("skill %q not found in the store", skillName)
			}

			if err := svc.Env.EnableSkill(envName, skillName); err != nil {
				return err
			}
			color.Green("Enabled skill %q in environment %q", skillName, envName)
			return nil
		},
	}
	cmd.Flags().String("env", "", "target environment (defaults to active env)")
	return cmd
}

func newSkillDisableCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "disable <skill-name>",
		Short: "Disable a skill in an environment",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			skillName := args[0]
			envName, _ := cmd.Flags().GetString("env")

			if envName == "" {
				state, err := svc.State.Load()
				if err != nil {
					return err
				}
				if state.ActiveEnv == "" {
					return fmt.Errorf("no active environment; specify one with --env <name>")
				}
				envName = state.ActiveEnv
			}

			if err := svc.Env.DisableSkill(envName, skillName); err != nil {
				return err
			}
			color.Green("Disabled skill %q in environment %q", skillName, envName)
			return nil
		},
	}
	cmd.Flags().String("env", "", "target environment (defaults to active env)")
	return cmd
}
