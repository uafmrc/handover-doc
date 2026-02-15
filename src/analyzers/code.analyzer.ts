import { join } from 'node:path';
import { IConfig } from '../models/config.model';
import { IFileAnalysis } from '../models/file-analysis.model';
import { IArchitectureInfo, IDependencyInfo, IProjectAnalysis } from '../models/project-analysis.model';
import { TypeScriptParser } from '../utils/parsers/typescript.parser';
import { FileUtils as fu } from '../utils/file.utils';

export class CodeAnalyzer {
  private readonly tsParser: TypeScriptParser;

  constructor() {
    this.tsParser = new TypeScriptParser();
  }

  async analyzeProject(config: IConfig): Promise<IProjectAnalysis> {
    const files = await fu.getProjectFiles(config);
    const fileAnalyses: IFileAnalysis[] = [];
    let totalLines = 0;
    const languageCounts: Record<string, number> = {};

    for (const filePath of files) {
      const analysis = await this.analyzeFile(filePath, config);
      if (analysis) {
        fileAnalyses.push(analysis);
        totalLines += analysis.size;
        languageCounts[analysis.language] = (languageCounts[analysis.language] || 0) + 1;
      }
    }

    const dependencies = await this.analyzeDependencies(config, fileAnalyses);
    const framework = await this.detectFramework(dependencies);
    const architecture = this.analyzeArchitecture(fileAnalyses, config, framework, dependencies);
    const todos = this.extractTodos(fileAnalyses);
    const envVars = this.extractEnvVars(fileAnalyses);
    const apiRoutes = this.detectApiRoutes(fileAnalyses);
    const database = await this.analyzeDatabase(fileAnalyses, config);
    const infrastructure = await this.analyzeInfrastructure(config);

    return {
      projectName: config.projectName,
      framework,
      totalFiles: fileAnalyses.length,
      totalLines,
      languages: languageCounts,
      files: fileAnalyses,
      dependencies,
      architecture,
      todos,
      envVars,
      apiRoutes,
      database,
      infrastructure
    };
  }

  private async detectFramework(dependencies: IDependencyInfo): Promise<string> {
    const deps = { ...dependencies.production, ...dependencies.development };
    
    if (deps['@nestjs/core']) return 'NestJS';
    if (deps['next']) return 'Next.js';
    if (deps['nuxt']) return 'Nuxt.js';
    if (deps['react']) return 'React';
    if (deps['vue']) return 'Vue.js';
    if (deps['@angular/core']) return 'Angular';
    if (deps['svelte']) return 'Svelte';
    if (deps['astro']) return 'Astro';
    if (deps['express']) return 'Express';
    if (deps['fastify']) return 'Fastify';
    if (deps['hapi']) return 'Hapi';
    if (deps['koa']) return 'Koa';
    
    return 'Unknown';
  }

  private extractTodos(files: IFileAnalysis[]): any[] {
    const todos: any[] = [];
    const regex = /\/\/\s*(TODO|FIXME|HACK|NOTE):\s*(.*)/g;

    for (const file of files) {
      let match;
      while ((match = regex.exec(file.content)) !== null) {
        // Calcola la linea approssimativa
        const linesUpToMatch = file.content.substring(0, match.index).split('\n').length;
        
        todos.push({
          file: file.relativePath,
          line: linesUpToMatch,
          type: match[1],
          text: match[2].trim()
        });
      }
    }
    return todos;
  }

  private extractEnvVars(files: IFileAnalysis[]): string[] {
    const envVars = new Set<string>();
    const regex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;

    for (const file of files) {
      let match;
      while ((match = regex.exec(file.content)) !== null) {
        envVars.add(match[1]);
      }
    }
    return Array.from(envVars).sort((a, b) => a.localeCompare(b));
  }

  private detectApiRoutes(files: IFileAnalysis[]): any[] {
    const routes: any[] = [];
    const expressRegex = /\.(get|post|put|delete|patch|options|head)\s*\(\s*['"]([^'"]+)['"]/gi;
    const nestRegex = /@(Get|Post|Put|Delete|Patch|Options|Head)\s*\(\s*['"]([^'"]+)['"]\)/g;
    const hapiRegex = /method\s*:\s*['"](GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)['"]\s*,\s*path\s*:\s*['"]([^'"]+)['"]/gi;

    for (const file of files) {
      const lowerPath = file.relativePath.toLowerCase();
      let match;
      
      // Express / Fastify / Koa
      while ((match = expressRegex.exec(file.content)) !== null) {
        const linesUpToMatch = file.content.substring(0, match.index).split('\n').length;
        routes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          file: file.relativePath,
          line: linesUpToMatch,
          framework: 'Express/Fastify/Koa'
        });
      }

      // NestJS
      while ((match = nestRegex.exec(file.content)) !== null) {
        const linesUpToMatch = file.content.substring(0, match.index).split('\n').length;
        routes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          file: file.relativePath,
          line: linesUpToMatch,
          framework: 'NestJS'
        });
      }

      // Hapi
      while ((match = hapiRegex.exec(file.content)) !== null) {
        const linesUpToMatch = file.content.substring(0, match.index).split('\n').length;
        routes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          file: file.relativePath,
          line: linesUpToMatch,
          framework: 'Hapi'
        });
      }

      // Next.js Pages Router (API Routes)
      if (lowerPath.startsWith('pages/api/')) {
        const apiPath = '/' + file.relativePath
          .replace('pages/', '')
          .replace(/\.(ts|js|tsx|jsx)$/, '')
          .replace(/\/index$/, '');
        
        routes.push({
          method: 'ALL',
          path: apiPath,
          file: file.relativePath,
          line: 1,
          framework: 'Next.js (Pages)'
        });
      }

      // Next.js App Router (Route Handlers)
      if (lowerPath.endsWith('/route.ts') || lowerPath.endsWith('/route.js')) {
        const apiPath = '/' + file.relativePath
          .replace('app/', '')
          .replace(/\/route\.(ts|js)$/, '');
        
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
        for (const method of methods) {
          if (file.content.includes(`export async function ${method}`) || file.content.includes(`export function ${method}`)) {
            routes.push({
              method,
              path: apiPath,
              file: file.relativePath,
              line: 1,
              framework: 'Next.js (App)'
            });
          }
        }
      }
    }

    return routes;
  }

  private async analyzeFile(filePath: string, config: IConfig): Promise<IFileAnalysis | null> {
    try {
      const content = await fu.readSingleFile(filePath);
      const ext = fu.getFileExtension(filePath);
      const language = fu.getLanguageFromExtension(ext);
      const relativePath = fu.getRelativePath(filePath, config.projectPath);

      // Log progresso
      if (Math.random() < 0.1) { // Log il 10% dei file per non appesantire
        console.log(`   📄 Analizzando: ${relativePath}`);
      }
      
      let parsed: Partial<IFileAnalysis> = {
        functions: [],
        classes: [],
        imports: [],
        exports: []
      };

      if (language === 'typescript' || language === 'javascript') {
        parsed = await this.tsParser.parse(filePath, content);
      }

      return {
        path: filePath,
        relativePath,
        language,
        size: fu.countLines(content),
        content,
        ...parsed,
        functions: parsed.functions || [],
        classes: parsed.classes || [],
        imports: parsed.imports || [],
        exports: parsed.exports || []
      };
    } catch (error: any) {
      console.error(`❌ Errore analizzando file ${filePath}:`, error.message);
      return null;
    }
  }

  private async analyzeDependencies(config: IConfig, fileAnalyses: IFileAnalysis[]): Promise<IDependencyInfo> {
    const packageJsonPath = join(config.projectPath, 'package.json');
    let production: Record<string, string> = {};
    let development: Record<string, string> = {};

    try {
      if (await fu.fileExists(packageJsonPath)) {
        const packageJson = await fu.readJson<any>(packageJsonPath);
        production = packageJson.dependencies || {};
        development = packageJson.devDependencies || {};
      }
    } catch (error) {
      console.error('Error reading package.json:', error);
    }

    const internal = fileAnalyses.flatMap(file => 
      file.imports
        .filter(imp => imp.source.startsWith('.') || imp.source.startsWith('/'))
        .map(imp => ({
          from: file.relativePath,
          to: imp.source,
          type: 'import' as const
        }))
    );

    return {
      production,
      development,
      internal
    };
  }

  private analyzeArchitecture(fileAnalyses: IFileAnalysis[], config: IConfig, framework: string, dependencies: IDependencyInfo): IArchitectureInfo {
    const entryPoints = this.detectEntryPoints(fileAnalyses, framework, config);
    let layers = this.detectLayers(fileAnalyses, framework);
    const patterns = this.detectPatterns(fileAnalyses, dependencies);
    
    // Enhance layers with dependency analysis for unclassified files
    const classifiedFiles = new Set(layers.flatMap(l => l.files));
    const unclassifiedFiles = fileAnalyses
        .filter(f => !classifiedFiles.has(f.relativePath))
        .map(f => f.relativePath);
        
    if (unclassifiedFiles.length > 0) {
      // Calculate incoming dependencies (dependents) for unclassified files
      const incomingDeps: Record<string, number> = {};
      dependencies.internal.forEach(dep => {
        const target = unclassifiedFiles.find(u => u.endsWith(dep.to) || dep.to.endsWith(u)); // Relaxed match
        if (target) incomingDeps[target] = (incomingDeps[target] || 0) + 1;
      });

      const sharedFiles: string[] = [];
      const coreFiles: string[] = [];
      
      unclassifiedFiles.forEach(file => {
        const count = incomingDeps[file] || 0;
        if (count > 5) coreFiles.push(file); // Heavily used
        else if (count > 2) sharedFiles.push(file); // Moderately used
      });

      if (coreFiles.length > 0) layers.push({ name: 'Core', files: coreFiles });
      if (sharedFiles.length > 0) layers.push({ name: 'Shared', files: sharedFiles });
    }

    return {
      entryPoints,
      layers,
      patterns
    };
  }

  private detectEntryPoints(fileAnalyses: IFileAnalysis[], framework: string, config: IConfig): string[] {
    const entryPoints: string[] = [];

    // Framework specific entry points
    if (framework === 'NestJS') {
      const mainFile = fileAnalyses.find(f => f.content.includes('NestFactory.create'));
      if (mainFile) entryPoints.push(mainFile.relativePath);
    } else if (framework === 'Next.js') {
      const pages = fileAnalyses.filter(f => f.relativePath.startsWith('pages/_app') || f.relativePath.startsWith('app/layout'));
      entryPoints.push(...pages.map(p => p.relativePath));
    } else if (framework === 'Nuxt.js') {
      const config = fileAnalyses.find(f => /nuxt\.config\.(ts|js)$/.exec(f.relativePath));
      if (config) entryPoints.push(config.relativePath);
    } else if (framework === 'React' || framework === 'Vue.js' || framework === 'Svelte') {
      const index = fileAnalyses.find(f => 
        f.relativePath.includes('src/index') || 
        f.relativePath.includes('src/main') ||
        f.content.includes('createApp(') ||
        f.content.includes('new Vue(') ||
        f.content.includes('new App(')
      );
      if (index) entryPoints.push(index.relativePath);
    } else if (framework === 'Angular') {
      const main = fileAnalyses.find(f => f.content.includes('bootstrapModule('));
      if (main) entryPoints.push(main.relativePath);
    } else if (framework === 'Astro') {
      const config = fileAnalyses.find(f => /astro\.config\.(mjs|js|ts)$/.exec(f.relativePath));
      if (config) entryPoints.push(config.relativePath);
    } else if (['Express', 'Fastify', 'Hapi', 'Koa'].includes(framework)) {
      const server = fileAnalyses.find(f => 
        f.content.includes('.listen(') || 
        f.content.includes('Hapi.server(') ||
        f.content.includes('new Koa(')
      );
      if (server) entryPoints.push(server.relativePath);
    }

    // 2. Standard patterns (fallback)
    if (entryPoints.length === 0) {
      const entryPointPatterns:RegExp[] = [
        /index\.(ts|js)$/,
        /main\.(ts|js)$/,
        /app\.(ts|js)$/,
        /server\.(ts|js)$/,
        /cli\.(ts|js)$/
      ];

      for (const file of fileAnalyses) {
        // Prioritize root files or src/ root
        const depth = file.relativePath.split('/').length;
        if (depth <= 2 && entryPointPatterns.some(pattern => pattern.test(file.relativePath))) {
            entryPoints.push(file.relativePath);
        }
      }
    }
    
    // Remove duplicates
    return [...new Set(entryPoints)];
  }

  private detectLayers(fileAnalyses: IFileAnalysis[], framework: string): any[] {
    const layers: Record<string, string[]> = {
      'Controllers/Routes': [],
      'Services/Business Logic': [],
      'Data Access/Repositories': [],
      'Models/Types': [],
      'Utilities': [],
      'Configuration': [],
      'Tests': [],
      'Components': [], // For React/Frontend
      'Pages': [],      // For Next.js
      'Hooks': []       // For React
    };

    for (const file of fileAnalyses) {
      const lowerPath = file.relativePath.toLowerCase();

      // Framework Specific Classification
      if (framework === 'NestJS') {
          if (file.classes.some(c => c.name.endsWith('Controller'))) layers['Controllers/Routes'].push(file.relativePath);
          else if (file.classes.some(c => c.name.endsWith('Service'))) layers['Services/Business Logic'].push(file.relativePath);
          else if (file.classes.some(c => c.name.endsWith('Module'))) layers['Configuration'].push(file.relativePath);
      }
      
      if (['React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Svelte'].includes(framework)) {
           if (lowerPath.includes('/components/')) layers['Components'].push(file.relativePath);
           if (lowerPath.includes('/pages/') || lowerPath.includes('/app/')) layers['Pages'].push(file.relativePath);
           if (lowerPath.includes('/hooks/') || lowerPath.includes('/composables/') || lowerPath.includes('use')) layers['Hooks'].push(file.relativePath);
           if (lowerPath.includes('/store/') || lowerPath.includes('/state/')) layers['Services/Business Logic'].push(file.relativePath);
      }

      if (framework === 'Angular') {
           if (lowerPath.endsWith('.component.ts')) layers['Components'].push(file.relativePath);
           else if (lowerPath.endsWith('.service.ts')) layers['Services/Business Logic'].push(file.relativePath);
           else if (lowerPath.includes('routing.module.ts') || lowerPath.endsWith('.routes.ts') || lowerPath.endsWith('.route.ts')) layers['Controllers/Routes'].push(file.relativePath);
           else if (lowerPath.endsWith('.module.ts')) layers['Configuration'].push(file.relativePath);
           else if (lowerPath.endsWith('.pipe.ts')) layers['Utilities'].push(file.relativePath);
           else if (lowerPath.endsWith('.directive.ts')) layers['Components'].push(file.relativePath);
           else if (lowerPath.endsWith('.guard.ts') || lowerPath.endsWith('.interceptor.ts')) layers['Services/Business Logic'].push(file.relativePath);
      }

      // General Fallback (if not already classified or for other frameworks)
      const isClassified = Object.values(layers).some(arr => arr.includes(file.relativePath));
      if (!isClassified) {
          if (lowerPath.includes('controller') || lowerPath.includes('route')) {
            layers['Controllers/Routes'].push(file.relativePath);
          } else if (lowerPath.includes('service') || lowerPath.includes('business')) {
            layers['Services/Business Logic'].push(file.relativePath);
          } else if (lowerPath.includes('repository') || lowerPath.includes('dao') || lowerPath.includes('database') || lowerPath.includes('entity')) {
            layers['Data Access/Repositories'].push(file.relativePath);
          } else if (lowerPath.includes('model') || lowerPath.includes('type') || lowerPath.includes('interface') || lowerPath.includes('dto')) {
            layers['Models/Types'].push(file.relativePath);
          } else if (lowerPath.includes('util') || lowerPath.includes('helper') || lowerPath.includes('lib')) {
            layers['Utilities'].push(file.relativePath);
          } else if (lowerPath.includes('config') || lowerPath.includes('env')) {
            layers['Configuration'].push(file.relativePath);
          } else if (lowerPath.includes('test') || lowerPath.includes('spec')) {
            layers['Tests'].push(file.relativePath);
          }
      }
    }

    return Object.entries(layers)
      .filter(([_, files]) => files.length > 0)
      .map(([name, files]) => ({ name, files }));
  }

  private detectPatterns(fileAnalyses: IFileAnalysis[], dependencies: IDependencyInfo): string[] {
    const patterns: Set<string> = new Set();

    const hasPattern = (pattern: string) => fileAnalyses.some(f => f.relativePath.toLowerCase().includes(pattern));
    const contentContains = (text: string) => fileAnalyses.some(f => f.content.includes(text));

    // Structural Patterns via Filename/Keywords
    if (hasPattern('controller')) patterns.add('MVC/Controller Pattern');
    if (hasPattern('service')) patterns.add('Service Layer Pattern');
    if (hasPattern('repository')) patterns.add('Repository Pattern');
    if (hasPattern('middleware')) patterns.add('Middleware Pattern');
    if (hasPattern('provider') || hasPattern('adapter')) patterns.add('Adapter/Provider Pattern');
    if (hasPattern('facade')) patterns.add('Facade Pattern');
    if (hasPattern('decorator')) patterns.add('Decorator Pattern');
    if (hasPattern('strategy')) patterns.add('Strategy Pattern');
    if (hasPattern('/domain/') || hasPattern('/aggregates/') || hasPattern('/value-objects/')) patterns.add('Domain-Driven Design (DDD)');
    if (hasPattern('/use-cases/') || hasPattern('/entities/') || hasPattern('/gateways/')) patterns.add('Clean/Hexagonal Architecture');
    if (hasPattern('/commands/') && hasPattern('/queries/')) patterns.add('CQRS Pattern');
    if (hasPattern('/microservices/') || hasPattern('/services/')) {
      const deps = { ...dependencies.production };
      if (deps['amqplib'] || deps['kafkajs'] || deps['@nestjs/microservices']) {
          patterns.add('Event-Driven Microservices');
      }
    }

    if (contentContains('ApolloServer') || contentContains('graphql-yoga') || hasPattern('.graphql')) patterns.add('GraphQL API');
    if (contentContains('Handler') && (contentContains('Lambda') || contentContains('Context'))) patterns.add('Serverless/Functions');
    if (contentContains('@Injectable') || contentContains('Container.get') || contentContains('Inversify')) patterns.add('Dependency Injection');

    // Heuristic Patterns via Code Analysis
    for (const file of fileAnalyses) {
      // Singleton: Class with private static instance
      for (const cls of file.classes) {
        const hasStaticInstance = cls.properties.some(p => p.name === 'instance' && p.visibility === 'private');
        if (hasStaticInstance) patterns.add('Singleton Pattern');

        // Factory: Method starting with create returning something
        const hasFactoryMethod = cls.methods.some(m => m.name.startsWith('create') && m.returnType && m.returnType !== 'void');
        if (hasFactoryMethod && (cls.name.includes('Factory') || file.relativePath.includes('factory'))) {
            patterns.add('Factory Pattern');
        }
        
        // Observer: EventEmitter usage
        if (file.content.includes('EventEmitter') || file.content.includes('subscribe') || file.content.includes('Observable')) {
          patterns.add('Observer/PubSub Pattern');
        }
        
        // Decorator: Usage of @
        if (file.content.includes('@')) {
          patterns.add('Decorator Pattern');
        }
      }
    }
    
    const hasModules = fileAnalyses.some(f => f.imports.length > 0 && f.exports.length > 0);
    if (hasModules) patterns.add('Modular Architecture');

    return Array.from(patterns).sort((a, b) => a.localeCompare(b));
  }

  private async analyzeDatabase(files: IFileAnalysis[], config: IConfig): Promise<any> {
    const dbInfo: any = {
      type: 'Unknown',
      models: [],
      schemaFile: undefined
    };

    const contentContains = (text: string) => files.some(f => f.content.includes(text));

    // 1. Check for Prisma
    const prismaFiles = await fu.findFiles(config.projectPath, 'prisma/schema.prisma');
    if (prismaFiles.length > 0) {
      const prismaPath = prismaFiles[0];
      dbInfo.type = 'Prisma';
      dbInfo.schemaFile = 'prisma/schema.prisma';
      try {
        const content = await fu.readSingleFile(prismaPath);
        const modelRegex = /model\s+(\w+)\s+{/g;
        let match;
        while ((match = modelRegex.exec(content)) !== null) {
          dbInfo.models.push(match[1]);
        }
      } catch (e) {
        console.error('Error reading Prisma schema:', e);
      }
      return dbInfo;
    }

    // 2. Check for Drizzle ORM
    const drizzleFiles = files.filter(f => f.content.includes('pgTable(') || f.content.includes('mysqlTable(') || f.content.includes('sqliteTable('));
    if (drizzleFiles.length > 0) {
      dbInfo.type = 'Drizzle ORM';
      const modelRegex = /export const (\w+) = (pg|mysql|sqlite)Table\(/g;
      for (const file of drizzleFiles) {
          let match;
          while ((match = modelRegex.exec(file.content)) !== null) {
              dbInfo.models.push(match[1]);
          }
      }
      return dbInfo;
    }

    // 3. Check for TypeORM
    const typeOrmEntities = files.filter(f => f.content.includes('@Entity'));
    if (typeOrmEntities.length > 0) {
      dbInfo.type = 'TypeORM';
      dbInfo.models = typeOrmEntities.flatMap(f => 
        f.classes.filter(c => f.content.includes(`@Entity`)).map(c => c.name)
      );
      return dbInfo;
    }

    // 4. Check for Sequelize
    const sequelizeFiles = files.filter(f => f.content.includes('Sequelize') && (f.content.includes('.define(') || f.content.includes('extends Model')));
    if (sequelizeFiles.length > 0) {
      dbInfo.type = 'Sequelize';
      const defineRegex = /\.define\(['"](\w+)['"]/g;
      for (const file of sequelizeFiles) {
          let match;
          while ((match = defineRegex.exec(file.content)) !== null) {
              dbInfo.models.push(match[1]);
          }
          // Check for class-based models
          file.classes.forEach(c => {
              if (file.content.includes(`class ${c.name} extends Model`)) dbInfo.models.push(c.name);
          });
      }
      return dbInfo;
    }

    // 5. Check for Mongoose
    const mongooseSchemas = files.filter(f => f.content.includes('new Schema') || f.content.includes('mongoose.model'));
    if (mongooseSchemas.length > 0) {
      dbInfo.type = 'Mongoose';
      dbInfo.models = mongooseSchemas.map(f => f.relativePath.split('/').pop()?.replace('.ts', '').replace('.js', '') || 'Unknown');
      return dbInfo;
    }

    // 6. Check for Knex
    if (contentContains('knex(') || contentContains('knex.schema')) {
      dbInfo.type = 'Knex.js (Query Builder)';
      return dbInfo;
    }

    // 7. Check for Firebase/Firestore
    if (contentContains('getFirestore(') || contentContains('initializeApp(') && contentContains('firebase')) {
      dbInfo.type = 'Firebase Firestore';
      return dbInfo;
    }

    // 8. Check for Supabase
    if (contentContains('createClient(') && contentContains('@supabase/supabase-js')) {
      dbInfo.type = 'Supabase (PostgreSQL)';
      return dbInfo;
    }

    return dbInfo;
  }

  private async analyzeInfrastructure(config: IConfig): Promise<any> {
    const infra: any = {
      docker: {
        hasDockerfile: false,
        baseImage: undefined,
        hasCompose: false,
        services: []
      },
      kubernetes: {
        hasManifests: false,
        hasHelm: false
      },
      iac: {
        terraform: false,
        pulumi: false,
        cdk: false
      },
      ci: {
        providers: [],
        workflows: []
      },
      cloudPlatforms: []
    };

    // Docker
    const dockerfiles = await fu.findFiles(config.projectPath, '**/Dockerfile');
    if (dockerfiles.length > 0) {
      infra.docker.hasDockerfile = true;
      try {
        const content = await fu.readSingleFile(dockerfiles[0]);
        const fromRegex = /FROM\s+([^\s]+)/;
        const fromMatch = fromRegex.exec(content);
        if (fromMatch) infra.docker.baseImage = fromMatch[1];
      } catch {}
    }

    const composeFiles = await fu.findFiles(config.projectPath, '**/docker-compose.{yml,yaml}');
    if (composeFiles.length > 0) {
      infra.docker.hasCompose = true;
      try {
        const content = await fu.readSingleFile(composeFiles[0]);
        const serviceRegex = /^\s{2}(\w+):/mg;
        let match;
        while ((match = serviceRegex.exec(content)) !== null) {
          infra.docker.services.push(match[1]);
        }
      } catch {}
    }

    // Kubernetes
    const k8sFiles = await fu.findFiles(config.projectPath, '**/{deployment,service,ingress,k8s}/*.{yml,yaml}');
    if (k8sFiles.length > 0) infra.kubernetes.hasManifests = true;
    
    const helmFiles = await fu.findFiles(config.projectPath, '**/Chart.yaml');
    if (helmFiles.length > 0) infra.kubernetes.hasHelm = true;

    // IaC
    const tfFiles = await fu.findFiles(config.projectPath, '**/*.tf');
    if (tfFiles.length > 0) infra.iac.terraform = true;

    const pulumiFiles = await fu.findFiles(config.projectPath, '**/Pulumi.yaml');
    if (pulumiFiles.length > 0) infra.iac.pulumi = true;

    const cdkFiles = await fu.findFiles(config.projectPath, '**/cdk.json');
    if (cdkFiles.length > 0) infra.iac.cdk = true;

    // CI/CD
    const githubActions = await fu.findFiles(config.projectPath, '.github/workflows/*.{yml,yaml}');
    if (githubActions.length > 0) {
      infra.ci.providers.push('GitHub Actions');
      infra.ci.workflows.push(...githubActions.map(f => f.split('/').pop() || ''));
    }

    if (await fu.fileExists(join(config.projectPath, '.gitlab-ci.yml'))) {
      infra.ci.providers.push('GitLab CI');
    }

    if (await fu.fileExists(join(config.projectPath, 'azure-pipelines.yml'))) {
      infra.ci.providers.push('Azure Pipelines');
    }

    if (await fu.fileExists(join(config.projectPath, 'bitbucket-pipelines.yml'))) {
      infra.ci.providers.push('Bitbucket Pipelines');
    }

    if (await fu.fileExists(join(config.projectPath, 'Jenkinsfile'))) {
      infra.ci.providers.push('Jenkins');
    }

    // Cloud Platforms
    if (await fu.fileExists(join(config.projectPath, 'vercel.json')) || await fu.directoryExists(join(config.projectPath, '.vercel'))) {
      infra.cloudPlatforms.push('Vercel');
    }
    if (await fu.fileExists(join(config.projectPath, 'netlify.toml')) || await fu.directoryExists(join(config.projectPath, '.netlify'))) {
      infra.cloudPlatforms.push('Netlify');
    }
    if (await fu.fileExists(join(config.projectPath, 'serverless.yml'))) {
      infra.cloudPlatforms.push('Serverless Framework');
    }
    if (await fu.fileExists(join(config.projectPath, 'firebase.json'))) {
      infra.cloudPlatforms.push('Firebase');
    }

    return infra;
  }
}
