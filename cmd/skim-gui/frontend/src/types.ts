export interface StatusResponse {
  activeEnv: string;
  activatedAt: string;
  managedSkills: ManagedSkill[];
  agents: AgentInfo[];
  storeCount: number;
  envCount: number;
}

export interface ManagedSkill {
  skill: string;
  deployedTo: string[];
}

export interface AgentInfo {
  id: string;
  name: string;
  skillDir: string;
  available: boolean;
  skillCount: number;
}

export interface SkillInfo {
  name: string;
  description: string;
  version: string;
}

export interface EnvInfo {
  name: string;
  skills: string[];
  active: boolean;
}

export interface OperationResult {
  success: boolean;
  message: string;
  succeeded: number;
  failed: number;
  errors: string[];
}

export interface SkillRef {
  Name: string;
  Path: string;
  IsManaged: boolean;
}

export interface SkillDetail {
  name: string;
  path: string;
  content: string;
}
