import { useState, useEffect, useCallback } from 'react';
import { api } from './wailsjs';
import type { StatusResponse, SkillInfo, EnvInfo, AgentInfo, OperationResult } from './types';

type View = 'dashboard' | 'skills' | 'envs' | 'agents';

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

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleResult = useCallback((result: OperationResult) => {
    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleActivate = async (envName: string) => {
    const result = await api.activate(envName);
    handleResult(result);
    refresh();
  };

  const handleDeactivate = async () => {
    const result = await api.deactivate();
    handleResult(result);
    refresh();
  };

  const handleScan = async () => {
    const result = await api.scanAgents();
    handleResult(result);
    refresh();
  };

  const handleCreateEnv = async () => {
    if (!newEnvName.trim()) return;
    const result = await api.createEnv(newEnvName.trim());
    handleResult(result);
    if (result.success) {
      setNewEnvName('');
      refresh();
    }
  };

  const handleRemoveEnv = async (name: string) => {
    const result = await api.removeEnv(name);
    handleResult(result);
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

  const currentEnv = envs.find(e => e.name === selectedEnv);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Skim</h1>
          <p>Skill Version Manager</p>
        </div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </div>
          <div className={`nav-item ${view === 'skills' ? 'active' : ''}`} onClick={() => setView('skills')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Skills
          </div>
          <div className={`nav-item ${view === 'envs' ? 'active' : ''}`} onClick={() => setView('envs')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Environments
          </div>
          <div className={`nav-item ${view === 'agents' ? 'active' : ''}`} onClick={() => setView('agents')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" />
              <line x1="20" y1="14" x2="23" y2="14" />
              <line x1="1" y1="9" x2="4" y2="9" />
              <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
            Agents
          </div>
        </nav>
      </aside>

      <main className="main-content">
        {view === 'dashboard' && (
          <DashboardView
            status={status}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onScan={handleScan}
            envs={envs}
          />
        )}
        {view === 'skills' && (
          <SkillsView
            skills={skills}
            envs={envs}
            selectedEnv={selectedEnv}
            currentEnv={currentEnv}
            onSelectEnv={setSelectedEnv}
            onToggleSkill={handleToggleSkill}
          />
        )}
        {view === 'envs' && (
          <EnvsView
            envs={envs}
            newEnvName={newEnvName}
            onNewEnvNameChange={setNewEnvName}
            onCreateEnv={handleCreateEnv}
            onRemoveEnv={handleRemoveEnv}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
          />
        )}
        {view === 'agents' && (
          <AgentsView agents={agents} onScan={handleScan} />
        )}
      </main>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}

interface DashboardViewProps {
  status: StatusResponse | null;
  envs: EnvInfo[];
  onActivate: (envName: string) => void;
  onDeactivate: () => void;
  onScan: () => void;
}

function DashboardView({ status, envs, onActivate, onDeactivate, onScan }: DashboardViewProps) {
  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your skill management status</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{status?.storeCount || 0}</div>
          <div className="stat-label">Skills in Store</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{status?.envCount || 0}</div>
          <div className="stat-label">Environments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{status?.agents?.filter(a => a.available).length || 0}</div>
          <div className="stat-label">Available Agents</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{status?.managedSkills?.length || 0}</div>
          <div className="stat-label">Deployed Skills</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Active Environment</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={onScan}>
              Scan Agents
            </button>
            {status?.activeEnv && (
              <button className="btn btn-danger btn-sm" onClick={onDeactivate}>
                Deactivate
              </button>
            )}
          </div>
        </div>
        {status?.activeEnv ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px', fontWeight: '600' }}>{status.activeEnv}</span>
              <span className="badge badge-success">Active</span>
            </div>
            {status.activatedAt && (
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Activated at {status.activatedAt}
              </p>
            )}
            {status.managedSkills && status.managedSkills.length > 0 && (
              <div>
                <p style={{ fontWeight: '500', marginBottom: '8px' }}>Deployed Skills:</p>
                <div className="list">
                  {status.managedSkills.map(ms => (
                    <div key={ms.skill} className="list-item">
                      <div className="list-item-content">
                        <div className="list-item-title">{ms.skill}</div>
                        <div className="list-item-subtitle">
                          Deployed to: {ms.deployedTo?.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No Active Environment</h3>
            <p>Select an environment to activate and deploy skills to your agents.</p>
            {envs.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <select
                  className="input"
                  style={{ width: 'auto', display: 'inline-block', marginRight: '8px' }}
                  defaultValue=""
                  onChange={(e) => e.target.value && onActivate(e.target.value)}
                >
                  <option value="" disabled>Select environment...</option>
                  {envs.map(env => (
                    <option key={env.name} value={env.name}>{env.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Agents</span>
        </div>
        <div className="agent-grid">
          {status?.agents?.map(agent => (
            <div key={agent.id} className="agent-card">
              <div className="agent-card-header">
                <div className="agent-icon">{agent.id[0].toUpperCase()}</div>
                <div>
                  <div className="agent-name">{agent.name}</div>
                  <span className={`badge ${agent.available ? 'badge-success' : 'badge-danger'}`}>
                    {agent.available ? 'Available' : 'Not Installed'}
                  </span>
                </div>
              </div>
              <div className="agent-path">{agent.skillDir}</div>
              {agent.available && (
                <div className="agent-stats">
                  <span className="agent-stat"><strong>{agent.skillCount}</strong> skills</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

interface SkillsViewProps {
  skills: SkillInfo[];
  envs: EnvInfo[];
  selectedEnv: string;
  currentEnv: EnvInfo | undefined;
  onSelectEnv: (name: string) => void;
  onToggleSkill: (skillName: string, enabled: boolean) => void;
}

function SkillsView({ skills, envs, selectedEnv, currentEnv, onSelectEnv, onToggleSkill }: SkillsViewProps) {
  return (
    <>
      <div className="page-header">
        <h2>Skills</h2>
        <p>Manage skills in your global store and assign them to environments</p>
      </div>

      {envs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Select Environment</span>
          </div>
          <div className="env-selector">
            {envs.map(env => (
              <div
                key={env.name}
                className={`env-chip ${selectedEnv === env.name ? 'active' : ''} ${env.active ? 'current' : ''}`}
                onClick={() => onSelectEnv(env.name)}
              >
                {env.name} ({env.skills?.length || 0})
                {env.active && ' ✓'}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Skills in Store ({skills.length})
            {selectedEnv && ` — Configuring: ${selectedEnv}`}
          </span>
        </div>
        {skills.length === 0 ? (
          <div className="empty-state">
            <h3>No Skills</h3>
            <p>Run "skim agent scan" to import skills from your agents.</p>
          </div>
        ) : (
          <div className="list">
            {skills.map(skill => {
              const isEnabled = currentEnv?.skills?.includes(skill.name) ?? false;
              return (
                <div key={skill.name} className="skill-item">
                  <input
                    type="checkbox"
                    className="skill-checkbox"
                    checked={isEnabled}
                    onChange={() => onToggleSkill(skill.name, isEnabled)}
                    disabled={!selectedEnv}
                  />
                  <div className="skill-info">
                    <div className="skill-name">{skill.name}</div>
                    <div className="skill-description">
                      {skill.description || 'No description'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

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
      <div className="page-header">
        <h2>Environments</h2>
        <p>Create and manage skill environments</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Create Environment</span>
        </div>
        <div className="input-group">
          <input
            type="text"
            className="input"
            placeholder="Environment name..."
            value={newEnvName}
            onChange={(e) => onNewEnvNameChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onCreateEnv()}
          />
          <button className="btn btn-primary" onClick={onCreateEnv}>
            Create
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Environments ({envs.length})</span>
        </div>
        {envs.length === 0 ? (
          <div className="empty-state">
            <h3>No Environments</h3>
            <p>Create an environment to group skills together.</p>
          </div>
        ) : (
          <div className="list">
            {envs.map(env => (
              <div key={env.name} className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title">
                    {env.name}
                    {env.active && <span className="badge badge-success" style={{ marginLeft: '8px' }}>Active</span>}
                  </div>
                  <div className="list-item-subtitle">
                    {env.skills?.length || 0} skill(s): {env.skills?.join(', ') || 'none'}
                  </div>
                </div>
                <div className="list-item-actions">
                  {env.active ? (
                    <button className="btn btn-danger btn-sm" onClick={onDeactivate}>
                      Deactivate
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => onActivate(env.name)}>
                        Activate
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => onRemoveEnv(env.name)}>
                        Remove
                      </button>
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

interface AgentsViewProps {
  agents: AgentInfo[];
  onScan: () => void;
}

function AgentsView({ agents, onScan }: AgentsViewProps) {
  return (
    <>
      <div className="page-header">
        <h2>Agents</h2>
        <p>View and scan coding agent frameworks</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={onScan}>
          Scan All Agents
        </button>
      </div>

      <div className="agent-grid">
        {agents.map(agent => (
          <div key={agent.id} className="agent-card">
            <div className="agent-card-header">
              <div className="agent-icon">{agent.id[0].toUpperCase()}</div>
              <div>
                <div className="agent-name">{agent.name}</div>
                <span className={`badge ${agent.available ? 'badge-success' : 'badge-danger'}`}>
                  {agent.available ? 'Available' : 'Not Installed'}
                </span>
              </div>
            </div>
            <div className="agent-path">{agent.skillDir}</div>
            {agent.available && (
              <div className="agent-stats">
                <span className="agent-stat"><strong>{agent.skillCount}</strong> skills installed</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
