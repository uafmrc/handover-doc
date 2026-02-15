import { ILLMAnalysis } from "../models/llm-analysis.model";
import { IProjectAnalysis } from "../models/project-analysis.model";
import { i18n } from "../services/i18n.service";

export class MarkdownGenerator {

  generateReadme(projectAnalysis: IProjectAnalysis, projectSummary: string): string {
    const sections: string[] = [];

    sections.push(
      `# ${projectAnalysis.projectName}`,
      '',
      `> ${i18n.t('readme.title')}`,
      '',
      `## 📋 ${i18n.t('readme.summary')}`,
      '',
      projectSummary,
      '',
      `## 📊 ${i18n.t('readme.stats')}`,
      '',
      `- **${i18n.t('readme.totalFiles')}**: ${projectAnalysis.totalFiles}`,
      `- **${i18n.t('readme.totalLines')}**: ${projectAnalysis.totalLines}`,
      `- **${i18n.t('readme.languages')}**: ${Object.keys(projectAnalysis.languages).join(', ')}`,
      ''
    );

    const functionsCount = projectAnalysis.files.reduce(
      (sum, file) => sum + file.functions.length,
      0
    );
    sections.push(`- **${i18n.t('readme.totalFunctions')}**: ${functionsCount}`, '');

    if (projectAnalysis.architecture.entryPoints.length > 0) {
      sections.push(
        `## 🚪 ${i18n.t('readme.entryPoints')}`,
        ''
      );
      projectAnalysis.architecture.entryPoints.forEach(entry => {
        sections.push(`- \`${entry}\``);
      });
      sections.push('');
    }

    if (projectAnalysis.architecture.patterns.length > 0) {
      sections.push(
        `## 🏗️ ${i18n.t('readme.patterns')}`,
        ''
      );
      projectAnalysis.architecture.patterns.forEach(pattern => {
        sections.push(`- ${pattern}`);
      });
      sections.push('');
    }

    sections.push(
      `## 📦 ${i18n.t('readme.dependencies')}`,
      '',
      `### ${i18n.t('readme.production')}`,
      '',
      '```json',
      JSON.stringify(projectAnalysis.dependencies.production, null, 2),
      '```',
      ''
    );

    if (Object.keys(projectAnalysis.dependencies.development).length > 0) {
      sections.push(
        `### ${i18n.t('readme.development')}`,
        '',
        '```json',
        JSON.stringify(projectAnalysis.dependencies.development, null, 2),
        '```',
        ''
      );
    }

    sections.push(
      `## 🔗 ${i18n.t('readme.usefulLinks')}`,
      '',
      `- [${i18n.t('readme.detailedArchitecture')}](./ARCHITECTURE.md)`,
      `- [${i18n.t('readme.projectSetup')}](./SETUP.md)`,
      '',
      '---',
      '',
      `*${i18n.t('readme.generatedOn')} ${new Date().toLocaleDateString(i18n.getLocale())}*`
    );

    return sections.join('\n');
  }

  generateArchitecture(projectAnalysis: IProjectAnalysis, llmAnalyses: ILLMAnalysis[]): string {
    const sections: string[] = [];

    sections.push(
      `# ${i18n.t('architecture.title')} - ${projectAnalysis.projectName}`,
      '',
      `## 📐 ${i18n.t('architecture.overview')}`,
      ''
    );

    if (projectAnalysis.architecture.layers.length > 0) {
      sections.push(
        `### ${i18n.t('architecture.applicationLayers')}`,
        ''
      );

      projectAnalysis.architecture.layers.forEach(layer => {
        sections.push(`#### ${layer.name}`, '');
        layer.files.forEach(file => {
          sections.push(`- \`${file}\``);
        });
        sections.push('');
      });
    }

    sections.push(
      `## 📄 ${i18n.t('architecture.mainComponents')}`,
      ''
    );

    const importantFiles = llmAnalyses
      .filter(a => a.complexity === 'high' || a.keyFunctions.length > 0)
      .slice(0, 10);

    importantFiles.forEach(analysis => {
      sections.push(
        `### \`${analysis.filePath}\``,
        '',
        `**${i18n.t('architecture.purpose')}**: ${analysis.purpose}`,
        ''
      );

      if (analysis.keyFunctions.length > 0) {
        sections.push(`**${i18n.t('architecture.keyFunctions')}**:`, '');
        analysis.keyFunctions.forEach(func => {
          sections.push(`- **\`${func.name}\`**: ${func.explanation}`);
        });
        sections.push('');
      }

      sections.push(
        `**${i18n.t('architecture.complexity')}**: ${analysis.complexity}`,
        '',
        '---',
        ''
      );
    });

    sections.push(
      `## 🔄 ${i18n.t('architecture.mainFlows')}`,
      '',
      `> ${i18n.t('architecture.manualFlowsNote')}`,
      ''
    );

    if (projectAnalysis.dependencies.internal.length > 0) {
      sections.push(
        `## 🔗 ${i18n.t('architecture.internalDependencies')}`,
        '',
        '```mermaid',
        'graph LR'
      );
      
      const uniqueDeps = projectAnalysis.dependencies.internal.slice(0, 20);
      uniqueDeps.forEach((dep, idx) => {
        const fromNode = `F${idx}["${dep.from}"]`;
        const toNode = `T${idx}["${dep.to}"]`;
        sections.push(`  ${fromNode} --> ${toNode}`);
      });
      
      sections.push('```', '');
    }

    return sections.join('\n');
  }

  generateSetup(projectAnalysis: IProjectAnalysis): string {
    const sections: string[] = [];

    sections.push(
      `# Setup - ${projectAnalysis.projectName}`,
      '',
      `## 📋 ${i18n.t('setup.prerequisites')}`,
      '',
      `- ${i18n.t('setup.nodeVersion')}`,
      `- ${i18n.t('setup.npmYarn')}`,
      ''
    );

    const hasDeps = Object.keys(projectAnalysis.dependencies.production).length > 0;
    
    if (hasDeps) {
      sections.push(
        `## 🔧 ${i18n.t('setup.installation')}`,
        '',
        '```bash',
        `# ${i18n.t('setup.cloneRepo')}`,
        'git clone <repository-url>',
        'cd ' + projectAnalysis.projectName.toLowerCase().replaceAll(/\s+/g, '-'),
        '',
        `# ${i18n.t('setup.installDeps')}`,
        'npm install',
        '',
        `# ${i18n.t('setup.copyConfig')}`,
        'cp .env.example .env',
        '```',
        ''
      );
    }

    sections.push(
      `## 🚀 ${i18n.t('setup.projectStartup')}`,
      '',
      '```bash',
      `# ${i18n.t('setup.development')}`,
      'npm run dev',
      '',
      `# ${i18n.t('setup.build')}`,
      'npm run build',
      '',
      `# ${i18n.t('setup.production')}`,
      'npm start',
      '```',
      '',
      `## ⚙️ ${i18n.t('setup.configuration')}`,
      '',
      `${i18n.t('setup.envVars')}:`,
      '',
      '```env',
      `# ${i18n.t('setup.envVarsNote')}`,
      'NODE_ENV=development',
      'PORT=3000',
      '```',
      '',
      `## 🧪 ${i18n.t('setup.testing')}`,
      '',
      '```bash',
      `# ${i18n.t('setup.runTests')}`,
      'npm test',
      '',
      `# ${i18n.t('setup.testCoverage')}`,
      'npm run test:coverage',
      '```',
      '',
      `## 📝 ${i18n.t('setup.importantNotes')}`,
      '',
      `- ${i18n.t('setup.externalCreds')}`,
      `- ${i18n.t('setup.thirdPartyDocs')}`,
      `- ${i18n.t('setup.accessConfig')}`,
      ''
    );

    return sections.join('\n');
  }

  generateApi(llmAnalyses: ILLMAnalysis[]): string {
    const sections: string[] = [];

    sections.push(`# ${i18n.t('api.title')}`, '');

    const apiFiles = llmAnalyses.filter(a => 
      a.filePath.toLowerCase().includes('api') ||
      a.filePath.toLowerCase().includes('route') ||
      a.filePath.toLowerCase().includes('controller')
    );

    if (apiFiles.length === 0) {
      sections.push(
        `> ${i18n.t('api.noApiDetected')}`,
        ''
      );
      return sections.join('\n');
    }

    sections.push(`## ${i18n.t('api.endpointsDetected')}`, '');

    apiFiles.forEach(file => {
      sections.push(
        `### ${file.filePath}`,
        '',
        file.purpose,
        ''
      );

      if (file.keyFunctions.length > 0) {
        file.keyFunctions.forEach(func => {
          sections.push(
            `#### \`${func.name}\``,
            '',
            func.explanation,
            '',
            `**${i18n.t('api.usage')}**:`,
            func.usage,
            ''
          );
        });
      }

      sections.push('---', '');
    });

    return sections.join('\n');
  }
}
