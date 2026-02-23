import type { Project } from './types';
export declare function createProject(name: string, specPath: string, baseUrl: string): Project;
export declare function getProject(id: number): Project | undefined;
export declare function getProjectByName(name: string): Project | undefined;
export declare function listProjects(): Project[];
export declare function updateProject(id: number, updates: Partial<Pick<Project, 'name' | 'spec_path' | 'base_url'>>): Project | undefined;
export declare function deleteProject(id: number): void;
//# sourceMappingURL=projects.d.ts.map