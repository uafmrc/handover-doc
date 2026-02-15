import { Command } from "commander";
import { join, resolve } from "node:path";
import { CodeAnalyzer } from "./analyzers/code.analyzer";
import { HtmlGenerator } from "./generators/html.generator";
import { MarkdownGenerator } from "./generators/markdown.generator";
import { INIT_EXAMPLE_CONFIG } from "./helpers/config.helpers";
import { BrainTypeEnum } from "./models/brain.model";
import { ConfigSchema } from "./models/config.model";
import { BrainService } from "./services/brain.service";
import { i18n } from "./services/i18n.service";
import { FileUtils as fu } from "./utils/file.utils";

const program = new Command();

program
  .name("handover-doc")
  .description("Genera documentazione automatica per passaggio di consegne di progetti software")
  .version("1.0.0");

program
  .command("generate")
  .description("Genera la documentazione del progetto")
  .option("-c, --config <path>", "Percorso del file di configurazione", "./config.json")
  .action(async (options) => {
    try {
      
      const configPath = resolve(options.config);
      
      if (!(await fu.fileExists(configPath))) {
        console.error(i18n.t("cli.configNotFound", { path: configPath }));
        console.log(i18n.t("cli.configHint"));
        process.exit(1);
      }
      
      const configData = await fu.readJson<any>(configPath);
      const config = ConfigSchema.parse(configData);
      await i18n.initialize(config.languageDoc);

      console.log(i18n.t("cli.start"));
      console.log(i18n.t("cli.project", { name: config.projectName }));
      console.log(i18n.t("cli.path", { path: config.projectPath }));
      console.log(i18n.t("cli.output", { dir: config.outputDir }));
      console.log(i18n.t("cli.phase1"));

      const analyzer = new CodeAnalyzer();
      const projectAnalysis = await analyzer.analyzeProject(config);

      console.log(i18n.t("cli.analyzedFiles", { count: projectAnalysis.totalFiles, lines: projectAnalysis.totalLines }));
      console.log(i18n.t("cli.phase2"));

      const brain = new BrainService(config);
      const isHealthy = await brain.checkHealth();

      if(!isHealthy) {
        console.error(i18n.t("cli.brainError"));
        console.log(i18n.t("cli.brainHint"));
        process.exit(1);
      }

      if(config.llmProvider !== BrainTypeEnum.Ollama && !config.llmKey) {
        console.error(i18n.t("cli.apiKeyError"));
        process.exit(1);
      }
      

      const loggingProcessBatch = (current:number, total:number) => process.stdout.write(i18n.t("cli.progress", { current, total }));
      const llmAnalyses = await brain.analyzeBatch(projectAnalysis.files, loggingProcessBatch);

      console.log(i18n.t("cli.analysisComplete"));
      console.log(i18n.t("cli.phase3"));

      const projectSummary = await brain.generateProjectSummary(config.projectName, llmAnalyses, projectAnalysis.architecture);
      
      console.log(i18n.t("cli.summaryGenerated"));

      await fu.ensureDir(config.outputDir);
      if (config.generateHtml) {
        console.log(i18n.t("cli.phase4"));
        const htmlGenerator = new HtmlGenerator();
        const html = await htmlGenerator.generate(projectAnalysis, llmAnalyses, projectSummary);

        const htmlPath = join(config.outputDir, "handover-report.html");
        await fu.writeSingleFile(htmlPath, html);
        console.log(i18n.t("cli.htmlSaved", { path: htmlPath }));
      }

      if (config.generateMarkdown) {
        console.log(i18n.t("cli.phase5"));
        const mdGenerator = new MarkdownGenerator();

        const readme = mdGenerator.generateReadme(projectAnalysis, projectSummary);
        await fu.writeSingleFile(join(config.outputDir, "README.md"), readme);

        const architecture = mdGenerator.generateArchitecture(projectAnalysis, llmAnalyses);
        await fu.writeSingleFile(join(config.outputDir, "ARCHITECTURE.md"), architecture);

        const setup = mdGenerator.generateSetup(projectAnalysis);
        await fu.writeSingleFile(join(config.outputDir, "SETUP.md"), setup);

        const api = mdGenerator.generateApi(llmAnalyses);
        await fu.writeSingleFile(join(config.outputDir, "API.md"), api);

        console.log(i18n.t("cli.markdownSaved"));
      }

      console.log(i18n.t("cli.success"));
      console.log(i18n.t("cli.filesGenerated", { dir: config.outputDir }));

      if (config.generateHtml) console.log(i18n.t("cli.reportHtml"));
      
      
      if (config.generateMarkdown) {
        console.log(i18n.t("cli.readmeMd"));
        console.log(i18n.t("cli.architectureMd"));
        console.log(i18n.t("cli.setupMd"));
        console.log(i18n.t("cli.apiMd"));
      }

    } catch (error: any) {
      console.error(i18n.t("cli.genError", { message: error.message }));
      if (error.stack) {
        console.error(`\nStack trace: ${error.stack}`);
      }
    } finally {
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Crea un file di configurazione di esempio")
  .option("-o, --output <path>", "Percorso del file di configurazione", "./config.json")
  .action(async (options) => {
    try {
      const configPath = resolve(options.output);

      if (await fu.fileExists(configPath)) {
        console.error(i18n.t("cli.initFileExists", { path: configPath }));
        process.exit(1);
      }

      const exampleConfig = INIT_EXAMPLE_CONFIG;
      await fu.writeSingleFile(configPath, JSON.stringify(exampleConfig, null, 2));
      
      console.log(i18n.t("cli.initSuccess", { path: configPath }));
      console.log(i18n.t("cli.initNextSteps"));
      console.log(i18n.t("cli.initStep1"));
      console.log(i18n.t("cli.initStep2"));
    } catch (error: any) {
      console.error(i18n.t("cli.initError", { message: error.message }));
      process.exit(1);
    }
  });

program.parse();
