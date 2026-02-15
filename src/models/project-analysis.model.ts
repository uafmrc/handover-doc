import { IFileAnalysis } from "./file-analysis.model";

export interface IProjectAnalysis {
  projectName: string;
  framework?: string; // e.g., 'NestJS', 'Express', 'React', 'Next.js'
  totalFiles: number;
  totalLines: number;
  languages: Record<string, number>;
  files: IFileAnalysis[];
  dependencies: IDependencyInfo;
  architecture: IArchitectureInfo;
  todos?: ITodoItem[];
  envVars?: string[];
  apiRoutes?: IApiRoute[];
  database?: IDatabaseInfo;
  infrastructure?: IInfrastructureInfo;
}

export interface IDatabaseInfo {
  type: 'Prisma' | 'TypeORM' | 'Mongoose' | 'Unknown';
  models: string[];
  schemaFile?: string;
}

export interface IInfrastructureInfo {
  docker: {
    hasDockerfile: boolean;
    baseImage?: string;
    hasCompose: boolean;
    services?: string[];
  };
  ci: {
    provider: 'GitHub Actions' | 'GitLab CI' | 'None';
    workflows: string[];
  };
}

export interface IDependencyInfo {
  production: Record<string, string>;
  development: Record<string, string>;
  internal: IInternalDependency[];
}

export interface IInternalDependency {
  from: string;
  to: string;
  type: "import" | "require";
}

export interface IArchitectureInfo {
  entryPoints: string[];
  layers: ILayerInfo[];
  patterns: string[];
}

export interface ITodoItem {
  file: string;
  line: number;
  type: "TODO" | "FIXME" | "HACK" | "NOTE";
  text: string;
}

export interface IApiRoute {
  method: string;
  path: string;
  file: string;
  line: number;
}

export interface ILayerInfo {
  name: string;
  files: string[];
  description?: string;
}