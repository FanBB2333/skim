import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { api } from './wailsjs';
import type { StatusResponse, SkillInfo, EnvInfo, AgentInfo, OperationResult, SkillRef } from './types';

type View = 'dashboard' | 'skills' | 'envs' | 'agents';
type SkillsLayout = 'list' | 'split';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

function App() {
  const [view, setView] = useState<View>('dashboard');
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

  // Skills layout
  const [skillsLayout, setSkillsLayout] = useState<SkillsLayout>('list');
  const [splitAgent, setSplitAgent] = useState<string>('');

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleResult = useCallback((result: OperationResult) => {
    showToast(result.message, result.success ? 'success' : 'error');
  }, [showToast]);

  const refresh = useCallback(async () => {
    try {
      const [statusData, skillsData, envsData, agentsData] = await Promise.all([
        api.getStatus(),
        api.getSkills(),
        api.getEnvs(),
        api.getAgents(),
      ]);
      setStatus(statusData);
      setSkills(skillsData || []);
      setEnvs(envsData || []);
      setAgents(agentsData || []);
      if (!selectedEnv && envsData?.length > 0) {
        setSelectedEnv(envsData[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedEnv]);

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
    try {
      const detail = await api.readSkillContent(agentID, skillName);
      setEditingSkill(skillName);
      setEditorContent(detail.content);
      setEditorPath(detail.path);
      setEditorDirty(false);
    } catch (err) {
      showToast(`Failed to load: ${err}`, 'error');
    }
  };

  const saveSkillContent = async () => {
    if (!selectedAgent || !editingSkill) return;
    const result = await api.writeSkillContent(selectedAgent.id, editingSkill, editorContent);
    handleResult(result);
    if (result.success) setEditorDirty(false);
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
          <SkillsView skills={skills} envs={envs} agents={agents} selectedEnv={selectedEnv} currentEnv={currentEnv} onSelectEnv={setSelectedEnv} onToggleSkill={handleToggleSkill} layout={skillsLayout} onLayoutChange={setSkillsLayout} splitAgent={splitAgent} onSplitAgentChange={setSplitAgent} />
        )}
        {view === 'envs' && (
          <EnvsView envs={envs} newEnvName={newEnvName} onNewEnvNameChange={setNewEnvName} onCreateEnv={handleCreateEnv} onRemoveEnv={handleRemoveEnv} onActivate={handleActivate} onDeactivate={handleDeactivate} />
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
              onBack={() => { setSelectedAgent(null); setEditingSkill(null); }}
              onSkillClick={(name) => openSkillEditor(selectedAgent.id, name)}
              onEditorChange={(v) => { setEditorContent(v || ''); setEditorDirty(true); }}
              onSave={saveSkillContent}
            />
          ) : (
            <AgentsView agents={agents} onScan={handleScan} onAgentClick={openAgentDetail} />
          )
        )}
      </main>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
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
function IconBack() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
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
                <select className="input" style={{ width: 'auto', display: 'inline-block' }} defaultValue="" onChange={(e) => e.target.value && onActivate(e.target.value)}>
                  <option value="" disabled>Select environment...</option>
                  {envs.map(env => <option key={env.name} value={env.name}>{env.name}</option>)}
                </select>
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
}

function SkillsView({ skills, envs, agents, selectedEnv, currentEnv, onSelectEnv, onToggleSkill, layout, onLayoutChange, splitAgent, onSplitAgentChange }: SkillsViewProps) {
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
          <SkillList skills={skills} currentEnv={currentEnv} selectedEnv={selectedEnv} onToggleSkill={onToggleSkill} />
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
        />
      )}
    </>
  );
}

function SkillList({ skills, currentEnv, selectedEnv, onToggleSkill }: { skills: SkillInfo[]; currentEnv: EnvInfo | undefined; selectedEnv: string; onToggleSkill: (name: string, enabled: boolean) => void }) {
  if (skills.length === 0) {
    return <div className="empty-state"><h3>No Skills</h3><p>Run "skim agent scan" to import skills from your agents.</p></div>;
  }
  return (
    <div className="list">
      {skills.map(skill => {
        const isEnabled = currentEnv?.skills?.includes(skill.name) ?? false;
        return (
          <div key={skill.name} className="skill-item">
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
}

function SplitSkillsView({ skills, agents, currentEnv, selectedEnv, splitAgent, onSplitAgentChange, onToggleSkill }: SplitSkillsViewProps) {
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
                  <div key={skill.name} className="skill-item">
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
  newEnvName: string;
  onNewEnvNameChange: (name: string) => void;
  onCreateEnv: () => void;
  onRemoveEnv: (name: string) => void;
  onActivate: (name: string) => void;
  onDeactivate: () => void;
}

function EnvsView({ envs, newEnvName, onNewEnvNameChange, onCreateEnv, onRemoveEnv, onActivate, onDeactivate }: EnvsViewProps) {
  return (
    <>
      <div className="page-header"><h2>Environments</h2><p>Create and manage skill environments</p></div>
      <div className="card">
        <div className="card-header"><span className="card-title">Create Environment</span></div>
        <div className="input-group">
          <input type="text" className="input" placeholder="Environment name..." value={newEnvName} onChange={(e) => onNewEnvNameChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onCreateEnv()} />
          <button className="btn btn-primary" onClick={onCreateEnv}>Create</button>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Environments ({envs.length})</span></div>
        {envs.length === 0 ? (
          <div className="empty-state"><h3>No Environments</h3><p>Create an environment to group skills together.</p></div>
        ) : (
          <div className="list">
            {envs.map(env => (
              <div key={env.name} className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title">{env.name}{env.active && <span className="badge badge-success" style={{ marginLeft: '8px' }}>Active</span>}</div>
                  <div className="list-item-subtitle">{env.skills?.length || 0} skill(s): {env.skills?.join(', ') || 'none'}</div>
                </div>
                <div className="list-item-actions">
                  {env.active ? (
                    <button className="btn btn-danger btn-sm" onClick={onDeactivate}>Deactivate</button>
                  ) : (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => onActivate(env.name)}>Activate</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => onRemoveEnv(env.name)}>Remove</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
  onBack: () => void;
  onSkillClick: (name: string) => void;
  onEditorChange: (value: string | undefined) => void;
  onSave: () => void;
}

function AgentDetailView({ agent, agentSkills, editingSkill, editorContent, editorPath, editorDirty, onBack, onSkillClick, onEditorChange, onSave }: AgentDetailViewProps) {
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
              <div key={skill.Name} className={`agent-detail-skill ${editingSkill === skill.Name ? 'active' : ''}`} onClick={() => onSkillClick(skill.Name)}>
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
        <div className="editor-panel">
          <div className="editor-header">
            <div className="editor-title">{editorPath}</div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {editorDirty && <span className="badge badge-warning">Unsaved</span>}
              <button className="btn btn-primary btn-sm" onClick={onSave} disabled={!editorDirty}>Save</button>
            </div>
          </div>
          <div className="editor-container">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={editorContent}
              onChange={onEditorChange}
              onMount={(editor) => { editorRef.current = editor; }}
              theme="vs-light"
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
          </div>
        </div>
      )}
    </>
  );
}

export default App;
