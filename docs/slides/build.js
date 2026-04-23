// Chinese intro deck for skim — rendered with pptxgenjs.
// Light Morandi palette, 9 slides, sandwich structure (dark cover + dark close).
// Run: node build.js

const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333" x 7.5"
pres.author = "skim";
pres.title = "skim · 介绍";

// ---------- palette ----------
const C = {
  inkDark: "2F3833",        // dark sage-ink for cover + close
  inkDarkAlt: "263029",     // slightly deeper for footer accents on dark slides
  creamBg: "F5EFE2",        // content bg — warm paper
  paper: "FFFBF2",          // cards
  ink: "3A3A38",            // body ink
  inkSoft: "6F6A62",        // muted
  inkMuted: "9A948A",       // light caption
  border: "D9D1BF",         // card border
  sage: "A9B9A4",
  slate: "95A8B5",
  clay: "C9A292",
  mauve: "B09FAB",
  mustard: "C8B585",
  moss: "889583",
};

const FONT_HEAD = "Microsoft YaHei";
const FONT_BODY = "Microsoft YaHei";
const FONT_MONO = "Menlo";

// Slide content area helpers (WIDE = 13.333 x 7.5)
const W = 13.333;
const H = 7.5;

// ---------- small helpers ----------
function fmtShadow() {
  return { type: "outer", blur: 12, offset: 2, angle: 90, color: "000000", opacity: 0.08 };
}

function eyebrow(slide, text, x, y) {
  slide.addText(text, {
    x, y, w: W - x - 0.5, h: 0.35,
    fontFace: FONT_BODY, fontSize: 11, color: C.inkMuted,
    charSpacing: 6, bold: false, margin: 0,
  });
}

function sectionTitle(slide, text, x, y, w) {
  slide.addText(text, {
    x, y, w, h: 1.0,
    fontFace: FONT_HEAD, fontSize: 40, bold: true, color: C.ink,
    margin: 0, valign: "top",
  });
}

function dot(slide, x, y, color) {
  slide.addShape(pres.shapes.OVAL, {
    x, y, w: 0.14, h: 0.14, fill: { color }, line: { color, width: 0 },
  });
}

function card(slide, x, y, w, h) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: C.paper },
    line: { color: C.border, width: 0.75 },
    rectRadius: 0.12,
    shadow: fmtShadow(),
  });
}

function tintChip(slide, x, y, size, color) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w: size, h: size,
    fill: { color, transparency: 45 },
    line: { color, width: 0 },
    rectRadius: 0.08,
  });
}

// footer on content slides
function footer(slide, n, total) {
  slide.addText("skim · 技能版本管理器", {
    x: 0.6, y: H - 0.5, w: 6, h: 0.3,
    fontFace: FONT_BODY, fontSize: 10, color: C.inkMuted, margin: 0,
  });
  slide.addText(`${n} / ${total}`, {
    x: W - 1.2, y: H - 0.5, w: 0.6, h: 0.3,
    fontFace: FONT_BODY, fontSize: 10, color: C.inkMuted, align: "right", margin: 0,
  });
}

const TOTAL = 9;

// ================================================================
// Slide 1 — Cover (dark)
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.inkDark };

  // tiny wordmark pill top-left
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: 0.65, w: 0.9, h: 0.38,
    fill: { color: C.sage, transparency: 35 },
    line: { color: C.sage, width: 0 },
    rectRadius: 0.18,
  });
  s.addText("skim", {
    x: 0.7, y: 0.65, w: 0.9, h: 0.38,
    fontFace: FONT_BODY, fontSize: 11, color: "F3ECDD",
    align: "center", valign: "middle", bold: true, margin: 0,
  });

  // soft accent dots (decorative, not a line)
  dot(s, 0.7, 1.45, C.sage);
  dot(s, 0.95, 1.45, C.slate);
  dot(s, 1.2, 1.45, C.clay);

  // wordmark / title
  s.addText("skim", {
    x: 0.6, y: 2.0, w: 12, h: 2.0,
    fontFace: FONT_HEAD, fontSize: 140, bold: true, color: "F3ECDD",
    margin: 0, valign: "top",
  });

  s.addText("让 AI 编程代理，共享同一套技能库。", {
    x: 0.7, y: 4.1, w: 12, h: 0.8,
    fontFace: FONT_HEAD, fontSize: 28, color: C.sage, margin: 0,
  });

  s.addText("skill version manager · 技能版本管理器", {
    x: 0.7, y: 4.85, w: 12, h: 0.5,
    fontFace: FONT_BODY, fontSize: 14, color: "BFB9A8", margin: 0,
  });

  // bottom line with link + date
  s.addText("github.com/FanBB2333/skim", {
    x: 0.7, y: H - 0.7, w: 6, h: 0.3,
    fontFace: FONT_MONO, fontSize: 11, color: "9A9690", margin: 0,
  });
  s.addText("v1 · 2026", {
    x: W - 2.0, y: H - 0.7, w: 1.4, h: 0.3,
    fontFace: FONT_BODY, fontSize: 11, color: "9A9690", align: "right", margin: 0,
  });
}

// ================================================================
// Slide 2 — 问题
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.creamBg };

  eyebrow(s, "问 题   ·   T H E   P R O B L E M", 0.7, 0.55);
  sectionTitle(s, "你的技能，到处都是。", 0.7, 0.95, 8);

  s.addText([
    { text: "Claude 有自己的 skills 目录，Codex 有另一个，", options: { breakLine: true } },
    { text: "Gemini 把提示塞进一个 Markdown，Qoder 又是另一套。", options: { breakLine: true } },
    { text: "" , options: { breakLine: true } },
    { text: "一个技能，你复制了五遍，却说不清哪一份是最新的。" },
  ], {
    x: 0.7, y: 2.3, w: 6.2, h: 2.4,
    fontFace: FONT_BODY, fontSize: 18, color: C.ink, lineSpacingMultiple: 1.35, margin: 0,
  });

  // 2x2 agent tiles on the right
  const agents = [
    { name: "Claude Code", path: "~/.claude/skills", color: C.sage },
    { name: "Codex",       path: "~/.codex/skills",  color: C.slate },
    { name: "Gemini CLI",  path: "~/.gemini/GEMINI.md", color: C.clay },
    { name: "Qoder",       path: "~/.qoder/skills",  color: C.mauve },
  ];
  const gx = 7.6, gy = 2.25, cw = 2.45, ch = 1.2, gap = 0.2;
  agents.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * (cw + gap);
    const y = gy + row * (ch + gap);
    card(s, x, y, cw, ch);
    tintChip(s, x + 0.25, y + 0.28, 0.4, a.color);
    s.addText(a.name, {
      x: x + 0.78, y: y + 0.2, w: cw - 0.9, h: 0.35,
      fontFace: FONT_HEAD, fontSize: 13, bold: true, color: C.ink, margin: 0,
    });
    s.addText(a.path, {
      x: x + 0.78, y: y + 0.55, w: cw - 0.9, h: 0.45,
      fontFace: FONT_MONO, fontSize: 10, color: C.inkSoft, margin: 0,
    });
  });

  // sub-caption under the 2x2
  s.addText("四个工具 · 四套目录 · 一个痛点：复制粘贴。", {
    x: 7.6, y: 5.05, w: 5.1, h: 0.4,
    fontFace: FONT_BODY, fontSize: 12, color: C.inkSoft, italic: true, margin: 0,
  });

  footer(s, 2, TOTAL);
}

// ================================================================
// Slide 3 — skim 是什么
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.creamBg };

  eyebrow(s, "S K I M   是 什 么", 0.7, 0.55);
  sectionTitle(s, "一个技能库，跑遍所有 Agent。", 0.7, 0.95, 10);

  s.addText([
    { text: "灵感来自 pnpm 的全局 store 和 conda 的 env：", options: { breakLine: true } },
    { text: "一份规范的技能源文件，多个可切换的环境，", options: { breakLine: true } },
    { text: "一条命令就把环境部署到每个支持的 Agent。", options: { } },
  ], {
    x: 0.7, y: 2.2, w: 7.5, h: 2.0,
    fontFace: FONT_BODY, fontSize: 18, color: C.ink, lineSpacingMultiple: 1.4, margin: 0,
  });

  // three-row comparison: like nvm / like pnpm / like conda
  const rows = [
    { icon: "⌁", title: "像 nvm",  body: "按需切换，不冲突。", color: C.sage },
    { icon: "◎", title: "像 pnpm", body: "共享一份源，不重复。", color: C.slate },
    { icon: "❖", title: "像 conda", body: "多环境并存，按场景激活。", color: C.clay },
  ];
  rows.forEach((r, i) => {
    const y = 2.35 + i * 1.2;
    tintChip(s, 9.1, y, 0.55, r.color);
    s.addText(r.title, {
      x: 9.85, y: y - 0.05, w: 3.2, h: 0.4,
      fontFace: FONT_HEAD, fontSize: 16, bold: true, color: C.ink, margin: 0,
    });
    s.addText(r.body, {
      x: 9.85, y: y + 0.35, w: 3.2, h: 0.4,
      fontFace: FONT_BODY, fontSize: 12, color: C.inkSoft, margin: 0,
    });
  });

  // pull quote
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: 5.7, w: 0.08, h: 1.0, fill: { color: C.sage }, line: { color: C.sage, width: 0 },
  });
  s.addText("一处管理，随处部署。", {
    x: 0.95, y: 5.7, w: 7, h: 0.45,
    fontFace: FONT_HEAD, fontSize: 20, bold: true, color: C.ink, margin: 0,
  });
  s.addText("管一份技能库，让每个代理都用同一份最新版本。", {
    x: 0.95, y: 6.15, w: 8, h: 0.45,
    fontFace: FONT_BODY, fontSize: 13, color: C.inkSoft, margin: 0,
  });

  footer(s, 3, TOTAL);
}

// ================================================================
// Slide 4 — 四步走
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.creamBg };

  eyebrow(s, "四 步 走   ·   F O U R   V E R B S", 0.7, 0.55);
  sectionTitle(s, "四个动作，覆盖整个流程。", 0.7, 0.95, 10);

  const steps = [
    { n: "01", title: "收集  Collect",  body: "扫描现有 Agent 的技能，汇聚到全局 store。", cmd: "skim init",             color: C.sage },
    { n: "02", title: "分组  Group",    body: "把技能归入环境：work、research、weekend-hack。", cmd: "skim env create work", color: C.slate },
    { n: "03", title: "激活  Activate", body: "一条命令部署到所有启用的 Agent，随时回滚。", cmd: "skim activate work",  color: C.clay },
    { n: "04", title: "分享  Share",    body: "把环境打包成压缩包，换台机器解包即用。", cmd: "skim pack",            color: C.mauve },
  ];

  const cw = 5.9, ch = 2.2, gx = 0.7, gy = 2.2, gap = 0.25;
  steps.forEach((st, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * (cw + gap);
    const y = gy + row * (ch + gap);
    card(s, x, y, cw, ch);
    tintChip(s, x + 0.35, y + 0.35, 0.55, st.color);
    s.addText(st.n, {
      x: x + cw - 1.0, y: y + 0.3, w: 0.8, h: 0.3,
      fontFace: FONT_MONO, fontSize: 11, color: C.inkMuted, align: "right", margin: 0,
    });
    s.addText(st.title, {
      x: x + 1.1, y: y + 0.35, w: cw - 2.0, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 20, bold: true, color: C.ink, margin: 0,
    });
    s.addText(st.body, {
      x: x + 1.1, y: y + 0.85, w: cw - 1.4, h: 0.7,
      fontFace: FONT_BODY, fontSize: 13, color: C.inkSoft, lineSpacingMultiple: 1.3, margin: 0,
    });
    // command chip
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.35, y: y + ch - 0.7, w: cw - 0.7, h: 0.48,
      fill: { color: "EDE4D0" }, line: { color: C.border, width: 0.5 }, rectRadius: 0.08,
    });
    s.addText(`$ ${st.cmd}`, {
      x: x + 0.5, y: y + ch - 0.7, w: cw - 1.0, h: 0.48,
      fontFace: FONT_MONO, fontSize: 12, color: C.ink, valign: "middle", margin: 0,
    });
  });

  footer(s, 4, TOTAL);
}

// ================================================================
// Slide 5 — 存储 → 环境 → Agent
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.creamBg };

  eyebrow(s, "数 据 流   ·   S T O R E   →   E N V   →   A G E N T", 0.7, 0.55);
  sectionTitle(s, "全局存储 → 环境 → Agent", 0.7, 0.95, 10);

  const cols = [
    { label: "全局 Store", sub: "~/.skim/store", color: C.sage,
      items: ["demo-skill", "prompt-pack", "reviewer"] },
    { label: "环境 Envs",  sub: "~/.skim/envs",  color: C.slate,
      items: ["base", "work  ←", "research"] },
    { label: "Agents",     sub: "已部署",          color: C.clay,
      items: ["~/.claude/skills", "~/.codex/skills", "~/.qoder/skills", "~/.gemini/GEMINI.md"] },
  ];

  const cardW = 3.7, cardH = 3.9, gap = 0.45;
  const totalW = cardW * 3 + gap * 2;
  const startX = (W - totalW) / 2;
  const topY = 2.3;

  cols.forEach((c, i) => {
    const x = startX + i * (cardW + gap);
    card(s, x, topY, cardW, cardH);
    tintChip(s, x + 0.3, topY + 0.3, 0.55, c.color);
    s.addText(c.label, {
      x: x + 1.0, y: topY + 0.3, w: cardW - 1.1, h: 0.45,
      fontFace: FONT_HEAD, fontSize: 16, bold: true, color: C.ink, margin: 0,
    });
    s.addText(c.sub, {
      x: x + 1.0, y: topY + 0.72, w: cardW - 1.1, h: 0.35,
      fontFace: FONT_MONO, fontSize: 10, color: C.inkMuted, margin: 0,
    });
    // items list
    c.items.forEach((it, j) => {
      const iy = topY + 1.35 + j * 0.5;
      const highlighted = it.endsWith("←");
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: x + 0.3, y: iy, w: cardW - 0.6, h: 0.4,
        fill: { color: highlighted ? "E9D8CC" : "FBF6EA" },
        line: { color: highlighted ? C.clay : C.border, width: highlighted ? 1 : 0.5 },
        rectRadius: 0.06,
      });
      s.addText(it.replace("  ←", ""), {
        x: x + 0.45, y: iy, w: cardW - 0.9, h: 0.4,
        fontFace: FONT_MONO, fontSize: 11, color: highlighted ? C.ink : C.inkSoft,
        bold: highlighted, valign: "middle", margin: 0,
      });
    });
  });

  // arrows between columns
  const arrowY = topY + cardH / 2;
  for (let i = 0; i < 2; i++) {
    const ax = startX + (i + 1) * cardW + i * gap + 0.08;
    s.addText("→", {
      x: ax, y: arrowY - 0.25, w: gap - 0.15, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 22, color: C.inkSoft, align: "center", valign: "middle", margin: 0,
    });
  }

  s.addText("激活一个环境 = 把该环境里的每个技能链接到每个启用的 Agent；停用则干净地回滚。", {
    x: 0.7, y: topY + cardH + 0.4, w: 12, h: 0.5,
    fontFace: FONT_BODY, fontSize: 12, color: C.inkSoft, align: "center", italic: true, margin: 0,
  });

  footer(s, 5, TOTAL);
}

// ================================================================
// Slide 6 — 团队协作
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.creamBg };

  eyebrow(s, "团 队 协 作   ·   F O R   T E A M S", 0.7, 0.55);
  sectionTitle(s, "同一套技能，每位队友。", 0.7, 0.95, 10);

  const cases = [
    { tag: "入  职",      title: "第一天，同款技能栈。", body: "新同学装好 skim，解包团队 tar.gz，Claude / Codex / Gemini 立刻对齐。", color: C.sage },
    { tag: "更新同步",    title: "改一处，所有人同步。", body: "架构师更新了 reviewer 提示，重新 pack；队友一条命令 --force 覆盖。", color: C.slate },
    { tag: "角色切换",    title: "前端与平台，一键切换。", body: "frontend 环境与 platform 环境并存；换岗位就换环境，Agent 跟着切。", color: C.clay },
    { tag: "客户隔离",    title: "一台电脑，多个客户。", body: "为每个客户打包独立 skim 环境，切换客户时 Agent 的行为整体切换。", color: C.mauve },
  ];

  const cw = 5.9, ch = 2.2, gx = 0.7, gy = 2.2, gap = 0.25;
  cases.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * (cw + gap);
    const y = gy + row * (ch + gap);
    card(s, x, y, cw, ch);
    // tag pill
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.35, y: y + 0.32, w: 1.2, h: 0.36,
      fill: { color: c.color, transparency: 45 },
      line: { color: c.color, width: 0 },
      rectRadius: 0.18,
    });
    s.addText(c.tag, {
      x: x + 0.35, y: y + 0.32, w: 1.2, h: 0.36,
      fontFace: FONT_BODY, fontSize: 10, bold: true, color: C.ink,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(c.title, {
      x: x + 0.35, y: y + 0.82, w: cw - 0.7, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 17, bold: true, color: C.ink, margin: 0,
    });
    s.addText(c.body, {
      x: x + 0.35, y: y + 1.32, w: cw - 0.7, h: 0.9,
      fontFace: FONT_BODY, fontSize: 12.5, color: C.inkSoft, lineSpacingMultiple: 1.3, margin: 0,
    });
  });

  footer(s, 6, TOTAL);
}

// ================================================================
// Slide 7 — 常用命令
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.creamBg };

  eyebrow(s, "命 令 清 单   ·   C O M M A N D S", 0.7, 0.55);
  sectionTitle(s, "九个命令，覆盖日常。", 0.7, 0.95, 10);

  // terminal-style card
  const tx = 1.0, ty = 2.25, tw = 11.3, th = 4.55;
  card(s, tx, ty, tw, th);

  // header bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: tx + 0.01, y: ty + 0.01, w: tw - 0.02, h: 0.45,
    fill: { color: "ECE4D0" }, line: { color: C.border, width: 0 },
  });
  // traffic lights
  [["E07E6B", 0], ["D9B36A", 0.25], ["8FB38F", 0.5]].forEach(([color, dx]) => {
    s.addShape(pres.shapes.OVAL, {
      x: tx + 0.25 + dx, y: ty + 0.14, w: 0.18, h: 0.18,
      fill: { color }, line: { color, width: 0 },
    });
  });
  s.addText("~/projects", {
    x: tx + 1.25, y: ty + 0.04, w: 4, h: 0.4,
    fontFace: FONT_MONO, fontSize: 10, color: C.inkMuted, valign: "middle", margin: 0,
  });

  const cmds = [
    ["skim init",                        "初始化 ~/.skim，快照当前 Agent 的技能到 base 环境"],
    ["skim add ./my-skill",              "把技能加入全局 store"],
    ["skim install -t qoder ./my-skill", "加入 store 并只部署到指定 Agent"],
    ["skim env create work",             "创建一个命名环境"],
    ["skim skill enable my-skill --env work", "把技能加入环境"],
    ["skim activate work",               "把环境部署到每个启用的 Agent"],
    ["skim deactivate",                  "干净地移除被 skim 管理的技能"],
    ["skim pack --env work -o work.tar.gz", "导出环境 + 依赖技能"],
    ["skim unpack work.tar.gz",          "在另一台机器上导入环境"],
  ];

  const rowH = 0.42, listY = ty + 0.58;
  cmds.forEach((c, i) => {
    const y = listY + i * rowH;
    if (i > 0) {
      s.addShape(pres.shapes.LINE, {
        x: tx + 0.4, y, w: tw - 0.8, h: 0,
        line: { color: C.border, width: 0.5 },
      });
    }
    s.addText(`$ ${c[0]}`, {
      x: tx + 0.4, y: y + 0.02, w: 5.2, h: rowH - 0.04,
      fontFace: FONT_MONO, fontSize: 11.5, color: C.ink, valign: "middle", margin: 0,
    });
    s.addText(c[1], {
      x: tx + 5.7, y: y + 0.02, w: tw - 6.1, h: rowH - 0.04,
      fontFace: FONT_BODY, fontSize: 11.5, color: C.inkSoft, valign: "middle", margin: 0,
    });
  });

  footer(s, 7, TOTAL);
}

// ================================================================
// Slide 8 — 支持的 Agent
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.creamBg };

  eyebrow(s, "支 持 的 A G E N T   ·   S U P P O R T E D", 0.7, 0.55);
  sectionTitle(s, "在你已经用的工具里工作。", 0.7, 0.95, 10);

  const agents = [
    { name: "Claude Code", sub: "~/.claude/skills",    color: C.sage },
    { name: "Codex",       sub: "~/.codex/skills",     color: C.slate },
    { name: "Gemini CLI",  sub: "~/.gemini/GEMINI.md", color: C.clay },
    { name: "Qoder",       sub: "~/.qoder/skills",     color: C.mauve },
    { name: "QoderWork",   sub: "~/.qoder-work",       color: C.mustard },
  ];

  const cardW = 2.3, cardH = 2.4, gap = 0.25;
  const totalW = cardW * 5 + gap * 4;
  const startX = (W - totalW) / 2;
  const topY = 2.5;

  agents.forEach((a, i) => {
    const x = startX + i * (cardW + gap);
    card(s, x, topY, cardW, cardH);
    // tint circle
    s.addShape(pres.shapes.OVAL, {
      x: x + cardW / 2 - 0.45, y: topY + 0.4, w: 0.9, h: 0.9,
      fill: { color: a.color, transparency: 45 },
      line: { color: a.color, width: 0 },
    });
    s.addText(a.name.charAt(0), {
      x: x + cardW / 2 - 0.45, y: topY + 0.4, w: 0.9, h: 0.9,
      fontFace: FONT_HEAD, fontSize: 28, bold: true, color: C.ink,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(a.name, {
      x: x + 0.15, y: topY + 1.4, w: cardW - 0.3, h: 0.4,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: C.ink,
      align: "center", margin: 0,
    });
    s.addText(a.sub, {
      x: x + 0.15, y: topY + 1.8, w: cardW - 0.3, h: 0.4,
      fontFace: FONT_MONO, fontSize: 9, color: C.inkMuted,
      align: "center", margin: 0,
    });
  });

  s.addText("策略可选：symlink · hardlink · copy。默认 symlink，保持源与部署点同步。", {
    x: 0.7, y: topY + cardH + 0.4, w: 12, h: 0.4,
    fontFace: FONT_BODY, fontSize: 12, color: C.inkSoft, align: "center", italic: true, margin: 0,
  });

  footer(s, 8, TOTAL);
}

// ================================================================
// Slide 9 — 结束 (dark)
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: C.inkDark };

  // decorative dots
  dot(s, 0.7, 0.95, C.sage);
  dot(s, 0.95, 0.95, C.slate);
  dot(s, 1.2, 0.95, C.clay);

  s.addText("开始用 skim。", {
    x: 0.7, y: 1.5, w: 12, h: 1.6,
    fontFace: FONT_HEAD, fontSize: 64, bold: true, color: "F3ECDD", margin: 0,
  });

  s.addText("一条命令，装上。", {
    x: 0.7, y: 3.0, w: 12, h: 0.6,
    fontFace: FONT_HEAD, fontSize: 22, color: C.sage, margin: 0,
  });

  // install chip
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: 3.75, w: 8.5, h: 0.75,
    fill: { color: C.inkDarkAlt },
    line: { color: "4A544C", width: 0.75 },
    rectRadius: 0.12,
  });
  s.addText("$ go install github.com/FanBB2333/skim/cmd/skim@latest", {
    x: 0.95, y: 3.75, w: 8.0, h: 0.75,
    fontFace: FONT_MONO, fontSize: 14, color: "F3ECDD", valign: "middle", margin: 0,
  });

  // links block
  const links = [
    ["项目地址", "github.com/FanBB2333/skim"],
    ["落地页",   "web/ 内，使用 Vite + React"],
    ["协议",     "MIT"],
  ];
  links.forEach(([label, value], i) => {
    const y = 5.05 + i * 0.55;
    s.addText(label, {
      x: 0.7, y, w: 1.8, h: 0.4,
      fontFace: FONT_BODY, fontSize: 12, color: C.sage, margin: 0,
    });
    s.addText(value, {
      x: 2.5, y, w: 10, h: 0.4,
      fontFace: FONT_MONO, fontSize: 12, color: "F3ECDD", margin: 0,
    });
  });

  s.addText("谢谢观看", {
    x: W - 4.5, y: H - 1.1, w: 3.8, h: 0.5,
    fontFace: FONT_HEAD, fontSize: 20, color: "BFB9A8", align: "right", margin: 0,
  });
  s.addText("skim · skill version manager", {
    x: W - 4.5, y: H - 0.6, w: 3.8, h: 0.3,
    fontFace: FONT_BODY, fontSize: 10, color: "9A9690", align: "right", margin: 0,
  });
}

// ---------- write ----------
pres.writeFile({ fileName: "skim-intro-zh.pptx" }).then((f) => {
  console.log("wrote:", f);
});
