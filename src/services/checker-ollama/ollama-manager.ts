import { Ollama } from 'ollama';
import { OllamaInstaller } from './installer';
import { i18n } from '../i18n.service';
import { OllamaConfig } from '../../models/ollama.model';
import { IConfig } from '../../models/config.model';

export class OllamaChecker {
  private readonly client: Ollama;
  private readonly installer: OllamaInstaller;
  private readonly model: string;
  private initialized: boolean = false;

  constructor(configProject:IConfig, config: OllamaConfig = {}) {
    this.model = config.model || 'llama2';
    this.client = new Ollama({ host: config.host || 'http://localhost:11434' });
    this.installer = new OllamaInstaller(configProject);
  }

  async initialize(config:IConfig): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.installer.checkAndSetup();
      await this.installer.ensureModelExists(this.model);
      this.initialized = true;
      console.log(i18n.t('cli.ollama.ready'));
    } catch (error) {
      throw new Error(i18n.t('cli.ollama.initFailed', { error }));
    }
  }

  async listAvailableModels(): Promise<string[]> {
    const response = await this.client.list();
    return response.models.map(m => m.name);
  }

  shutdown(): void {
    this.installer.stopServer();
  }
}