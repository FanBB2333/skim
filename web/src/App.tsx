import {
  Archive,
  ArrowRight,
  Boxes,
  Briefcase,
  Download,
  FolderTree,
  Layers,
  Package,
  PackageOpen,
  Power,
  RefreshCw,
  Share2,
  Sparkles,
  Terminal,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const agents = [
  "Claude Code",
  "Codex",
  "Gemini CLI",
  "Qoder",
  "QoderWork",
];

const flowSteps = [
  {
    icon: FolderTree,
    title: "Collect",
    tag: "skim init",
    body: "Take a snapshot of the skills already installed across every agent on your machine, and pull them into one global store.",
    tint: "bg-morandi-sage/25 text-morandi-ink",
  },
  {
    icon: Layers,
    title: "Group",
    tag: "skim env create work",
    body: "Build named environments — work, research, weekend-hack — each with its own curated set of skills.",
    tint: "bg-morandi-slate/25 text-morandi-ink",
  },
  {
    icon: Power,
    title: "Activate",
    tag: "skim activate work",
    body: "One command deploys the environment to every enabled agent. Deactivate cleanly rolls it back.",
    tint: "bg-morandi-clay/25 text-morandi-ink",
  },
  {
    icon: Archive,
    title: "Share",
    tag: "skim pack",
    body: "Export an environment as a portable archive. Unpack on another machine and you're set up in seconds.",
    tint: "bg-morandi-mauve/25 text-morandi-ink",
  },
];

const teamScenarios = [
  {
    icon: UserPlus,
    tint: "bg-morandi-sage/25",
    ring: "ring-morandi-sage/40",
    dot: "bg-morandi-sage",
    label: "Onboarding",
    title: "Day one, same stack as everyone else.",
    body: "A new engineer joins. They install skim, then unpack the team archive. Their Claude, Codex, and Gemini all come up with the same reviewer, style-guide, and codegen skills as the rest of the team.",
    lines: [
      "skim unpack team.tar.gz",
      "skim activate team",
    ],
  },
  {
    icon: RefreshCw,
    tint: "bg-morandi-slate/25",
    ring: "ring-morandi-slate/40",
    dot: "bg-morandi-slate",
    label: "Skills drift",
    title: "One update, everyone in sync.",
    body: "The tech lead tweaks the architecture-review prompt. They re-pack the team env and post the archive; teammates unpack with --force and re-activate. No more \"whose copy is the good one?\"",
    lines: [
      "skim pack --env team -o team-v2.tar.gz",
      "# teammates:",
      "skim unpack team-v2.tar.gz --force",
    ],
  },
  {
    icon: Users,
    tint: "bg-morandi-clay/25",
    ring: "ring-morandi-clay/40",
    dot: "bg-morandi-clay",
    label: "Roles",
    title: "Frontend and platform, side by side.",
    body: "Keep a frontend env with design-system prompts and a platform env with infra docs. Same machine, same agents — switch context with one command whenever you change hats.",
    lines: [
      "skim activate frontend",
      "# later…",
      "skim activate platform",
    ],
  },
  {
    icon: Briefcase,
    tint: "bg-morandi-mauve/25",
    ring: "ring-morandi-mauve/40",
    dot: "bg-morandi-mauve",
    label: "Client isolation",
    title: "One laptop, many clients.",
    body: "Consultancies ship a skim pack per client — house style, review checklists, internal docs. Switching engagements switches every agent's behaviour in lockstep, with no stale prompts leaking between customers.",
    lines: [
      "skim activate client-acme",
      "# …finish the day, move on:",
      "skim activate client-globex",
    ],
  },
];

const lifecycleSteps = [
  {
    phase: "01",
    icon: Download,
    tint: "bg-morandi-sage/25",
    dot: "bg-morandi-sage",
    label: "Install",
    title: "Get skim on your machine.",
    body: "One Go install. No daemons, no global config to hand-edit.",
    lines: ["go install github.com/FanBB2333/skim/cmd/skim@latest"],
  },
  {
    phase: "02",
    icon: FolderTree,
    tint: "bg-morandi-slate/25",
    dot: "bg-morandi-slate",
    label: "Init",
    title: "Snapshot what's already there.",
    body: "skim scans every supported agent and pulls its existing skills into ~/.skim/store. You keep everything you've already built.",
    lines: ["skim init"],
  },
  {
    phase: "03",
    icon: Layers,
    tint: "bg-morandi-clay/25",
    dot: "bg-morandi-clay",
    label: "Create env",
    title: "Group skills by context.",
    body: "An environment is a named set of skills. Keep one for daily work, one for research, one for weekend hacks.",
    lines: [
      "skim env create work",
      "skim skill enable reviewer --env work",
      "skim skill enable codegen --env work",
    ],
  },
  {
    phase: "04",
    icon: Power,
    tint: "bg-morandi-mauve/25",
    dot: "bg-morandi-mauve",
    label: "Activate",
    title: "Deploy to every agent at once.",
    body: "Symlink, hardlink, or copy — skim links the env's skills into Claude, Codex, Gemini, and Qoder in one pass, with a managed marker tracking what it owns.",
    lines: ["skim activate work"],
  },
  {
    phase: "05",
    icon: RefreshCw,
    tint: "bg-morandi-moss/25",
    dot: "bg-morandi-moss",
    label: "Switch",
    title: "Change hats in one command.",
    body: "Activating a different env deactivates the current one cleanly — no stale prompts left behind in any agent's folder.",
    lines: ["skim activate research"],
  },
  {
    phase: "06",
    icon: Archive,
    tint: "bg-morandi-mustard/25",
    dot: "bg-morandi-mustard",
    label: "Pack",
    title: "Export an env as a file.",
    body: "pack bundles the env manifest and every referenced skill into a single tarball. No registry to stand up.",
    lines: ["skim pack --env work -o work.tar.gz"],
  },
  {
    phase: "07",
    icon: Share2,
    tint: "bg-morandi-rose/25",
    dot: "bg-morandi-rose",
    label: "Share",
    title: "Hand it to teammates.",
    body: "Drop the tarball in shared storage, attach it to a pull request, or post it in a release. Whatever your team already uses.",
    lines: ["# push to S3, a release, or a shared drive…"],
  },
  {
    phase: "08",
    icon: PackageOpen,
    tint: "bg-morandi-sage/25",
    dot: "bg-morandi-sage",
    label: "Unpack",
    title: "They pick it up, activate, done.",
    body: "On the other side, unpack imports the env and its skills, and activate deploys them identically — same skills, same versions, same behaviour across the team.",
    lines: ["skim unpack work.tar.gz", "skim activate work"],
  },
];

const commands = [
  { cmd: "skim init", desc: "Create ~/.skim and snapshot current agent skills into a base env" },
  { cmd: "skim add ./my-skill", desc: "Add a skill to the global store" },
  { cmd: "skim install -t qoder ./my-skill", desc: "Store it and deploy to one agent only" },
  { cmd: "skim env create work", desc: "Create a named environment" },
  { cmd: "skim skill enable my-skill --env work", desc: "Put a skill into an environment" },
  { cmd: "skim activate work", desc: "Deploy the environment to every enabled agent" },
  { cmd: "skim deactivate", desc: "Cleanly remove the managed skills" },
  { cmd: "skim pack --env work -o work.tar.gz", desc: "Export environment + referenced skills" },
  { cmd: "skim unpack work.tar.gz", desc: "Import an environment on another machine" },
];

export default function App() {
  return (
    <div className="min-h-full bg-background">
      <Header />
      <main className="pb-24">
        <Hero />
        <Problem />
        <Flow />
        <Diagram />
        <Lifecycle />
        <Teams />
        <Commands />
        <Agents />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="tracking-tight">skim</span>
          <Badge
            variant="secondary"
            className="ml-1 hidden px-2 py-0 text-[10px] font-normal sm:inline-flex"
          >
            skill version manager
          </Badge>
        </div>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground sm:gap-6">
          <a
            href="#flow"
            className="hidden whitespace-nowrap transition hover:text-foreground sm:inline"
          >
            How it works
          </a>
          <a
            href="#lifecycle"
            className="hidden transition hover:text-foreground sm:inline"
          >
            Lifecycle
          </a>
          <a
            href="#commands"
            className="hidden transition hover:text-foreground sm:inline"
          >
            Commands
          </a>
          <a
            href="https://github.com/FanBB2333/skim"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh-light opacity-90" aria-hidden />
      <div className="container relative flex flex-col items-center pt-24 pb-20 text-center sm:pt-32 sm:pb-28">
        <Badge variant="outline" className="mb-6 gap-1.5 bg-background/60 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          One store. Every agent.
        </Badge>
        <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
          Skills that travel
          <br />
          <span className="bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
            with you.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground sm:text-xl">
          skim is a skill version manager for coding agents. Manage one library,
          switch environments like conda, deploy everywhere with one command.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <CodeChip>go install github.com/FanBB2333/skim/cmd/skim@latest</CodeChip>
          <a
            href="#flow"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            See how it works <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function CodeChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 font-mono text-sm shadow-sm">
      <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
      <span>{children}</span>
    </div>
  );
}

function Problem() {
  return (
    <section className="container py-20">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            The problem
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your skills are scattered.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Claude has its folder. Codex has another. Gemini keeps prompts in a
            single Markdown file. Qoder lives somewhere else entirely. You copy
            the same skill five times and forget which copy is the good one.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            The fix
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            One store. Every agent.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Inspired by pnpm's global store and conda's envs: keep one canonical
            copy of each skill, group them into environments, and activate the
            environment you want. skim deploys to every supported agent —
            symlink, hardlink, or copy — so they stay in sync.
          </p>
        </div>
      </div>
    </section>
  );
}

function Flow() {
  return (
    <section id="flow" className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Four verbs.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          Collect, group, activate, share. That's the whole tool.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {flowSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="relative">
              <CardHeader>
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl " +
                      step.tint
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    0{idx + 1}
                  </span>
                </div>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.body}</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="inline-block rounded-md bg-muted px-2 py-1 font-mono text-xs">
                  {step.tag}
                </code>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function Diagram() {
  return (
    <section className="container py-20">
      <Card className="overflow-hidden">
        <CardContent className="p-10 sm:p-16">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-start md:justify-between">
              <DiagramColumn
                icon={Package}
                title="Global store"
                subtitle="~/.skim/store"
                items={["demo-skill", "prompt-pack", "reviewer"]}
                tint="bg-morandi-sage/30"
              />
              <Connector />
              <DiagramColumn
                icon={Boxes}
                title="Environments"
                subtitle="~/.skim/envs"
                items={["base", "work", "research"]}
                highlight="work"
                tint="bg-morandi-slate/30"
              />
              <Connector />
              <DiagramColumn
                icon={Sparkles}
                title="Agents"
                subtitle="deployed"
                items={["~/.claude/skills", "~/.codex/skills", "~/.qoder/skills", "~/.gemini/GEMINI.md"]}
                mono
                tint="bg-morandi-clay/30"
              />
            </div>
            <p className="mt-10 text-center text-sm text-muted-foreground">
              Activating an environment links every skill in that env into every
              enabled agent. Deactivate reverses it, leaving your non-skim files
              untouched.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function DiagramColumn({
  icon: Icon,
  title,
  subtitle,
  items,
  highlight,
  mono,
  tint,
}: {
  icon: typeof Package;
  title: string;
  subtitle: string;
  items: string[];
  highlight?: string;
  mono?: boolean;
  tint: string;
}) {
  return (
    <div className="flex-1">
      <div className="mb-4 flex items-center gap-2">
        <span
          className={
            "inline-flex h-8 w-8 items-center justify-center rounded-lg " + tint
          }
        >
          <Icon className="h-4 w-4 text-morandi-ink" />
        </span>
        <div>
          <div className="text-sm font-semibold tracking-tight">{title}</div>
          <div className="font-mono text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={
              "rounded-md border bg-background/60 px-3 py-2 text-sm " +
              (mono ? "font-mono text-xs " : "") +
              (highlight === item
                ? "border-morandi-clay/60 bg-morandi-clay/15 font-medium"
                : "")
            }
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Connector() {
  return (
    <div className="hidden shrink-0 items-center self-stretch md:flex">
      <div className="flex flex-col items-center justify-center">
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}

function Lifecycle() {
  return (
    <section id="lifecycle" className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          The lifecycle
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Install once. Flow forever.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          Eight stops from a fresh machine to a team sharing the same prompt
          library — with the exact command at each one.
        </p>
      </div>

      <ol className="relative mx-auto mt-16 max-w-3xl">
        <span
          className="absolute left-5 top-2 bottom-2 hidden w-px bg-gradient-to-b from-morandi-sage/40 via-morandi-mauve/40 to-morandi-sage/40 sm:block"
          aria-hidden
        />
        {lifecycleSteps.map((step, idx) => {
          const Icon = step.icon;
          const isLast = idx === lifecycleSteps.length - 1;
          return (
            <li
              key={step.label}
              className={"relative flex gap-5 sm:gap-8 " + (isLast ? "" : "pb-10")}
            >
              <div className="relative flex flex-col items-center">
                <span
                  className={
                    "relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full ring-8 ring-background " +
                    step.tint
                  }
                >
                  <Icon className="h-4 w-4 text-morandi-ink" />
                </span>
              </div>

              <Card className="flex-1 overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {step.phase}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      <span className={"h-1.5 w-1.5 rounded-full " + step.dot} />
                      {step.label}
                    </span>
                  </div>
                  <CardTitle className="mt-1 text-xl">{step.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {step.body}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border bg-background/70 p-4 font-mono text-xs leading-6 text-foreground/80 shadow-sm">
                    {step.lines.map((line) => {
                      const isComment = line.trim().startsWith("#");
                      return (
                        <div
                          key={line}
                          className={
                            isComment
                              ? "text-muted-foreground"
                              : "flex items-start gap-2"
                          }
                        >
                          {!isComment && (
                            <span className="select-none text-muted-foreground">
                              $
                            </span>
                          )}
                          <span className="whitespace-pre-wrap">{line}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Teams() {
  return (
    <section id="teams" className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          For teams
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Same skills, every teammate.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          skim is useful solo, but it really earns its keep when a team shares
          the same prompt library. Four everyday scenarios:
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {teamScenarios.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <Card
              key={scenario.label}
              className={
                "relative overflow-hidden ring-1 " + scenario.ring
              }
            >
              <div
                className={
                  "pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl " +
                  scenario.tint
                }
                aria-hidden
              />
              <CardHeader className="relative">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl " +
                      scenario.tint
                    }
                  >
                    <Icon className="h-4 w-4 text-morandi-ink" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    <span
                      className={"h-1.5 w-1.5 rounded-full " + scenario.dot}
                    />
                    {scenario.label}
                  </span>
                </div>
                <CardTitle className="text-xl">{scenario.title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {scenario.body}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="rounded-xl border bg-background/70 p-4 font-mono text-xs leading-6 text-foreground/80 shadow-sm">
                  {scenario.lines.map((line) => {
                    const isComment = line.trim().startsWith("#");
                    return (
                      <div
                        key={line}
                        className={
                          isComment
                            ? "text-muted-foreground"
                            : "flex items-start gap-2"
                        }
                      >
                        {!isComment && (
                          <span className="select-none text-muted-foreground">
                            $
                          </span>
                        )}
                        <span className="whitespace-pre-wrap">{line}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function Commands() {
  return (
    <section id="commands" className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Commands
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          The whole surface.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          Nine commands cover the daily loop from setup to sync.
        </p>
      </div>

      <Card className="mx-auto mt-12 max-w-3xl overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 font-mono text-xs text-muted-foreground">
            ~/projects
          </span>
        </div>
        <CardContent className="p-0">
          <ul className="divide-y">
            {commands.map((c) => (
              <li
                key={c.cmd}
                className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
              >
                <code className="font-mono text-sm">{c.cmd}</code>
                <span className="text-sm text-muted-foreground">{c.desc}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

function Agents() {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Supported agents
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Works where you already work.
        </h2>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {agents.map((name) => (
          <Badge
            key={name}
            variant="outline"
            className="border-border bg-card px-4 py-2 text-sm font-medium"
          >
            {name}
          </Badge>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-foreground text-background">
            <Sparkles className="h-3 w-3" />
          </span>
          <span>skim · MIT</span>
        </div>
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/FanBB2333/skim"
            className="transition hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href={`${import.meta.env.BASE_URL}docs/`}
            className="transition hover:text-foreground"
          >
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
