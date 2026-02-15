import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { glob } from "glob";
import { basename, dirname, extname, relative } from "node:path";
import { IConfig } from "../models/config.model";
import { LANGUAGE_MAP } from "../models/global.constants";

export namespace FileUtils {

  export const ensureDir = async (dirPath: string) => mkdir(dirPath, { recursive: true });

  export const getFileExtension = (filePath: string): string  => extname(filePath).toLowerCase();
  
  export const getLanguageFromExtension = (ext: string): string => LANGUAGE_MAP[ext] || "unknown";

  export const getRelativePath = (fullPath: string, basePath: string): string => relative(basePath, fullPath);

  export const countLines = (content: string): number => content.split("\n").length;

  export const readSingleFile = async (filePath:string) => readFile(filePath, "utf-8");  

  export const findFiles = async (projectPath: string, pattern: string): Promise<string[]> => glob(pattern, { 
    cwd: projectPath, 
    nodir: true, 
    absolute: true 
  });

  export const writeSingleFile = async (filePath:string, content:string) => {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, content, "utf-8");
  }

  export const getProjectFiles = async (config: IConfig): Promise<string[]> => {
    const patterns = config.include || ["**/*.ts", "**/*.js"];
    const allFiles: string[] = [];

    console.log(`\n🔍 Ricerca file nel progetto: ${config.projectPath}`);
    console.log(`   Pattern: ${patterns.join(", ")}`);

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          cwd: config.projectPath,
          ignore: config.exclude || [],
          absolute: true,
          nodir: true,
          dot: false,
          follow: false,
          maxDepth: Infinity,
        });

        console.log(`   Trovati ${files.length} file con pattern "${pattern}"`);
        allFiles.push(...files);
      } catch (error) {
        console.error(`   Errore con pattern "${pattern}":`, error);
      }
    }

    const uniqueFiles = [...new Set(allFiles)];
    console.log(`   Totale file unici: ${uniqueFiles.length}`);

    // Filtra per dimensione con logging
    let skippedCount = 0;
    const filteredFiles = await Promise.all(
      uniqueFiles.map(async (file) => {
        try {
          const stats = await stat(file);
          if (config.maxFileSize && stats.size > config.maxFileSize) {
            skippedCount++;
            if (skippedCount <= 5) {
              console.log(
                `   ⚠️  File troppo grande (${stats.size} bytes): ${basename(file)}`,
              );
            }
            return null;
          }
          return file;
        } catch (error) {
          console.error(`   ❌ Errore leggendo file: ${file}`, error);
          return null;
        }
      }),
    );

    const validFiles = filteredFiles.filter((f): f is string => f !== null);

    if (skippedCount > 5) console.log(`   ... e altri ${skippedCount - 5} file troppo grandi`);
    console.log(`   ✅ File validi da analizzare: ${validFiles.length}\n`);

    // Mostra alcuni esempi di path per debug
    if (validFiles.length > 0) {
      console.log("   Esempi di file trovati:");
      validFiles.slice(0, 5).forEach((f) => console.log(`   - ${getRelativePath(f, config.projectPath)}`));
      if (validFiles.length > 5)
        console.log(`   ... e altri ${validFiles.length - 5} file\n`);
    }

    return validFiles;
  }


  export const fileExists = async (filePath: string): Promise<boolean> => {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  export const readJson = async <T>(filePath: string): Promise<T> => {
    const content = await readSingleFile(filePath);
    return JSON.parse(content) as T;
  }

  export const directoryExists = async (dirPath: string): Promise<boolean> => {
    try {
      const stats = await stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  export const readDirectory = async (dirPath: string): Promise<string[]> => {
    try {
      // We need to import readdir from fs/promises
      const { readdir } = require('fs/promises');
      return await readdir(dirPath);
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      return [];
    }
  }

}