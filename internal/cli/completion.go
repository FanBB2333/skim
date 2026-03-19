package cli

import (
	"os"

	"github.com/spf13/cobra"
)

func newCompletionCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "completion [bash|zsh|fish|powershell]",
		Short: "Generate shell completion script",
		Long: `To load completions:

Bash:
  $ source <(skim completion bash)
  # To load completions for each session, execute once:
  # Linux:
  $ skim completion bash > /etc/bash_completion.d/skim
  # macOS:
  $ skim completion bash > $(brew --prefix)/etc/bash_completion.d/skim

Zsh:
  # If shell completion is not already enabled in your environment,
  # enable it by running:
  $ echo "autoload -U compinit; compinit" >> ~/.zshrc
  # Then load completions for each session:
  $ source <(skim completion zsh)
  # To load completions for each session, execute once:
  $ skim completion zsh > "${fpath[1]}/_skim"

Fish:
  $ skim completion fish | source
  # To load completions for each session, execute once:
  $ skim completion fish > ~/.config/fish/completions/skim.fish

PowerShell:
  PS> skim completion powershell | Out-String | Invoke-Expression
  # To load completions for each session, add to your profile:
  PS> skim completion powershell >> $PROFILE
`,
		DisableFlagsInUseLine: true,
		ValidArgs:             []string{"bash", "zsh", "fish", "powershell"},
		Args:                  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
		Run: func(cmd *cobra.Command, args []string) {
			switch args[0] {
			case "bash":
				cmd.Root().GenBashCompletion(os.Stdout)
			case "zsh":
				cmd.Root().GenZshCompletion(os.Stdout)
			case "fish":
				cmd.Root().GenFishCompletion(os.Stdout, true)
			case "powershell":
				cmd.Root().GenPowerShellCompletionWithDesc(os.Stdout)
			}
		},
	}
	return cmd
}
