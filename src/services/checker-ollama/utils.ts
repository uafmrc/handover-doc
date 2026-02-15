import { exec } from 'node:child_process';
import { arch, platform } from 'node:os';
import { promisify } from 'node:util';
import { SystemInfo } from '../../models/ollama.model';
import { IConfig } from '../../models/config.model';
import { i18n } from '../i18n.service';

const execAsync = promisify(exec);

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

export async function isOllamaServerRunning(config:IConfig): Promise<boolean> {
  try {
    const response = await fetch(`${config.llmBaseUrl}/api/tags`);
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

export function getInstallInstructions(config:IConfig): string {
  const current_platform = platform();
  const instructionKey = `cli.ollama.instructions.${current_platform}`;
  const fallbackKey = `cli.ollama.instructions.linux`;
  const instruction = i18n.t(instructionKey);
  if (instruction === instructionKey) {
    return i18n.t(fallbackKey);
  } else {
    return instruction;
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}