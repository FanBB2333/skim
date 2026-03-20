export namespace api {
	
	export class AgentInfo {
	    id: string;
	    name: string;
	    skillDir: string;
	    available: boolean;
	    skillCount: number;
	
	    static createFrom(source: any = {}) {
	        return new AgentInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.skillDir = source["skillDir"];
	        this.available = source["available"];
	        this.skillCount = source["skillCount"];
	    }
	}
	export class EnvInfo {
	    name: string;
	    skills: string[];
	    active: boolean;
	
	    static createFrom(source: any = {}) {
	        return new EnvInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.skills = source["skills"];
	        this.active = source["active"];
	    }
	}
	export class ManagedSkill {
	    skill: string;
	    deployedTo: string[];
	
	    static createFrom(source: any = {}) {
	        return new ManagedSkill(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.skill = source["skill"];
	        this.deployedTo = source["deployedTo"];
	    }
	}
	export class OperationResult {
	    success: boolean;
	    message: string;
	    succeeded: number;
	    failed: number;
	    errors: string[];
	
	    static createFrom(source: any = {}) {
	        return new OperationResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.succeeded = source["succeeded"];
	        this.failed = source["failed"];
	        this.errors = source["errors"];
	    }
	}
	export class SkillInfo {
	    name: string;
	    description: string;
	    version: string;
	
	    static createFrom(source: any = {}) {
	        return new SkillInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.version = source["version"];
	    }
	}
	export class StatusResponse {
	    activeEnv: string;
	    activatedAt: string;
	    managedSkills: ManagedSkill[];
	    agents: AgentInfo[];
	    storeCount: number;
	    envCount: number;
	
	    static createFrom(source: any = {}) {
	        return new StatusResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.activeEnv = source["activeEnv"];
	        this.activatedAt = source["activatedAt"];
	        this.managedSkills = this.convertValues(source["managedSkills"], ManagedSkill);
	        this.agents = this.convertValues(source["agents"], AgentInfo);
	        this.storeCount = source["storeCount"];
	        this.envCount = source["envCount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace model {
	
	export class SkillRef {
	    Name: string;
	    Path: string;
	    IsManaged: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SkillRef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Path = source["Path"];
	        this.IsManaged = source["IsManaged"];
	    }
	}

}

