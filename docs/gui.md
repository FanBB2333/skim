# GUI Application

Skim includes a desktop GUI application built with [Wails](https://wails.io/) (Go backend + React frontend).

## Building the GUI

```bash
# Prerequisites: Go 1.21+, Node.js 18+, Wails CLI
# Install Wails CLI if not already installed
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Build the GUI
make build-gui

# Or run in development mode
make dev-gui
```

## Views

### Dashboard

The dashboard provides an overview of your skill management status:

- **Statistics** — Skills in store, environments, available agents, deployed skills
- **Supported Frameworks** — All supported agent frameworks with availability status
- **Active Environment** — Current active environment with deployed skill details
- **Agents** — Quick access to agent details

### Skills

Manage skills with three layout modes:

- **List** — Simple skill list with environment checkboxes
- **Split** — Side-by-side view of agent skills and store skills
- **Graph** — Visual connection diagram showing skill-to-agent relationships with interactive highlighting

!!! tip "Right-click context menu"
    Right-click on any skill to access quick actions: install to a specific agent, add/remove from environment, or remove from store.

### Environments

Create and manage skill environments:

- Create new environments
- Add/remove skills
- Activate/deactivate environments
- View per-environment skill details

### Agents

View and manage agent frameworks:

- Agent availability status
- Installed skill count
- Skill content editor (Monaco Editor)
- Managed vs external skill indicators

### Settings

Configure Skim preferences:

- **Theme** — Choose from 5 color themes (Morandi Light, Morandi Dark, Ocean, Forest, Rose)
- **UI Preferences** — Font family and size customization
- **Agent Configuration** — Enable/disable agents
- **Storage & Data** — Link strategy (symlink/hardlink), directory info
- **Danger Zone** — Reset configuration

## Features

### Context Menu

Right-click on skills to access quick actions:

- **Skills view** — Add/remove from environment, install to specific agent, remove from store
- **Agent detail view** — View/edit skill content, remove managed skill

### Graph View

The graph view shows a visual diagram of skill-to-agent relationships:

- Skills on the left, agents on the right
- Solid lines = skim-managed skills
- Dashed lines = externally installed skills
- Hover to highlight connections

### Link Strategy

Choose how skills are deployed:

| Strategy | Description |
|----------|-------------|
| `symlink` | Create symbolic links (default, saves space, instant updates) |
| `hardlink` | Create real directories with hard-linked files from the store |

Switch between strategies in Settings > Storage & Data.
