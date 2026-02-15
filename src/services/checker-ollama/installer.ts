import { exec, spawn, ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import { 
  checkOllamaInstalled, 
  isOllamaServerRunning, 
  getInstallInstructions,
  getOllamaVersion,
  sleep
} from './utils';

const execAsync = promisify(exec);

export class OllamaInstaller {
  private serverProcess: ChildProcess | null = null;

  async checkAndSetup(): Promise<void> {
    console.log('🔍 Controllo installazione Ollama...');
    
    const isInstalled = await checkOllamaInstalled();
    
    if (!isInstalled) {
      console.error(getInstallInstructions());
      throw new Error('Ollama non è installato. Segui le istruzioni sopra.');
    }

    const version = await getOllamaVersion();
    console.log(`✅ Ollama installato: ${version}`);
    
    // Controlla se il server è già in esecuzione
    const isRunning = await isOllamaServerRunning();
    
    if (!isRunning) {
      console.log('🚀 Avvio del server Ollama...');
      await this.startServer();
    } else {
      console.log('✅ Server Ollama già in esecuzione');
    }
  }

  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('ollama', ['serve'], {
        detached: false,
        stdio: 'pipe'
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Impossibile avviare il server Ollama: ${error.message}`));
      });

      // Aspetta che il server sia pronto
      this.waitForServerReady()
        .then(() => {
          console.log('✅ Server Ollama avviato con successo');
          resolve();
        })
        .catch(reject);
    });
  }

  private async waitForServerReady(maxAttempts: number = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const isRunning = await isOllamaServerRunning();
      if (isRunning) {
        return;
      }
      await sleep(1000);
    }
    throw new Error('Timeout: il server Ollama non si è avviato in tempo');
  }

  async ensureModelExists(modelName: string): Promise<void> {
    console.log(`🔍 Controllo se il modello "${modelName}" è disponibile...`);
    
    try {
      const { stdout } = await execAsync('ollama list');
      
      if (stdout.includes(modelName)) {
        console.log(`✅ Modello "${modelName}" già disponibile`);
        return;
      }

      console.log(`📥 Download del modello "${modelName}" in corso...`);
      console.log('⚠️  Questo potrebbe richiedere diversi minuti...');
      
      await execAsync(`ollama pull ${modelName}`);
      console.log(`✅ Modello "${modelName}" scaricato con successo`);
      
    } catch (error) {
      throw new Error(`Errore durante il download del modello: ${error}`);
    }
  }

  stopServer(): void {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
      console.log('🛑 Server Ollama fermato');
    }
  }
}