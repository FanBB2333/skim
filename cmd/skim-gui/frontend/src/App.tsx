import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import Editor from '@monaco-editor/react';
import { api } from './wailsjs';
import type { StatusResponse, SkillInfo, EnvInfo, AgentInfo, OperationResult, SkillRef, ConfigResponse } from './types';

type View = 'dashboard' | 'skills' | 'envs' | 'agents' | 'settings';

type ThemeId = 'morandi-light' | 'morandi-dark' | 'ocean' | 'forest' | 'rose';

/* ===== Context Menu ===== */
interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuState {
  x: number;
  y: number;
  items: (ContextMenuItem | 'separator' | { label: string; type: 'label' })[];
}

function ContextMenu({ menu, onClose }: { menu: ContextMenuState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler); };
  }, [onClose]);

  // Adjust position if it overflows the viewport
  const style: React.CSSProperties = { left: menu.x, top: menu.y };
  if (typeof window !== 'undefined') {
    if (menu.x + 200 > window.innerWidth) style.left = menu.x - 200;
    if (menu.y + 300 > window.innerHeight) style.top = Math.max(4, menu.y - 300);
  }

  return (
    <div className="context-menu" ref={ref} style={style}>
      {menu.items.map((item, i) => {
        if (item === 'separator') return <div key={i} className="context-menu-separator" />;
        if ('type' in item && item.type === 'label') return <div key={i} className="context-menu-label">{item.label}</div>;
        const menuItem = item as ContextMenuItem;
        return (
          <div key={i} className={`context-menu-item ${menuItem.danger ? 'danger' : ''}`} onClick={() => { menuItem.onClick(); onClose(); }}>
            {menuItem.icon}
            {menuItem.label}
          </div>
        );
      })}
    </div>
  );
}

interface ThemeDef {
  id: ThemeId;
  name: string;
  preview: [string, string, string]; // three colors for preview swatch
  vars: Record<string, string>;
}

const THEMES: ThemeDef[] = [
  {
    id: 'morandi-light', name: 'Morandi Light',
    preview: ['#f5f0eb', '#7a6d5e', '#ffffff'],
    vars: {
      '--bg-primary': '#f5f0eb', '--bg-secondary': '#e8e0d8', '--bg-tertiary': '#d9d0c6', '--bg-card': '#ffffff',
      '--text-primary': '#3a3530', '--text-secondary': '#7a736a',
      '--accent': '#8b7e6e', '--accent-hover': '#7a6d5e', '--accent-active': '#695e50',
      '--success': '#6b8f63', '--warning': '#b8952e', '--danger': '#b56b6b',
      '--border': '#ccc4bb', '--border-light': '#e0d9d2',
      '--shadow': 'rgba(74, 69, 64, 0.08)', '--sidebar-active-bg': 'rgba(155, 142, 126, 0.15)',
    },
  },
  {
    id: 'morandi-dark', name: 'Morandi Dark',
    preview: ['#1e1c1b', '#c8bfb2', '#302d2b'],
    vars: {
      '--bg-primary': '#1e1c1b', '--bg-secondary': '#171615', '--bg-tertiary': '#121110', '--bg-card': '#302d2b',
      '--text-primary': '#e8e3dd', '--text-secondary': '#a09789',
      '--accent': '#c8bfb2', '--accent-hover': '#d5cdc0', '--accent-active': '#e0d9cd',
      '--success': '#7db87a', '--warning': '#d4a94e', '--danger': '#cf7070',
      '--border': '#504b47', '--border-light': '#403c39',
      '--shadow': 'rgba(0, 0, 0, 0.3)', '--sidebar-active-bg': 'rgba(200, 191, 178, 0.15)',
    },
  },
  {
    id: 'ocean', name: 'Ocean',
    preview: ['#e8eff7', '#3d6a94', '#ffffff'],
    vars: {
      '--bg-primary': '#e8eff7', '--bg-secondary': '#d8e4f0', '--bg-tertiary': '#c5d5e6', '--bg-card': '#ffffff',
      '--text-primary': '#1e3248', '--text-secondary': '#5e7a94',
      '--accent': '#3d6a94', '--accent-hover': '#305a82', '--accent-active': '#254a70',
      '--success': '#4a9a6a', '--warning': '#c89830', '--danger': '#c05050',
      '--border': '#b0c4d8', '--border-light': '#d0dce8',
      '--shadow': 'rgba(30, 50, 72, 0.08)', '--sidebar-active-bg': 'rgba(61, 106, 148, 0.12)',
    },
  },
  {
    id: 'forest', name: 'Forest',
    preview: ['#ecf2ea', '#4a7a4a', '#ffffff'],
    vars: {
      '--bg-primary': '#ecf2ea', '--bg-secondary': '#dce6d8', '--bg-tertiary': '#c9d8c4', '--bg-card': '#ffffff',
      '--text-primary': '#2a3a2a', '--text-secondary': '#5a7a5a',
      '--accent': '#4a7a4a', '--accent-hover': '#3c6a3c', '--accent-active': '#2e5a2e',
      '--success': '#4a7a4a', '--warning': '#b09030', '--danger': '#a55555',
      '--border': '#b0c8ae', '--border-light': '#d0e0ce',
      '--shadow': 'rgba(42, 58, 42, 0.08)', '--sidebar-active-bg': 'rgba(74, 122, 74, 0.12)',
    },
  },
  {
    id: 'rose', name: 'Rose',
    preview: ['#f6edf0', '#995070', '#ffffff'],
    vars: {
      '--bg-primary': '#f6edf0', '--bg-secondary': '#eadce2', '--bg-tertiary': '#dcc8d0', '--bg-card': '#ffffff',
      '--text-primary': '#3a2830', '--text-secondary': '#886878',
      '--accent': '#995070', '--accent-hover': '#884060', '--accent-active': '#773050',
      '--success': '#6b8f63', '--warning': '#b8952e', '--danger': '#b56060',
      '--border': '#d0b8c2', '--border-light': '#e4d4dc',
      '--shadow': 'rgba(58, 40, 48, 0.08)', '--sidebar-active-bg': 'rgba(153, 80, 112, 0.12)',
    },
  },
];

function applyTheme(themeId: ThemeId) {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  localStorage.setItem('skim-theme', themeId);
}
type SkillsLayout = 'list' | 'split' | 'graph';

type FontFamily = 'system' | 'serif' | 'mono';

const FONT_FAMILIES: Record<FontFamily, string> = {
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono: "'SF Mono', Monaco, Consolas, 'Courier New', monospace",
};

function applyUIPrefs(fontFamily: FontFamily, fontSize: number) {
  document.documentElement.style.setProperty('--ui-font-family', FONT_FAMILIES[fontFamily]);
  document.documentElement.style.setProperty('--ui-font-size', `${fontSize}px`);
  document.body.style.fontFamily = FONT_FAMILIES[fontFamily];
  document.body.style.fontSize = `${fontSize}px`;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<ThemeId>(() => (localStorage.getItem('skim-theme') as ThemeId) || 'morandi-light');
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => (localStorage.getItem('skim-font-family') as FontFamily) || 'system');
  const [fontSize, setFontSize] = useState<number>(() => parseInt(localStorage.getItem('skim-font-size') || '14', 10));
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [envs, setEnvs] = useState<EnvInfo[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<string>('');
  const [newEnvName, setNewEnvName] = useState('');

  // Agent detail state
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [agentSkills, setAgentSkills] = useState<SkillRef[]>([]);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorPath, setEditorPath] = useState<string>('');
  const [editorDirty, setEditorDirty] = useState(false);
  const [skillLoading, setSkillLoading] = useState(false);
  const [skillLoadError, setSkillLoadError] = useState<string | null>(null);

  // Skills layout
  const [skillsLayout, setSkillsLayout] = useState<SkillsLayout>('list');
  const [splitAgent, setSplitAgent] = useState<string>('');

  // Settings state
  const [configData, setConfigData] = useState<ConfigResponse | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [appVersion, setAppVersion] = useState('dev');

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleResult = useCallback((result: OperationResult) => {
    showToast(result.message, result.success ? 'success' : 'error');
  }, [showToast]);

  const refresh = useCallback(async () => {
    try {
      const [statusData, skillsData, envsData, agentsData, cfgData] = await Promise.all([
        api.getStatus(),
        api.getSkills(),
        api.getEnvs(),
        api.getAgents(),
        api.getConfig(),
      ]);
      setStatus(statusData);
      setSkills(skillsData || []);
      setEnvs(envsData || []);
      setAgents(agentsData || []);
      setConfigData(cfgData);
      if (!selectedEnv && envsData?.length > 0) {
        setSelectedEnv(envsData[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedEnv]);

  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => { applyUIPrefs(fontFamily, fontSize); }, [fontFamily, fontSize]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { api.getVersion().then(v => setAppVersion(v)).catch(() => {}); }, []);

  const handleActivate = async (envName: string) => {
    handleResult(await api.activate(envName));
    refresh();
  };

  const handleDeactivate = async () => {
    handleResult(await api.deactivate());
    refresh();
  };

  const handleScan = async () => {
    handleResult(await api.scanAgents());
    refresh();
  };

  const handleCreateEnv = async () => {
    if (!newEnvName.trim()) return;
    const result = await api.createEnv(newEnvName.trim());
    handleResult(result);
    if (result.success) { setNewEnvName(''); refresh(); }
  };

  const handleRemoveEnv = async (name: string) => {
    handleResult(await api.removeEnv(name));
    refresh();
  };

  const handleToggleSkill = async (skillName: string, enabled: boolean) => {
    if (!selectedEnv) return;
    const result = enabled
      ? await api.disableSkill(selectedEnv, skillName)
      : await api.enableSkill(selectedEnv, skillName);
    handleResult(result);
    refresh();
  };

  // Agent detail handlers
  const openAgentDetail = async (agent: AgentInfo) => {
    setSelectedAgent(agent);
    setEditingSkill(null);
    setEditorDirty(false);
    try {
      const skills = await api.getAgentSkills(agent.id);
      setAgentSkills(skills || []);
    } catch {
      setAgentSkills([]);
    }
  };

  const openSkillEditor = async (agentID: string, skillName: string) => {
    // Immediately show editor panel with loading state
    setEditingSkill(skillName);
    setSkillLoading(true);
    setSkillLoadError(null);
    setEditorContent('');
    setEditorPath('');
    setEditorDirty(false);
    
    try {
      const detail = await api.readSkillContent(agentID, skillName);
      setEditorContent(detail.content);
      setEditorPath(detail.path);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setSkillLoadError(errorMsg);
      showToast(`Failed to load: ${errorMsg}`, 'error');
    } finally {
      setSkillLoading(false);
    }
  };

  const saveSkillContent = async () => {
    if (!selectedAgent || !editingSkill) return;
    const result = await api.writeSkillContent(selectedAgent.id, editingSkill, editorContent);
    handleResult(result);
    if (result.success) setEditorDirty(false);
  };

  const handleThemeChange = (id: ThemeId) => {
    setTheme(id);
  };

  const handleFontFamilyChange = (ff: FontFamily) => {
    setFontFamily(ff);
    localStorage.setItem('skim-font-family', ff);
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem('skim-font-size', String(size));
  };

  const handleToggleAgent = async (agentID: string, enabled: boolean) => {
    const result = await api.setAgentEnabled(agentID, enabled);
    handleResult(result);
    if (result.success) refresh();
  };

  const handleResetConfig = async () => {
    const result = await api.resetConfig();
    handleResult(result);
    if (result.success) refresh();
  };

  const handleInstallSkillToAgent = async (agentID: string, skillName: string) => {
    const result = await api.installSkillToAgent(agentID, skillName);
    handleResult(result);
    refresh();
  };

  const handleRemoveSkillFromAgent = async (agentID: string, skillName: string) => {
    const result = await api.removeSkillFromAgent(agentID, skillName);
    handleResult(result);
    refresh();
  };

  const buildSkillContextMenu = (e: React.MouseEvent, skillName: string) => {
    e.preventDefault();
    const availableAgents = agents.filter(a => a.available);
    const isInEnv = currentEnv?.skills?.includes(skillName) ?? false;
    const items: ContextMenuState['items'] = [];

    // Environment actions
    if (selectedEnv) {
      items.push(
        isInEnv
          ? { label: `Remove from "${selectedEnv}"`, icon: <IconMinus />, onClick: () => handleToggleSkill(skillName, true) }
          : { label: `Add to "${selectedEnv}"`, icon: <IconPlus />, onClick: () => handleToggleSkill(skillName, false) }
      );
    }

    // Agent install actions
    if (availableAgents.length > 0) {
      items.push('separator');
      items.push({ label: 'Install to Agent', type: 'label' });
      for (const ag of availableAgents) {
        items.push({ label: ag.name, icon: <IconInstall />, onClick: () => handleInstallSkillToAgent(ag.id, skillName) });
      }
    }

    // Danger zone
    items.push('separator');
    items.push({ label: 'Remove from Store', icon: <IconTrash />, onClick: async () => { handleResult(await api.removeSkill(skillName)); refresh(); }, danger: true });

    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const buildAgentSkillContextMenu = (e: React.MouseEvent, agentID: string, skill: SkillRef) => {
    e.preventDefault();
    const items: ContextMenuState['items'] = [];
    items.push({ label: 'View / Edit', icon: <IconEdit />, onClick: () => openSkillEditor(agentID, skill.Name) });
    if (skill.IsManaged) {
      items.push('separator');
      items.push({ label: 'Remove from Agent', icon: <IconTrash />, onClick: () => handleRemoveSkillFromAgent(agentID, skill.Name), danger: true });
    }
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const currentEnv = envs.find(e => e.name === selectedEnv);

  if (loading) {
    return <div className="app"><div className="loading"><div className="spinner" /></div></div>;
  }

  return (
    <div className="app">
      <div className="titlebar-drag-region" />
      <aside className="sidebar">
        <div className="sidebar-header" onClick={() => setShowAbout(true)} style={{ cursor: 'pointer' }}>
          <div className="sidebar-header-title-row">
            <h1>Skim</h1>
            <span className="sidebar-version-badge">v{appVersion}</span>
          </div>
          <p>Skill Version Manager</p>
        </div>
        <nav className="sidebar-nav">
          {([
            { id: 'dashboard' as View, label: 'Dashboard', icon: <IconDashboard /> },
            { id: 'skills' as View, label: 'Skills', icon: <IconSkills /> },
            { id: 'envs' as View, label: 'Environments', icon: <IconEnv /> },
            { id: 'agents' as View, label: 'Agents', icon: <IconAgents /> },
            { id: 'settings' as View, label: 'Settings', icon: <IconSettings /> },
          ]).map(item => (
            <div key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => { setView(item.id); setSelectedAgent(null); setEditingSkill(null); }}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        {view === 'dashboard' && (
          <DashboardView status={status} onActivate={handleActivate} onDeactivate={handleDeactivate} onScan={handleScan} envs={envs} agents={agents} onAgentClick={a => { setView('agents'); openAgentDetail(a); }} />
        )}
        {view === 'skills' && (
          <SkillsView skills={skills} envs={envs} agents={agents} selectedEnv={selectedEnv} currentEnv={currentEnv} onSelectEnv={setSelectedEnv} onToggleSkill={handleToggleSkill} layout={skillsLayout} onLayoutChange={setSkillsLayout} splitAgent={splitAgent} onSplitAgentChange={setSplitAgent} onSkillContextMenu={buildSkillContextMenu} />
        )}
        {view === 'envs' && (
          <EnvsView envs={envs} skills={skills} selectedEnv={selectedEnv} onSelectEnv={setSelectedEnv} newEnvName={newEnvName} onNewEnvNameChange={setNewEnvName} onCreateEnv={handleCreateEnv} onRemoveEnv={handleRemoveEnv} onActivate={handleActivate} onDeactivate={handleDeactivate} onToggleSkill={handleToggleSkill} />
        )}
        {view === 'settings' && (
          <SettingsView theme={theme} onThemeChange={handleThemeChange} config={configData} status={status} onToggleAgent={handleToggleAgent} onResetConfig={handleResetConfig} onSetLinkStrategy={async (s) => { handleResult(await api.setLinkStrategy(s)); refresh(); }} fontFamily={fontFamily} onFontFamilyChange={handleFontFamilyChange} fontSize={fontSize} onFontSizeChange={handleFontSizeChange} appVersion={appVersion} />
        )}
        {view === 'agents' && (
          selectedAgent ? (
            <AgentDetailView
              agent={selectedAgent}
              agentSkills={agentSkills}
              editingSkill={editingSkill}
              editorContent={editorContent}
              editorPath={editorPath}
              editorDirty={editorDirty}
              editorTheme={theme === 'morandi-dark' ? 'vs-dark' : 'vs-light'}
              skillLoading={skillLoading}
              skillLoadError={skillLoadError}
              onBack={() => { setSelectedAgent(null); setEditingSkill(null); }}
              onSkillClick={(name) => openSkillEditor(selectedAgent.id, name)}
              onEditorChange={(v) => { setEditorContent(v || ''); setEditorDirty(true); }}
              onSave={saveSkillContent}
              onCloseEditor={() => setEditingSkill(null)}
              onSkillContextMenu={(e, skill) => buildAgentSkillContextMenu(e, selectedAgent.id, skill)}
            />
          ) : (
            <AgentsView agents={agents} onScan={handleScan} onAgentClick={openAgentDetail} />
          )
        )}
      </main>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      {contextMenu && <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />}

      {showAbout && (
        <div className="about-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAbout(false); }}>
          <div className="about-dialog">
            <div className="about-header">
              <h2>Skim</h2>
              <button className="about-close" onClick={() => setShowAbout(false)}>&times;</button>
            </div>
            <p className="about-tagline">Skill Version Manager for Coding Agents</p>
            <div className="about-version">v{appVersion}</div>
            <p className="about-desc">Manage skills across Claude, Codex, Gemini, Qoder, and QoderWork.</p>
            <button className="about-github" onClick={() => window.open('https://github.com/FanBB2333/skim', '_blank')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              GitHub
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Custom Dropdown ===== */
function CustomSelect({ value, placeholder, options, onChange }: {
  value: string;
  placeholder: string;
  options: { value: string; label: ReactNode }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="custom-select" ref={ref}>
      <div className={`custom-select-trigger ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        <span className={selected ? '' : 'custom-select-placeholder'}>{selected ? selected.label : placeholder}</span>
        <svg className={`custom-select-arrow ${open ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5L6 7.5L9 4.5" /></svg>
      </div>
      {open && (
        <div className="custom-select-menu">
          {options.map(opt => (
            <div key={opt.value} className={`custom-select-option ${opt.value === value ? 'selected' : ''}`} onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.label}
              {opt.value === value && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== Icons ===== */
function IconDashboard() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
}
function IconSkills() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
}
function IconEnv() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
}
function IconAgents() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>;
}
function IconSettings() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function IconBack() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function IconPlus() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconMinus() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconInstall() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function IconTrash() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
}
function IconEdit() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}

/* ===== Dashboard ===== */
interface DashboardViewProps {
  status: StatusResponse | null;
  envs: EnvInfo[];
  agents: AgentInfo[];
  onActivate: (envName: string) => void;
  onDeactivate: () => void;
  onScan: () => void;
  onAgentClick: (agent: AgentInfo) => void;
}

function DashboardView({ status, envs, onActivate, onDeactivate, onScan, onAgentClick }: DashboardViewProps) {
  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your skill management status</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{status?.storeCount || 0}</div><div className="stat-label">Skills in Store</div></div>
        <div className="stat-card"><div className="stat-value">{status?.envCount || 0}</div><div className="stat-label">Environments</div></div>
        <div className="stat-card"><div className="stat-value">{status?.agents?.filter(a => a.available).length || 0}</div><div className="stat-label">Available Agents</div></div>
        <div className="stat-card"><div className="stat-value">{status?.managedSkills?.length || 0}</div><div className="stat-label">Deployed Skills</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Supported Agent Frameworks</span>
        </div>
        <div className="frameworks-grid">
          {[
            { id: 'claude', name: 'Claude Code', desc: 'Anthropic', dir: '~/.claude/skills', format: 'standard' },
            { id: 'codex', name: 'Codex', desc: 'OpenAI', dir: '~/.codex/skills', format: 'standard' },
            { id: 'gemini', name: 'Gemini CLI', desc: 'Google', dir: '~/.gemini', format: 'gemini' },
            { id: 'antigravity', name: 'Antigravity', desc: 'Google', dir: '~/.gemini/antigravity/skills', format: 'standard' },
            { id: 'openclaw', name: 'OpenClaw', desc: 'Community', dir: '~/.openclaw/skills', format: 'standard' },
            { id: 'qoder', name: 'Qoder', desc: 'Community', dir: '~/.qoder/skills', format: 'standard' },
            { id: 'qoderwork', name: 'QoderWork', desc: 'Community', dir: '~/.qoderwork/skills', format: 'standard' },
          ].map(fw => {
            const agent = status?.agents?.find(a => a.id === fw.id);
            return (
              <div key={fw.id} className="framework-card">
                <div className="framework-header">
                  <div className={`framework-icon framework-icon-${agent?.available ? 'active' : 'inactive'}`}>{fw.id[0].toUpperCase()}</div>
                  <div className="framework-info">
                    <div className="framework-name">{fw.name}</div>
                    <div className="framework-org">{fw.desc}</div>
                  </div>
                  <span className={`badge ${agent?.available ? 'badge-success' : 'badge-danger'}`}>
                    {agent?.available ? 'Installed' : 'Not Found'}
                  </span>
                </div>
                <div className="framework-meta">
                  <span className="framework-dir">{fw.dir}</span>
                  <span className={`badge ${fw.format === 'gemini' ? 'badge-info' : 'badge-warning'}`}>{fw.format === 'gemini' ? 'GEMINI.md' : 'SKILL.md'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Active Environment</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-secondary btn-sm" onClick={onScan}>Scan Agents</button>
            {status?.activeEnv && <button className="btn btn-danger btn-sm" onClick={onDeactivate}>Deactivate</button>}
          </div>
        </div>
        {status?.activeEnv ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '18px', fontWeight: '600' }}>{status.activeEnv}</span>
              <span className="badge badge-success">Active</span>
            </div>
            {status.activatedAt && <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '13px' }}>Activated at {status.activatedAt}</p>}
            {status.managedSkills?.length > 0 && (
              <div className="list">
                {status.managedSkills.map(ms => (
                  <div key={ms.skill} className="list-item">
                    <div className="list-item-content">
                      <div className="list-item-title">{ms.skill}</div>
                      <div className="list-item-subtitle">Deployed to: {ms.deployedTo?.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No Active Environment</h3>
            <p>Select an environment to activate and deploy skills.</p>
            {envs.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <CustomSelect
                  value=""
                  placeholder="Select environment..."
                  options={envs.map(env => ({ value: env.name, label: env.name }))}
                  onChange={(v) => v && onActivate(v)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Agents</span></div>
        <div className="agent-grid">
          {status?.agents?.map(agent => (
            <div key={agent.id} className="agent-card" onClick={() => agent.available && onAgentClick(agent)}>
              <div className="agent-card-header">
                <div className="agent-icon">{agent.id[0].toUpperCase()}</div>
                <div>
                  <div className="agent-name">{agent.name}</div>
                  <span className={`badge ${agent.available ? 'badge-success' : 'badge-danger'}`}>{agent.available ? 'Available' : 'Not Installed'}</span>
                </div>
              </div>
              <div className="agent-path">{agent.skillDir}</div>
              {agent.available && <div className="agent-stats"><span className="agent-stat"><strong>{agent.skillCount}</strong> skills</span></div>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ===== Skills View ===== */
interface SkillsViewProps {
  skills: SkillInfo[];
  envs: EnvInfo[];
  agents: AgentInfo[];
  selectedEnv: string;
  currentEnv: EnvInfo | undefined;
  onSelectEnv: (name: string) => void;
  onToggleSkill: (skillName: string, enabled: boolean) => void;
  layout: SkillsLayout;
  onLayoutChange: (layout: SkillsLayout) => void;
  splitAgent: string;
  onSplitAgentChange: (id: string) => void;
  onSkillContextMenu: (e: React.MouseEvent, skillName: string) => void;
}

function SkillsView({ skills, envs, agents, selectedEnv, currentEnv, onSelectEnv, onToggleSkill, layout, onLayoutChange, splitAgent, onSplitAgentChange, onSkillContextMenu }: SkillsViewProps) {
  const availableAgents = agents.filter(a => a.available);

  // Auto-select first available agent for split view
  useEffect(() => {
    if (layout === 'split' && !splitAgent && availableAgents.length > 0) {
      onSplitAgentChange(availableAgents[0].id);
    }
  }, [layout, splitAgent, availableAgents, onSplitAgentChange]);

  return (
    <>
      <div className="page-header">
        <h2>Skills</h2>
        <p>Manage skills in your global store and assign them to environments</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          {envs.length > 0 && (
            <div className="env-selector">
              {envs.map(env => (
                <div key={env.name} className={`env-chip ${selectedEnv === env.name ? 'active' : ''} ${env.active ? 'current' : ''}`} onClick={() => onSelectEnv(env.name)}>
                  {env.name} ({env.skills?.length || 0}){env.active && ' \u2713'}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="btn-group">
          <button className={`btn btn-outline btn-sm ${layout === 'list' ? 'active' : ''}`} onClick={() => onLayoutChange('list')}>List</button>
          <button className={`btn btn-outline btn-sm ${layout === 'split' ? 'active' : ''}`} onClick={() => onLayoutChange('split')}>Split</button>
          <button className={`btn btn-outline btn-sm ${layout === 'graph' ? 'active' : ''}`} onClick={() => onLayoutChange('graph')}>Graph</button>
        </div>
      </div>

      {layout === 'list' ? (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Skills in Store ({skills.length}){selectedEnv && ` \u2014 ${selectedEnv}`}</span>
          </div>
          <SkillList skills={skills} currentEnv={currentEnv} selectedEnv={selectedEnv} onToggleSkill={onToggleSkill} onContextMenu={onSkillContextMenu} />
        </div>
      ) : layout === 'split' ? (
        <SplitSkillsView
          skills={skills}
          agents={availableAgents}
          currentEnv={currentEnv}
          selectedEnv={selectedEnv}
          splitAgent={splitAgent}
          onSplitAgentChange={onSplitAgentChange}
          onToggleSkill={onToggleSkill}
          onSkillContextMenu={onSkillContextMenu}
        />
      ) : (
        <GraphSkillsView skills={skills} agents={availableAgents} onSkillContextMenu={onSkillContextMenu} />
      )}
    </>
  );
}

function SkillList({ skills, currentEnv, selectedEnv, onToggleSkill, onContextMenu }: { skills: SkillInfo[]; currentEnv: EnvInfo | undefined; selectedEnv: string; onToggleSkill: (name: string, enabled: boolean) => void; onContextMenu: (e: React.MouseEvent, name: string) => void }) {
  if (skills.length === 0) {
    return <div className="empty-state"><h3>No Skills</h3><p>Run "skim agent scan" to import skills from your agents.</p></div>;
  }
  return (
    <div className="list">
      {skills.map(skill => {
        const isEnabled = currentEnv?.skills?.includes(skill.name) ?? false;
        return (
          <div key={skill.name} className="skill-item" onContextMenu={(e) => onContextMenu(e, skill.name)}>
            <input type="checkbox" className="skill-checkbox" checked={isEnabled} onChange={() => onToggleSkill(skill.name, isEnabled)} disabled={!selectedEnv} />
            <div className="skill-info">
              <div className="skill-name">{skill.name}</div>
              <div className="skill-description">{skill.description || 'No description'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===== Split Skills View ===== */
interface SplitSkillsViewProps {
  skills: SkillInfo[];
  agents: AgentInfo[];
  currentEnv: EnvInfo | undefined;
  selectedEnv: string;
  splitAgent: string;
  onSplitAgentChange: (id: string) => void;
  onToggleSkill: (name: string, enabled: boolean) => void;
  onSkillContextMenu: (e: React.MouseEvent, name: string) => void;
}

function SplitSkillsView({ skills, agents, currentEnv, selectedEnv, splitAgent, onSplitAgentChange, onToggleSkill, onSkillContextMenu }: SplitSkillsViewProps) {
  const [agentSkills, setAgentSkills] = useState<SkillRef[]>([]);

  useEffect(() => {
    if (!splitAgent) return;
    api.getAgentSkills(splitAgent).then(s => setAgentSkills(s || [])).catch(() => setAgentSkills([]));
  }, [splitAgent]);

  const selectedAgentInfo = agents.find(a => a.id === splitAgent);
  const agentSkillNames = new Set(agentSkills.map(s => s.Name));

  return (
    <div className="split-pane">
      <div className="split-left">
        <div className="split-left-header">Agents</div>
        {agents.map(ag => (
          <div key={ag.id} className={`split-left-item ${splitAgent === ag.id ? 'active' : ''}`} onClick={() => onSplitAgentChange(ag.id)}>
            {ag.name}
            <span className="badge badge-info">{ag.skillCount}</span>
          </div>
        ))}
      </div>
      <div className="split-right">
        {selectedAgentInfo ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{selectedAgentInfo.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'SF Mono', Monaco, Consolas, monospace" }}>{selectedAgentInfo.skillDir}</div>
            </div>
            <div className="list">
              {skills.map(skill => {
                const isEnabled = currentEnv?.skills?.includes(skill.name) ?? false;
                const isInstalled = agentSkillNames.has(skill.name);
                return (
                  <div key={skill.name} className="skill-item" onContextMenu={(e) => onSkillContextMenu(e, skill.name)}>
                    <input type="checkbox" className="skill-checkbox" checked={isEnabled} onChange={() => onToggleSkill(skill.name, isEnabled)} disabled={!selectedEnv} />
                    <div className="skill-info">
                      <div className="skill-name">
                        {skill.name}
                        {isInstalled && (() => {
                          const ref = agentSkills.find(s => s.Name === skill.name);
                          return ref?.IsManaged
                            ? <span className="badge badge-managed" style={{ marginLeft: '8px' }}>skim-managed</span>
                            : <span className="badge badge-external" style={{ marginLeft: '8px' }}>external</span>;
                        })()}
                      </div>
                      <div className="skill-description">{skill.description || 'No description'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="split-right-empty">Select an agent to view skills</div>
        )}
      </div>
    </div>
  );
}

/* ===== Graph Skills View (Connection Diagram) ===== */
interface GraphSkillsViewProps {
  skills: SkillInfo[];
  agents: AgentInfo[];
  onSkillContextMenu: (e: React.MouseEvent, name: string) => void;
}

function GraphSkillsView({ skills, agents, onSkillContextMenu }: GraphSkillsViewProps) {
  const [agentSkillsMap, setAgentSkillsMap] = useState<Record<string, SkillRef[]>>({});
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const skillRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const agentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; skillName: string; agentId: string; managed: boolean }[]>([]);

  useEffect(() => {
    const loadAll = async () => {
      const map: Record<string, SkillRef[]> = {};
      for (const ag of agents) {
        try {
          const skills = await api.getAgentSkills(ag.id);
          map[ag.id] = skills || [];
        } catch {
          map[ag.id] = [];
        }
      }
      setAgentSkillsMap(map);
    };
    loadAll();
  }, [agents]);

  // Compute lines whenever layout changes
  useEffect(() => {
    const compute = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLines: typeof lines = [];
      for (const ag of agents) {
        const agentSkills = agentSkillsMap[ag.id] || [];
        for (const sk of agentSkills) {
          const skillEl = skillRefs.current[sk.Name];
          const agentEl = agentRefs.current[ag.id];
          if (skillEl && agentEl) {
            const sRect = skillEl.getBoundingClientRect();
            const aRect = agentEl.getBoundingClientRect();
            newLines.push({
              x1: sRect.right - containerRect.left,
              y1: sRect.top + sRect.height / 2 - containerRect.top,
              x2: aRect.left - containerRect.left,
              y2: aRect.top + aRect.height / 2 - containerRect.top,
              skillName: sk.Name,
              agentId: ag.id,
              managed: sk.IsManaged,
            });
          }
        }
      }
      setLines(newLines);
    };
    // Delay to allow DOM to render
    const timer = setTimeout(compute, 100);
    return () => clearTimeout(timer);
  }, [agentSkillsMap, agents, skills]);

  const isHighlighted = (skillName: string, agentId: string) => {
    if (hoveredSkill) return skillName === hoveredSkill;
    if (hoveredAgent) return agentId === hoveredAgent;
    return false;
  };

  return (
    <div className="graph-view" ref={containerRef}>
      <div className="graph-columns">
        {/* Skills column */}
        <div className="graph-column">
          <div className="graph-column-header">Skills ({skills.length})</div>
          {skills.map(skill => {
            const connected = hoveredSkill === skill.name || lines.some(l => l.skillName === skill.name && hoveredAgent === l.agentId);
            return (
              <div
                key={skill.name}
                ref={el => { skillRefs.current[skill.name] = el; }}
                className={`graph-node graph-skill-node ${connected ? 'highlighted' : ''} ${hoveredSkill === skill.name ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredSkill(skill.name)}
                onMouseLeave={() => setHoveredSkill(null)}
                onContextMenu={(e) => onSkillContextMenu(e, skill.name)}
              >
                <div className="graph-node-name">{skill.name}</div>
                <div className="graph-node-desc">{skill.description || 'No description'}</div>
              </div>
            );
          })}
        </div>

        {/* SVG connection lines */}
        <svg className="graph-lines">
          {lines.map((line, i) => {
            const highlighted = isHighlighted(line.skillName, line.agentId);
            return (
              <path
                key={i}
                d={`M ${line.x1} ${line.y1} C ${line.x1 + 60} ${line.y1}, ${line.x2 - 60} ${line.y2}, ${line.x2} ${line.y2}`}
                fill="none"
                stroke={highlighted ? (line.managed ? 'var(--accent)' : 'var(--warning)') : 'var(--border)'}
                strokeWidth={highlighted ? 2.5 : 1.5}
                strokeDasharray={line.managed ? 'none' : '6 3'}
                opacity={hoveredSkill || hoveredAgent ? (highlighted ? 1 : 0.15) : 0.6}
                style={{ transition: 'all 0.2s ease' }}
              />
            );
          })}
        </svg>

        {/* Agents column */}
        <div className="graph-column">
          <div className="graph-column-header">Agents ({agents.length})</div>
          {agents.map(ag => {
            const connected = hoveredAgent === ag.id || lines.some(l => l.agentId === ag.id && hoveredSkill === l.skillName);
            return (
              <div
                key={ag.id}
                ref={el => { agentRefs.current[ag.id] = el; }}
                className={`graph-node graph-agent-node ${connected ? 'highlighted' : ''} ${hoveredAgent === ag.id ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredAgent(ag.id)}
                onMouseLeave={() => setHoveredAgent(null)}
              >
                <div className="graph-node-icon">{ag.id[0].toUpperCase()}</div>
                <div>
                  <div className="graph-node-name">{ag.name}</div>
                  <div className="graph-node-desc">{(agentSkillsMap[ag.id] || []).length} skills</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="graph-legend">
        <div className="graph-legend-item"><svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke="var(--accent)" strokeWidth="2" /></svg> Managed by skim</div>
        <div className="graph-legend-item"><svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke="var(--warning)" strokeWidth="2" strokeDasharray="6 3" /></svg> Not managed</div>
      </div>
    </div>
  );
}

/* ===== Environments View ===== */
interface EnvsViewProps {
  envs: EnvInfo[];
  skills: SkillInfo[];
  selectedEnv: string;
  onSelectEnv: (name: string) => void;
  newEnvName: string;
  onNewEnvNameChange: (name: string) => void;
  onCreateEnv: () => void;
  onRemoveEnv: (name: string) => void;
  onActivate: (name: string) => void;
  onDeactivate: () => void;
  onToggleSkill: (skillName: string, enabled: boolean) => void;
}

function EnvsView({ envs, skills, selectedEnv, onSelectEnv, newEnvName, onNewEnvNameChange, onCreateEnv, onRemoveEnv, onActivate, onDeactivate, onToggleSkill }: EnvsViewProps) {
  const currentEnv = envs.find(e => e.name === selectedEnv);
  const envSkills = currentEnv?.skills || [];
  const availableSkills = skills.filter(s => !envSkills.includes(s.name));

  // Auto-select first environment if none selected
  useEffect(() => {
    if (!selectedEnv && envs.length > 0) {
      onSelectEnv(envs[0].name);
    }
  }, [selectedEnv, envs, onSelectEnv]);

  const getSkillInfo = (skillName: string): SkillInfo | undefined => {
    return skills.find(s => s.name === skillName);
  };

  return (
    <>
      <div className="page-header"><h2>Environments</h2><p>Create and manage skill environments</p></div>

      {/* Create Environment */}
      <div className="env-create-bar">
        <input type="text" className="input" placeholder="New environment name..." value={newEnvName} onChange={(e) => onNewEnvNameChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onCreateEnv()} />
        <button className="btn btn-primary" onClick={onCreateEnv}>Create Environment</button>
      </div>

      {envs.length === 0 ? (
        <div className="card">
          <div className="empty-state"><h3>No Environments</h3><p>Create an environment to group skills together.</p></div>
        </div>
      ) : (
        <div className="env-split-pane">
          {/* Environment List - Left Panel */}
          <div className="env-list-panel">
            <div className="env-list-header">Environments ({envs.length})</div>
            <div className="env-list">
              {envs.map(env => (
                <div
                  key={env.name}
                  className={`env-list-item ${selectedEnv === env.name ? 'selected' : ''} ${env.active ? 'active-env' : ''}`}
                  onClick={() => onSelectEnv(env.name)}
                >
                  <div className="env-list-item-content">
                    <div className="env-list-item-name">
                      {env.name}
                      {env.active && <span className="env-active-dot" title="Active" />}
                    </div>
                    <div className="env-list-item-meta">{env.skills?.length || 0} skill(s)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environment Detail - Right Panel */}
          <div className="env-detail-panel">
            {currentEnv ? (
              <>
                {/* Header */}
                <div className="env-detail-header">
                  <div className="env-detail-title">
                    <h3>{currentEnv.name}</h3>
                    {currentEnv.active && <span className="badge badge-success">Active</span>}
                  </div>
                  <div className="env-detail-actions">
                    {currentEnv.active ? (
                      <button className="btn btn-danger btn-sm" onClick={onDeactivate}>Deactivate</button>
                    ) : (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => onActivate(currentEnv.name)}>Activate</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => onRemoveEnv(currentEnv.name)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Installed Skills */}
                <div className="env-detail-section">
                  <div className="env-detail-section-header">
                    <span className="env-detail-section-title">Installed Skills ({envSkills.length})</span>
                  </div>
                  {envSkills.length === 0 ? (
                    <div className="env-detail-empty">No skills in this environment. Add skills from the available list below.</div>
                  ) : (
                    <div className="env-skills-list">
                      {envSkills.map(skillName => {
                        const skillInfo = getSkillInfo(skillName);
                        return (
                          <div key={skillName} className="env-skill-item">
                            <div className="env-skill-info">
                              <div className="env-skill-name">{skillName}</div>
                              <div className="env-skill-meta">
                                {skillInfo?.description || 'No description'}
                                {skillInfo?.version && <span className="env-skill-version">v{skillInfo.version}</span>}
                              </div>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={() => onToggleSkill(skillName, true)}>Remove</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Available Skills to Add */}
                <div className="env-detail-section">
                  <div className="env-detail-section-header">
                    <span className="env-detail-section-title">Available Skills ({availableSkills.length})</span>
                  </div>
                  {availableSkills.length === 0 ? (
                    <div className="env-detail-empty">All skills from the store are already in this environment.</div>
                  ) : (
                    <div className="env-skills-list">
                      {availableSkills.map(skill => (
                        <div key={skill.name} className="env-skill-item env-skill-available">
                          <div className="env-skill-info">
                            <div className="env-skill-name">{skill.name}</div>
                            <div className="env-skill-meta">
                              {skill.description || 'No description'}
                              {skill.version && <span className="env-skill-version">v{skill.version}</span>}
                            </div>
                          </div>
                          <button className="btn btn-primary btn-sm" onClick={() => onToggleSkill(skill.name, false)}>Add</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="env-detail-empty-state">Select an environment to view details</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ===== Agents View ===== */
interface AgentsViewProps {
  agents: AgentInfo[];
  onScan: () => void;
  onAgentClick: (agent: AgentInfo) => void;
}

function AgentsView({ agents, onScan, onAgentClick }: AgentsViewProps) {
  return (
    <>
      <div className="page-header"><h2>Agents</h2><p>View and scan coding agent frameworks</p></div>
      <div style={{ marginBottom: '16px' }}><button className="btn btn-primary" onClick={onScan}>Scan All Agents</button></div>
      <div className="agent-grid">
        {agents.map(agent => (
          <div key={agent.id} className="agent-card" onClick={() => agent.available && onAgentClick(agent)}>
            <div className="agent-card-header">
              <div className="agent-icon">{agent.id[0].toUpperCase()}</div>
              <div>
                <div className="agent-name">{agent.name}</div>
                <span className={`badge ${agent.available ? 'badge-success' : 'badge-danger'}`}>{agent.available ? 'Available' : 'Not Installed'}</span>
              </div>
            </div>
            <div className="agent-path">{agent.skillDir}</div>
            {agent.available && <div className="agent-stats"><span className="agent-stat"><strong>{agent.skillCount}</strong> skills installed</span></div>}
          </div>
        ))}
      </div>
    </>
  );
}

/* ===== Agent Detail View with Monaco Editor ===== */
interface AgentDetailViewProps {
  agent: AgentInfo;
  agentSkills: SkillRef[];
  editingSkill: string | null;
  editorContent: string;
  editorPath: string;
  editorDirty: boolean;
  editorTheme: string;
  skillLoading: boolean;
  skillLoadError: string | null;
  onBack: () => void;
  onSkillClick: (name: string) => void;
  onEditorChange: (value: string | undefined) => void;
  onSave: () => void;
  onCloseEditor: () => void;
  onSkillContextMenu: (e: React.MouseEvent, skill: SkillRef) => void;
}

function AgentDetailView({ agent, agentSkills, editingSkill, editorContent, editorPath, editorDirty, editorTheme, skillLoading, skillLoadError, onBack, onSkillClick, onEditorChange, onSave, onCloseEditor, onSkillContextMenu }: AgentDetailViewProps) {
  const editorRef = useRef<unknown>(null);

  return (
    <>
      <div className="back-btn" onClick={onBack}><IconBack /> Back to Agents</div>

      <div className="agent-detail-header">
        <div className="agent-icon">{agent.id[0].toUpperCase()}</div>
        <div className="agent-detail-info">
          <h3>{agent.name}</h3>
          <p>{agent.skillDir}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Installed Skills ({agentSkills.length})</span>
        </div>
        {agentSkills.length === 0 ? (
          <div className="empty-state"><h3>No Skills</h3><p>This agent has no skills installed.</p></div>
        ) : (
          <div className="list">
            {agentSkills.map(skill => (
              <div key={skill.Name} className={`agent-detail-skill ${editingSkill === skill.Name ? 'active' : ''} ${skill.IsManaged ? 'managed-skill' : 'external-skill'}`} onClick={() => onSkillClick(skill.Name)} onContextMenu={(e) => onSkillContextMenu(e, skill)}>
                <div className="agent-detail-skill-name">{skill.Name}</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {skill.IsManaged
                    ? <span className="badge badge-managed">skim-managed</span>
                    : <span className="badge badge-external">external</span>
                  }
                  <span className="badge badge-success">View</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingSkill && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCloseEditor(); }}>
          <div className="modal-popup">
            <div className="modal-popup-header">
              <div className="modal-popup-title-row">
                <div className="modal-popup-icon">&#9998;</div>
                <div className="modal-popup-title-text">
                  <div className="modal-popup-title">{editingSkill}</div>
                  <div className="modal-popup-subtitle">{skillLoading ? 'Loading...' : editorPath}</div>
                </div>
              </div>
              <div className="modal-popup-actions">
                {editorDirty && <span className="badge badge-warning">Unsaved</span>}
                <button className="btn btn-primary btn-sm" onClick={onSave} disabled={!editorDirty || skillLoading}>Save</button>
                <button className="modal-popup-close" onClick={onCloseEditor}>&times;</button>
              </div>
            </div>
            <div className="modal-popup-body">
              {skillLoading ? (
                <div className="editor-loading">
                  <div className="spinner" />
                  <p>Loading skill content...</p>
                </div>
              ) : skillLoadError ? (
                <div className="editor-error">
                  <p>Failed to load skill content</p>
                  <p className="error-detail">{skillLoadError}</p>
                </div>
              ) : (
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  value={editorContent}
                  onChange={onEditorChange}
                  onMount={(editor) => { editorRef.current = editor; }}
                  theme={editorTheme}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    padding: { top: 12 },
                    renderLineHighlight: 'gutter',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ===== Settings View ===== */
interface SettingsViewProps {
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
  config: ConfigResponse | null;
  status: StatusResponse | null;
  onToggleAgent: (agentID: string, enabled: boolean) => void;
  onResetConfig: () => void;
  onSetLinkStrategy: (strategy: string) => void;
  fontFamily: FontFamily;
  onFontFamilyChange: (ff: FontFamily) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  appVersion: string;
}

function SettingsView({ theme, onThemeChange, config, status, onToggleAgent, onResetConfig, onSetLinkStrategy, fontFamily, onFontFamilyChange, fontSize, onFontSizeChange, appVersion }: SettingsViewProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const agentIcons: Record<string, string> = {
    claude: 'C', codex: 'X', gemini: 'G', qoder: 'Q', qoderwork: 'W', openclaw: 'O', antigravity: 'A',
  };

  const agentNames: Record<string, string> = {
    claude: 'Claude Code', codex: 'Codex', gemini: 'Gemini CLI', qoder: 'Qoder', qoderwork: 'QoderWork', openclaw: 'OpenClaw', antigravity: 'Antigravity',
  };

  return (
    <>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Customize appearance, manage agents, and configure Skim</p>
      </div>

      {/* Theme */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Theme</span>
        </div>
        <div className="theme-grid">
          {THEMES.map(t => (
            <div
              key={t.id}
              className={`theme-card ${theme === t.id ? 'active' : ''}`}
              onClick={() => onThemeChange(t.id)}
            >
              <div className="theme-preview">
                <div className="theme-preview-sidebar" style={{ background: t.preview[1] }} />
                <div className="theme-preview-main" style={{ background: t.preview[0] }}>
                  <div className="theme-preview-card" style={{ background: t.preview[2], border: `1px solid ${t.vars['--border']}` }} />
                  <div className="theme-preview-card" style={{ background: t.preview[2], border: `1px solid ${t.vars['--border']}` }} />
                </div>
              </div>
              <div className="theme-name">{t.name}</div>
              {theme === t.id && <div className="theme-active-badge">Active</div>}
            </div>
          ))}
        </div>
      </div>

      {/* UI Preferences */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">UI Preferences</span>
        </div>
        <div className="settings-section">
          <div className="settings-info-row">
            <span className="settings-info-label">Font Family</span>
            <select className="settings-select" value={fontFamily} onChange={(e) => onFontFamilyChange(e.target.value as FontFamily)}>
              <option value="system">System (Sans-serif)</option>
              <option value="serif">Serif (Georgia)</option>
              <option value="mono">Monospace (SF Mono)</option>
            </select>
          </div>
          <div className="settings-info-row">
            <span className="settings-info-label">Font Size</span>
            <div className="settings-range-group">
              <input type="range" className="settings-range" min="11" max="18" step="1" value={fontSize} onChange={(e) => onFontSizeChange(parseInt(e.target.value, 10))} />
              <span className="settings-range-value">{fontSize}px</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Configuration */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Agent Configuration</span>
        </div>
        <div className="settings-section">
          {config?.agents
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(ag => (
            <div key={ag.id} className="settings-agent-row">
              <div className="settings-agent-info">
                <div className="settings-agent-icon">{agentIcons[ag.id] || ag.id[0].toUpperCase()}</div>
                <div className="settings-agent-detail">
                  <div className="settings-agent-name">{agentNames[ag.id] || ag.id}</div>
                  <div className="settings-agent-path">{ag.skillDir}</div>
                </div>
                <span className={`badge ${ag.format === 'gemini' ? 'badge-info' : 'badge-success'}`}>{ag.format}</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={ag.enabled}
                  onChange={() => onToggleAgent(ag.id, !ag.enabled)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Storage & Data */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Storage & Data</span>
        </div>
        <div className="settings-section">
          <div className="settings-info-row">
            <span className="settings-info-label">Data Directory</span>
            <span className="settings-info-value mono">{config?.dataDir || '~/.skim'}</span>
          </div>
          <div className="settings-info-row">
            <span className="settings-info-label">Link Strategy</span>
            <div className="btn-group">
              <button className={`btn btn-sm ${(config?.linkStrategy || 'copy') === 'copy' ? 'btn-primary' : 'btn-outline'}`} onClick={() => onSetLinkStrategy('copy')}>Copy</button>
              <button className={`btn btn-sm ${config?.linkStrategy === 'symlink' ? 'btn-primary' : 'btn-outline'}`} onClick={() => onSetLinkStrategy('symlink')}>Symlink</button>
            </div>
          </div>
          <div className="settings-info-row">
            <span className="settings-info-label">Skills in Store</span>
            <span className="settings-info-value">{status?.storeCount ?? 0}</span>
          </div>
          <div className="settings-info-row">
            <span className="settings-info-label">Environments</span>
            <span className="settings-info-value">{status?.envCount ?? 0}</span>
          </div>
          <div className="settings-info-row">
            <span className="settings-info-label">Config Version</span>
            <span className="settings-info-value">v{config?.version ?? 1}</span>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">About</span>
        </div>
        <div className="settings-section">
          <div className="settings-info-row">
            <span className="settings-info-label">Application</span>
            <span className="settings-info-value">Skim — Skill Version Manager</span>
          </div>
          <div className="settings-info-row">
            <span className="settings-info-label">Version</span>
            <span className="settings-info-value">{appVersion}</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card settings-danger-card">
        <div className="card-header">
          <span className="card-title" style={{ color: 'var(--danger)' }}>Danger Zone</span>
        </div>
        <div className="settings-section">
          <div className="settings-danger-row">
            <div>
              <div className="settings-danger-title">Reset Configuration</div>
              <div className="settings-danger-desc">Reset all agent settings to defaults. This will not delete your skills or environments.</div>
            </div>
            {showResetConfirm ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-sm" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={() => { onResetConfig(); setShowResetConfirm(false); }}>Confirm</button>
              </div>
            ) : (
              <button className="btn btn-danger btn-sm" onClick={() => setShowResetConfirm(true)}>Reset</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
