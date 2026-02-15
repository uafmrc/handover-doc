import { Ollama, Message } from 'ollama';
import { OllamaInstaller } from './installer';

export interface OllamaConfig {
  model?: string;
  host?: string;
  autoInstall?: boolean;
}

export class OllamaChecker {
  private readonly client: Ollama;
  private readonly installer: OllamaInstaller;
  private model: string;
  private conversationHistory: Message[] = [];
  private initialized: boolean = false;

  constructor(config: OllamaConfig = {}) {
    this.model = config.model || 'llama2';
    this.client = new Ollama({ host: config.host || 'http://localhost:11434' });
    this.installer = new OllamaInstaller();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.installer.checkAndSetup();
      await this.installer.ensureModelExists(this.model);
      this.initialized = true;
      console.log('✅ Tutto pronto!\n');
    } catch (error) {
      throw new Error(`Inizializzazione fallita: ${error}`);
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  async listAvailableModels(): Promise<string[]> {
    const response = await this.client.list();
    return response.models.map(m => m.name);
  }

  changeModel(modelName: string): void {
    this.model = modelName;
    this.clearHistory();
  }

  shutdown(): void {
    this.installer.stopServer();
  }
}