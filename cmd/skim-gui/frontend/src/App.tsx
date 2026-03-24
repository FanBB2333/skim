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
    preview: ['#f5f0eb', '#9b8e7e', '#ffffff'],
    vars: {
      '--bg-primary': '#f5f0eb', '--bg-secondary': '#ede8e3', '--bg-tertiary': '#e2ddd7', '--bg-card': '#ffffff',
      '--text-primary': '#4a4540', '--text-secondary': '#8a837b',
      '--accent': '#9b8e7e', '--accent-hover': '#887a6b', '--accent-active': '#7a6d5e',
      '--success': '#8fa388', '--warning': '#c4a97a', '--danger': '#bf8b8b',
      '--border': '#d8d2cc', '--border-light': '#e8e3de',
      '--shadow': 'rgba(74, 69, 64, 0.06)', '--sidebar-active-bg': 'rgba(155, 142, 126, 0.12)',
    },
  },
  {
    id: 'morandi-dark', name: 'Morandi Dark',
    preview: ['#2a2725', '#a99e90', '#353230'],
    vars: {
      '--bg-primary': '#2a2725', '--bg-secondary': '#232120', '--bg-tertiary': '#1c1b1a', '--bg-card': '#353230',
      '--text-primary': '#e0dbd5', '--text-secondary': '#9a9389',
      '--accent': '#a99e90', '--accent-hover': '#bbb1a3', '--accent-active': '#c8bfb2',
      '--success': '#8fa388', '--warning': '#c4a97a', '--danger': '#bf8b8b',
      '--border': '#4a4644', '--border-light': '#3e3b39',
      '--shadow': 'rgba(0, 0, 0, 0.2)', '--sidebar-active-bg': 'rgba(169, 158, 144, 0.12)',
    },
  },
  {
    id: 'ocean', name: 'Ocean',
    preview: ['#eef3f8', '#5b7fa4', '#ffffff'],
    vars: {
      '--bg-primary': '#eef3f8', '--bg-secondary': '#e4ecf4', '--bg-tertiary': '#d6e1ed', '--bg-card': '#ffffff',
      '--text-primary': '#2c3e50', '--text-secondary': '#7b8fa3',
      '--accent': '#5b7fa4', '--accent-hover': '#4d6f92', '--accent-active': '#3f5f80',
      '--success': '#6dab8a', '--warning': '#d4a94e', '--danger': '#c07070',
      '--border': '#c8d6e3', '--border-light': '#dce6ef',
      '--shadow': 'rgba(44, 62, 80, 0.06)', '--sidebar-active-bg': 'rgba(91, 127, 164, 0.10)',
    },
  },
  {
    id: 'forest', name: 'Forest',
    preview: ['#f0f4ee', '#6b8f6b', '#ffffff'],
    vars: {
      '--bg-primary': '#f0f4ee', '--bg-secondary': '#e4ebe2', '--bg-tertiary': '#d7e0d5', '--bg-card': '#ffffff',
      '--text-primary': '#3a4a3a', '--text-secondary': '#7d8f7d',
      '--accent': '#6b8f6b', '--accent-hover': '#5c7e5c', '--accent-active': '#4d6d4d',
      '--success': '#6b8f6b', '--warning': '#bfa75a', '--danger': '#b57575',
      '--border': '#c8d4c6', '--border-light': '#dce5da',
      '--shadow': 'rgba(58, 74, 58, 0.06)', '--sidebar-active-bg': 'rgba(107, 143, 107, 0.10)',
    },
  },
  {
    id: 'rose', name: 'Rose',
    preview: ['#f8f0f2', '#b07a8a', '#ffffff'],
    vars: {
      '--bg-primary': '#f8f0f2', '--bg-secondary': '#f0e4e8', '--bg-tertiary': '#e6d7dc', '--bg-card': '#ffffff',
      '--text-primary': '#4a3a40', '--text-secondary': '#9a848c',
      '--accent': '#b07a8a', '--accent-hover': '#a06a7a', '--accent-active': '#905a6a',
      '--success': '#8fa388', '--warning': '#c4a97a', '--danger': '#bf8b8b',
      '--border': '#dcc8cf', '--border-light': '#ecdfe3',
      '--shadow': 'rgba(74, 58, 64, 0.06)', '--sidebar-active-bg': 'rgba(176, 122, 138, 0.10)',
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
type SkillsLayout = 'list' | 'split';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<ThemeId>(() => (localStorage.getItem('skim-theme') as ThemeId) || 'morandi-light');
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
  useEffect(() => { refresh(); }, [refresh]);

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
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Skim</h1>
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
          <SettingsView theme={theme} onThemeChange={handleThemeChange} config={configData} status={status} onToggleAgent={handleToggleAgent} onResetConfig={handleResetConfig} />
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
        </div>
      </div>

      {layout === 'list' ? (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Skills in Store ({skills.length}){selectedEnv && ` \u2014 ${selectedEnv}`}</span>
          </div>
          <SkillList skills={skills} currentEnv={currentEnv} selectedEnv={selectedEnv} onToggleSkill={onToggleSkill} onContextMenu={onSkillContextMenu} />
        </div>
      ) : (
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
                        {isInstalled && <span className="badge badge-success" style={{ marginLeft: '8px' }}>Installed</span>}
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
              <div key={skill.Name} className={`agent-detail-skill ${editingSkill === skill.Name ? 'active' : ''}`} onClick={() => onSkillClick(skill.Name)} onContextMenu={(e) => onSkillContextMenu(e, skill)}>
                <div className="agent-detail-skill-name">{skill.Name}</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {skill.IsManaged && <span className="badge badge-info">skim</span>}
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
}

function SettingsView({ theme, onThemeChange, config, status, onToggleAgent, onResetConfig }: SettingsViewProps) {
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
            <span className="settings-info-value">{config?.linkStrategy || 'copy'}</span>
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
            <span className="settings-info-value">1.0.0</span>
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
