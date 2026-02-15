#!/usr/bin/env ts-node

import { glob } from 'glob';
import { join, relative, resolve, sep } from 'node:path';
import { i18n } from './src/services/i18n.service';
import { FileUtils as fu } from './src/utils/file.utils';

async function debugPathDetection() {
  await i18n.initialize('en');
  const projectPath = process.argv[2] || './example-project';
  
  console.log(i18n.t('debug.title'));
  console.log(i18n.t('debug.project', { path: resolve(projectPath) }));

  // Test 1: Glob pattern base
  console.log(i18n.t('debug.test1'));
  try {
    const files1 = await glob('**/*.ts', {
      cwd: projectPath,
      absolute: true,
      nodir: true,
      dot: false
    });
    console.log(i18n.t('debug.foundTs', { count: files1.length }));
    files1.slice(0, 10).forEach(f => console.log(`   - ${relative(projectPath, f)}`));
  } catch (error: any) {
    console.error(i18n.t('debug.error', { message: error.message }));
  }

  console.log(i18n.t('debug.test2'));

  try {
    const files2 = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: projectPath,
      absolute: true,
      nodir: true,
      dot: false,
      maxDepth: Infinity,
      ignore: ['node_modules/**', 'dist/**', 'build/**']
    });
    console.log(i18n.t('debug.foundJs', { count: files2.length }));
    
    // Raggruppa per profondità
    const byDepth: Record<number, number> = {};
    files2.forEach(f => {
      const rel = relative(projectPath, f);
      const depth = rel.split(sep).length;
      byDepth[depth] = (byDepth[depth] || 0) + 1;
    });
    
    console.log(i18n.t('debug.depthStats'));
    Object.entries(byDepth).sort((a, b) => Number.parseInt(a[0]) - Number.parseInt(b[0])).forEach(([depth, count]) => {
      console.log(i18n.t('debug.depthLevel', { depth, count }));
    });

    // Mostra i file più profondi
    const deepFiles = files2
      .map(f => ({
        path: f,
        rel: relative(projectPath, f),
        depth: relative(projectPath, f).split(sep).length
      }))
      .sort((a, b) => b.depth - a.depth)
      .slice(0, 5);

    console.log(i18n.t('debug.deepFiles'));
    deepFiles.forEach(f => {
      console.log(`   [${f.depth}] ${f.rel}`);
    });
    
  } catch (error: any) {
    console.error(i18n.t('debug.error', { message: error.message }));
  }

  // Test 3: Verifica file specifico
  if (process.argv[3]) {
    const testFile = process.argv[3];
    console.log(i18n.t('debug.test3', { file: testFile }));
    
    const fullPath = join(projectPath, testFile);
    const exists = await fu.fileExists(fullPath);
    console.log(i18n.t('debug.exists', { status: exists ? i18n.t('debug.yes') : i18n.t('debug.no') }));
    
    if (exists) {
      try {
        const content = await fu.readSingleFile(fullPath);
        console.log(i18n.t('debug.size', { count: content.length }));
        console.log(i18n.t('debug.lines', { count: fu.countLines(content) }));
      } catch (error: any) {
        console.error(i18n.t('debug.readError', { message: error.message }));
      }
    }
  }

  console.log(i18n.t('debug.complete'));
}

await debugPathDetection();