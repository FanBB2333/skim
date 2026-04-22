# Minecraft-style illustration prompt for skim

A self-contained prompt for an image model (Midjourney, DALL·E, nano-banana, Imagen, Gemini 2.5 image, etc.) to render skim's project logic in the isometric Minecraft diorama style of the reference.

Paste the **Master prompt** section below into your image tool. Pick one of the **Alternative framings** if you want a different angle on the same story.

---

## Master prompt (triptych: Before → Skim Core → After)

> Isometric Minecraft-style 3D diorama, pixel-art textures, chunky cubes, cel-shaded lighting, sharp edges, warm daylight with dramatic rim lights, rich saturated palette. **Ultra-wide 16:9 composition, split into three labeled panels connected by pixel-art arrows at the top: "Before" → "Skim Core" → "After".** Floating labels use a blocky pixel font on dark brown wooden plaques with a yellow drop shadow, matching Minecraft's in-game text UI.
>
> **Left panel — "Before" (labeled "Manual Copy Hell" on a wooden sign):** a patchy grass-and-dirt biome. Five scattered wooden chests, each with a floating name-tag above it reading "Claude", "Codex", "Qoder", "OpenClaw", and a second "Codex" (to imply duplication). Loose glowing skill scrolls — rectangular parchment items labeled "skills" — lie scattered on the ground between the chests, some half-buried, some glowing softly. A Steve character in the foreground, sweating visibly with cartoon sweat-drop particles, arms thrown up in frustration, looking overwhelmed. Ambient tone: messy, chaotic, dirt paths, weeds poking through.
>
> **Middle panel — "Skim Core" (label at the top):** a raised **obsidian** platform with glowing **purple ender particles** drifting upward. In the center, an **enchanting table with an open glowing book**, a hovering **translucent chest** above it lit by a vertical beam of golden light with the text `skim activate` in yellow pixel font floating inside the beam. Flanking the enchanting table, **two ender chests** (teal with green eye) labeled "work" and "personal" in floating name-tags. Below the platform, a wooden plaque reads `~/.skim/store` in monospaced pixel text. The whole platform emits a soft violet nether-glow. Redstone dust flickers along the edges.
>
> **Right panel — "After" (label at the top):** a clean, well-lit stone-brick plaza with mossy-stone borders and torches on the outer walls. Five neat wooden chests arranged in a gentle arc, each with a floating name-tag: "Claude", "Codex", "Gemini", "Qoder", "OpenClaw", each topped with a **bright green pixel-art checkmark** hovering above it. **Red redstone rails** flow from the Skim Core panel into the After panel, and along each rail a **glowing skill scroll** is being carried into its destination chest — implying deployment. A small wooden sign in the foreground reads "All Synced". Light, airy, content — the "after" of the work.
>
> **Connector arrows:** thick pixel-art arrows at the top between the three panels, rendered as floating Minecraft-style glyphs in the same wooden-plaque UI.
>
> **Bottom banner:** a long wooden plank UI bar spanning the full image width with yellow pixel text: `skim — nvm for AI Agent Skills · Manage once, deploy everywhere`.
>
> **Bottom-right corner:** a small overlaid pixel-art "terminal window" chrome (three traffic-light dots in red/yellow/green on a dark strip) containing a single line in bright green monospaced pixel font: `$ skim activate work → 5 agents ✓`. The checkmark in green.
>
> **Style tags:** isometric 3D diorama, Minecraft texture pack aesthetic, voxel art, pixel-perfect edges, blocky characters, vibrant daylight with purple nether accent in the middle panel, soft ambient occlusion, clean composition, 4K detail, no photorealism, no human anatomy beyond the Steve character, no real-world logos other than the pixel-style labels described.
>
> **Negative prompt:** photo-realism, smooth shading, anti-aliased curves, blurry, film grain, modern UI overlays, real keyboards, floating glass panels, extra characters, anime style.

---

## Alternative framings

### A. Single-scene "lifecycle map" (horizontal journey)

Use this when you want to show the **8-step lifecycle** instead of the Before/After contrast.

> Isometric Minecraft-style 3D diorama, ultra-wide 21:9, a single continuous path winding across a lush grass biome. Eight numbered **wooden signposts** stand along the path, each on its own small platform, connected by a smooth cobblestone road dotted with torches. From left to right the signposts read:
>
> 1. **"01 · Install"** — a single crate being placed by Steve, glowing `go install` particle text above.
> 2. **"02 · Init"** — Steve holding a lantern, scanning loose skill scrolls scattered on the ground and pulling them into a central chest.
> 3. **"03 · Create env"** — two ender chests labeled "work" and "research" being set down on an obsidian pad.
> 4. **"04 · Activate"** — a golden beacon beam shooting straight up, redstone rails snaking outward to four distant agent chests (Claude / Codex / Gemini / Qoder) each with a green checkmark.
> 5. **"05 · Switch"** — Steve flipping a lever, one beacon dimming while another lights up; a floating label "work → research" in yellow pixel font.
> 6. **"06 · Pack"** — a shulker box being sealed with `work.tar.gz` floating above it in monospace pixel text.
> 7. **"07 · Share"** — the shulker box being handed across a river to another Steve on the far bank, with `→` arrow particles.
> 8. **"08 · Unpack"** — the second Steve opening the shulker on an identical platform, skill scrolls flying back out into his own chest row, each marked with a green check.
>
> Bottom banner as in the master prompt. Warm daylight, cel-shaded, pixel-art UI labels on wooden plaques, Minecraft texture pack aesthetic.

### B. Close-up "Skim Core beacon" hero

Use this for a square or vertical hero asset focused just on the central idea.

> Isometric Minecraft diorama, tight 1:1 composition. A single obsidian platform at the center, surrounded by purple ender particles and a vertical beacon beam of golden light. An enchanting table with an open glowing book sits at the platform's center; a translucent hovering chest floats in the beam with pixel text `skim activate` inside. Four redstone rails radiate outward toward the four corners of the image, each ending at a small wooden chest labeled "Claude", "Codex", "Gemini", "Qoder", each with a green pixel-art checkmark hovering above. A wooden plaque on the platform base reads `~/.skim/store`. The whole scene is lit with soft violet nether-glow plus warm torch light from the four agent platforms. Minecraft texture pack aesthetic, pixel-art UI labels, chunky voxel edges, no photorealism.

---

## What the scene should encode (project-logic cheatsheet)

Give this as **extra context** alongside the prompt if your image tool supports follow-up instructions. It explains *why* each element is there, so the model picks meaningful props.

- **skim** is a version manager for AI-coding-agent skills, in the spirit of `nvm` for Node, `conda` for Python envs, or `pnpm` for packages.
- **The problem (left panel):** every agent (Claude Code, Codex, Gemini CLI, Qoder, OpenClaw) stores prompts/skills in its own folder. Users copy the same skill into every folder by hand → duplication, drift, "which copy is the good one?"
- **The solution (middle panel):** one **global store** at `~/.skim/store` holds the canonical copy of every skill. **Environments** (like `work`, `personal`, `research`) are named sets of skills — think conda envs.
- **Activation (the beacon):** `skim activate <env>` deploys the env's skills to every enabled agent in one pass, via symlink, hardlink, or copy. A marker file tracks what skim owns so deactivation is clean.
- **Sharing (packaging):** `skim pack --env work -o work.tar.gz` exports an env + its skills as a portable tarball. `skim unpack work.tar.gz` imports it on another machine — teammates, new laptops, or client handoffs all end up with identical skill sets.
- **Visual metaphors:**
  - **Wooden chest** = an agent's skill folder.
  - **Glowing scroll** = an individual skill.
  - **Ender chest (teal + green eye)** = an environment (named, swappable).
  - **Obsidian platform / beacon** = the skim core — does the linking.
  - **Redstone rails** = the deployment links from core to agents.
  - **Green checkmark above a chest** = "this agent is in sync".
  - **Shulker box** = a packed, portable env tarball.
  - **Two Steves across a river** = teammate handoff via `pack` + `unpack`.

---

## Tips for getting a good render

- **Start with 16:9** for the triptych, **21:9** for the horizontal lifecycle map, **1:1** for the beacon hero.
- Minecraft-style image models sometimes default to **game screenshots** — explicitly ask for "diorama" or "isometric render" to keep it clearly illustrative.
- If the model struggles with labels, generate the scene without text first, then add typography in a second pass (Figma / Photoshop) using a pixel font like **Minecraft**, **VT323**, or **Press Start 2P**.
- The **purple nether glow** on the middle panel is the key visual tell — insist on it if the model skips it.
- Ask for **"no people other than the Steve character(s) described"** if you keep getting extra villagers or mobs.
