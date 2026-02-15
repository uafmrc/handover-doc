export interface OllamaConfig {
  model?: string;
  host?: string;
  autoInstall?: boolean;
}

export interface SystemInfo {
  platform: NodeJS.Platform;
  arch: string;
  isOllamaInstalled: boolean;
  ollamaVersion?: string;
}

export const DEFAULT_OLLAMA_MODEL:string = 'qwen2.5-coder:7b';
export const DEFAULT_OLLAMA_HOST:string = 'http://localhost:11434';
