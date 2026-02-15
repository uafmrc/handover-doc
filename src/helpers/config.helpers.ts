import { BrainTypeEnum } from "../models/brain.model";
import { IConfig } from "../models/config.model";

export const INIT_EXAMPLE_CONFIG:IConfig = {
    projectPath: "./your-project",
    outputDir: "./handover-docs",
    llmProvider: BrainTypeEnum.Ollama,
    llmBaseUrl: "http://localhost:11434",
    llmModel: "qwen2.5-coder:7b",
    llmKey: undefined,
    projectName: "My Project",
    exclude: [
        "node_modules/**",
        "dist/**",
        "build/**",
        "coverage/**",
        ".git/**",
        "*.test.ts",
        "*.spec.ts",
    ],
    include: ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"],
    generateHtml: true,
    generateMarkdown: true,
    languageDoc: "english",
    languages: ["typescript", "javascript"],
    analysisDepth: "detailed",
}