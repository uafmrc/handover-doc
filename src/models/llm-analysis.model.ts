interface IKeyFunctions {
  name: string;
  explanation: string;
  usage: string;
}

export interface ILLMAnalysis {
  filePath: string;
  summary: string;
  purpose: string;
  keyFunctions: IKeyFunctions[];
  improvements: string[];
  dependencies: string;
  complexity: "low" | "medium" | "high";
  qualityScore?: number;
}

export interface IDocumentationOutput {
  html?: string;
  markdown?: {
    readme: string;
    architecture: string;
    api?: string;
    setup?: string;
  };
}