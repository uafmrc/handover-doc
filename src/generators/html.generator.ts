import Handlebars from "handlebars";
import { FileUtils as fu } from "../utils/file.utils";
import { join } from "node:path";
import { marked } from "marked";
import { IProjectAnalysis } from "../models/project-analysis.model";
import { ILLMAnalysis } from "../models/llm-analysis.model";
import { i18n } from "../services/i18n.service";


export class HtmlGenerator {
  private template: HandlebarsTemplateDelegate | null = null;

  async initialize(): Promise<void> {
    const templatePath = join(__dirname, "../templates/report.hbs");
    const templateContent = await fu.readSingleFile(templatePath);
    
    Handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });

    Handlebars.registerHelper('t', function (key, options) {
      return i18n.t(key, options.hash);
    });

    Handlebars.registerHelper('locale', function () {
      return i18n.getLocale().split('-')[0];
    });

    this.template = Handlebars.compile(templateContent);
  }

  async generate(projectAnalysis: IProjectAnalysis, llmAnalyses: ILLMAnalysis[], projectSummary: string): Promise<string> {
    if (!this.template) {
      await this.initialize();
    }

    const functionsCount = projectAnalysis.files.reduce(
      (sum, file) => sum + file.functions.length,
      0,
    );

    const fileAnalysesData = llmAnalyses.map((analysis) => {
      const fileData = projectAnalysis.files.find(
        (f) => f.relativePath === analysis.filePath,
      );

      return {
        filePath: analysis.filePath,
        language: fileData?.language || "unknown",
        lines: fileData?.size || 0,
        summary: analysis.summary,
        purpose: analysis.purpose,
        keyFunctions: analysis.keyFunctions,
        dependencies: analysis.dependencies,
        improvements: analysis.improvements,
        complexity: analysis.complexity,
        qualityScore: analysis.qualityScore || 0,
      };
    });

    const fileTree = this.buildFileTree(projectAnalysis.files);

    const qualityScores = fileAnalysesData.reduce((acc, curr) => {
      const score = curr.qualityScore || 0;
      if (score > 0) {
        acc[score] = (acc[score] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    // Calcolo Technical Debt
    let techDebtScore = 0;
    
    // Punti per complessità
    fileAnalysesData.forEach(f => {
      if (f.complexity === 'high') techDebtScore += 5;
      else if (f.complexity === 'medium') techDebtScore += 3;
      else techDebtScore += 1;
    });

    // Punti per TODOs
    techDebtScore += (projectAnalysis.todos?.length || 0) * 2;

    // Normalizzazione (0-100 per semplicità di visualizzazione, ma può andare oltre)
    const techDebtLevel = techDebtScore < 50 ? 'Low' : techDebtScore < 150 ? 'Medium' : 'High';

    const data = {
      projectName: projectAnalysis.projectName,
      generatedDate: new Date().toLocaleDateString("it-IT", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      totalFiles: projectAnalysis.totalFiles,
      totalLines: projectAnalysis.totalLines,
      languagesCount: Object.keys(projectAnalysis.languages).length,
      functionsCount,
      projectSummary: await marked.parse(projectSummary, {
        async: false,
        gfm: true,
        pedantic: true
      }),
      architecture: projectAnalysis.architecture,
      dependencies: projectAnalysis.dependencies,
      
      // Advanced Analysis
      todos: projectAnalysis.todos || [],
      envVars: projectAnalysis.envVars || [],
      apiRoutes: projectAnalysis.apiRoutes || [],
      techDebt: {
        score: techDebtScore,
        level: techDebtLevel
      },
      database: projectAnalysis.database,
      infrastructure: projectAnalysis.infrastructure,

      fileAnalyses: fileAnalysesData,
      fileTree: JSON.stringify(fileTree),
      languages: JSON.stringify(projectAnalysis.languages),
      complexity: JSON.stringify(fileAnalysesData.reduce((acc, curr) => {
        acc[curr.complexity] = (acc[curr.complexity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)),
      qualityScores: JSON.stringify(qualityScores),
    };

    return this.template!(data);
  }

  private buildFileTree(files: { relativePath: string; size: number }[]): any {
    const root = { name: "root", children: [] as any[] };

    for (const file of files) {
      const parts = file.relativePath.split("/");
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;

        let child = current.children.find((c: any) => c.name === part);

        if (!child) {
          child = {
            name: part,
            children: isFile ? undefined : [],
            value: isFile ? file.size : undefined,
            type: isFile ? "file" : "directory",
          };
          current.children.push(child);
        }

        if (!isFile) {
          current = child;
        }
      }
    }

    return root;
  }
}
