import { IFileAnalysis } from "../../models/file-analysis.model";

export abstract class BaseParser {
  abstract parse(filePath: string, content: string): Promise<Partial<IFileAnalysis>>;

  protected extractBasicInfo(content: string) {
    const lines = content.split("\n");
    const hasComments = /(\/\*[\s\S]*?\*\/|\/\/.*$)/m.test(content);

    return {
      linesCount: lines.length,
      hasComments
    };
  }

  protected normalizeWhitespace(text: string): string {
    return text.replaceAll(/\s+/g, " ").trim();
  }
}
