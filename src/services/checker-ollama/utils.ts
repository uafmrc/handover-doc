import { exec } from 'node:child_process';
import { arch, platform } from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface SystemInfo {
  platform: NodeJS.Platform;
  arch: string;
  isOllamaInstalled: boolean;
  ollamaVersion?: string;
}

export async function checkOllamaInstalled(): Promise<boolean> {
  try {
    await execAsync('ollama --version');
    return true;
  } catch {
    return false;
  }
}

export async function getOllamaVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('ollama --version');
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function isOllamaServerRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    return response.ok;
  } catch {
    return false;
  }
}

export function getSystemInfo(): Pick<SystemInfo, 'platform' | 'arch'> {
  return {
    platform: platform(),
    arch: arch()
  };
}

export function getInstallInstructions(): string {
  const current_platform = platform();
  
  const instructions: Record<string, string> = {
    darwin: `
╔════════════════════════════════════════════════════════════╗
║  Ollama non è installato sul tuo sistema                   ║
╚════════════════════════════════════════════════════════════╝

Per installare Ollama su macOS:

1. Vai su: https://ollama.ai/download
2. Scarica l'installer per macOS
3. Oppure usa Homebrew:
   brew install ollama

4. Dopo l'installazione, avvia Ollama:
   ollama serve

Riprova dopo l'installazione.
    `,
    linux: `
╔════════════════════════════════════════════════════════════╗
║  Ollama non è installato sul tuo sistema                   ║
╚════════════════════════════════════════════════════════════╝

Per installare Ollama su Linux:

curl -fsSL https://ollama.ai/install.sh | sh

Dopo l'installazione, avvia Ollama:
ollama serve

Riprova dopo l'installazione.
    `,
    win32: `
╔════════════════════════════════════════════════════════════╗
║  Ollama non è installato sul tuo sistema                   ║
╚════════════════════════════════════════════════════════════╝

Per installare Ollama su Windows:

1. Vai su: https://ollama.ai/download
2. Scarica l'installer per Windows
3. Esegui il file .exe e segui le istruzioni

4. Dopo l'installazione, Ollama si avvierà automaticamente

Riprova dopo l'installazione.
    `
  };

  return instructions[current_platform] || instructions.linux;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}