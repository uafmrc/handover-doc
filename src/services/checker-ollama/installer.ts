import { exec, spawn, ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import { checkOllamaInstalled, isOllamaServerRunning, getInstallInstructions, getOllamaVersion, sleep } from './utils';
import { i18n } from '../i18n.service';
import { IConfig } from '../../models/config.model';

const execAsync = promisify(exec);

export class OllamaInstaller {
  private serverProcess: ChildProcess | null = null;
  private readonly config: IConfig;

  constructor(config: IConfig) {
    this.config = config;
  }

  async checkAndSetup(): Promise<void> {
    console.log(i18n.t('cli.ollama.checking'));
    
    const isInstalled = await checkOllamaInstalled();
    
    if (!isInstalled) {
      console.error(getInstallInstructions(this.config));
      throw new Error(i18n.t('cli.ollama.notInstalled'));
    }

    const version = await getOllamaVersion();
    console.log(i18n.t('cli.ollama.installed', { version }));
    
    const isRunning = await isOllamaServerRunning(this.config);
    
    if (isRunning) {
      console.log(i18n.t('cli.ollama.serverRunning'));
    } else {
      console.log(i18n.t('cli.ollama.startingServer'));
      await this.startServer();
    }
  }

  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('ollama', ['serve'], {
        detached: false,
        stdio: 'pipe'
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(i18n.t('cli.ollama.startError', { error: error.message })));
      });

      // Aspetta che il server sia pronto
      this.waitForServerReady()
        .then(() => {
          console.log(i18n.t('cli.ollama.serverStarted'));
          resolve();
        })
        .catch(reject);
    });
  }

  private async waitForServerReady(maxAttempts: number = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const isRunning = await isOllamaServerRunning(this.config);
      if (isRunning) {
        return;
      }
      await sleep(1000);
    }
    throw new Error(i18n.t('cli.ollama.serverTimeout'));
  }

  async ensureModelExists(modelName: string): Promise<void> {
    console.log(i18n.t('cli.ollama.checkingModel', { model: modelName }));
    
    try {
      const { stdout } = await execAsync('ollama list');
      
      if (stdout.includes(modelName)) {
        console.log(i18n.t('cli.ollama.modelAvailable', { model: modelName }));
        return;
      }

      console.log(i18n.t('cli.ollama.downloadingModel', { model: modelName }));
      console.log(i18n.t('cli.ollama.downloadWarning'));
      
      await execAsync(`ollama pull ${modelName}`);
      console.log(i18n.t('cli.ollama.modelDownloaded', { model: modelName }));
      
    } catch (error) {
      throw new Error(i18n.t('cli.ollama.downloadError', { error }));
    }
  }

  stopServer(): void {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
      console.log(i18n.t('cli.ollama.serverStopped'));
    }
  }
}