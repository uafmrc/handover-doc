import { z } from "zod";
import { BrainTypeEnum } from "./brain.model";

export const ConfigSchema = z.object({
  projectPath: z.string(),
  outputDir: z.string(),
  llmProvider: z.enum([ BrainTypeEnum.Anthropic, BrainTypeEnum.Ollama, BrainTypeEnum.OpenAI, BrainTypeEnum.Google]).optional().default(BrainTypeEnum.Ollama),
  llmKey: z.string().optional(),
  llmBaseUrl: z.string().optional().default("http://localhost:11434"),
  llmModel: z.string(),
  projectName: z.string(),
  exclude: z.array(z.string()).optional().default([]),
  include: z.array(z.string()).optional().default(["**/*.ts", "**/*.js"]),
  maxFileSize: z.number().optional(),
  generateHtml: z.boolean().optional().default(true),
  generateMarkdown: z.boolean().optional().default(true),
  languageDoc: z.string().optional().default("english"),
  languages: z
    .array(z.string())
    .optional()
    .default(["typescript", "javascript"]),
  analysisDepth: z
    .enum(["basic", "detailed", "comprehensive"])
    .optional()
    .default("detailed"),
});

export type IConfig = z.infer<typeof ConfigSchema>;
