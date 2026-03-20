import type { StatusResponse, SkillInfo, EnvInfo, AgentInfo, OperationResult, SkillRef } from './types';

declare global {
  interface Window {
    go: {
      api: {
        App: {
          GetStatus: () => Promise<StatusResponse>;
          GetSkills: () => Promise<SkillInfo[]>;
          GetEnvs: () => Promise<EnvInfo[]>;
          GetAgents: () => Promise<AgentInfo[]>;
          CreateEnv: (name: string) => Promise<OperationResult>;
          RemoveEnv: (name: string) => Promise<OperationResult>;
          EnableSkill: (envName: string, skillName: string) => Promise<OperationResult>;
          DisableSkill: (envName: string, skillName: string) => Promise<OperationResult>;
          Activate: (envName: string) => Promise<OperationResult>;
          Deactivate: () => Promise<OperationResult>;
          ScanAgents: () => Promise<OperationResult>;
          RemoveSkill: (name: string) => Promise<OperationResult>;
          GetAgentSkills: (agentID: string) => Promise<SkillRef[]>;
        };
      };
    };
  }
}

export const api = {
  getStatus: () => window.go.api.App.GetStatus(),
  getSkills: () => window.go.api.App.GetSkills(),
  getEnvs: () => window.go.api.App.GetEnvs(),
  getAgents: () => window.go.api.App.GetAgents(),
  createEnv: (name: string) => window.go.api.App.CreateEnv(name),
  removeEnv: (name: string) => window.go.api.App.RemoveEnv(name),
  enableSkill: (envName: string, skillName: string) => window.go.api.App.EnableSkill(envName, skillName),
  disableSkill: (envName: string, skillName: string) => window.go.api.App.DisableSkill(envName, skillName),
  activate: (envName: string) => window.go.api.App.Activate(envName),
  deactivate: () => window.go.api.App.Deactivate(),
  scanAgents: () => window.go.api.App.ScanAgents(),
  removeSkill: (name: string) => window.go.api.App.RemoveSkill(name),
  getAgentSkills: (agentID: string) => window.go.api.App.GetAgentSkills(agentID),
};
