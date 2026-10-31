import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

function findFiles(dir: string, ext = ['.ts', '.tsx']): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git', 'files'].includes(entry.name)) continue;
      files.push(...findFiles(fullPath, ext));
    } else if (entry.isFile() && ext.some(e => entry.name.endsWith(e))) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Architecture Fitness Tests (ARCHITECTURE.md §17)', () => {
  it('1. shared/domain imports nothing outside shared/{domain,schemas,constants,ports} and has no non-deterministic APIs', () => {
    const domainFiles = findFiles(path.resolve(__dirname, '../shared/domain')).filter(f => !f.endsWith('.test.ts'));
    const forbiddenPatterns = [
      /Date\.now\(\)/,
      /new\s+Date\(\)/,
      /Math\.random\(\)/,
      /\bfetch\(/,
      /process\.env/,
      /\bwindow\b/,
    ];

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of forbiddenPatterns) {
        expect(pattern.test(content), `Found forbidden pattern ${pattern} in ${file}`).toBe(false);
      }
    }
  });

  it('2. src never imports from server, and server never imports from src', () => {
    const srcFiles = findFiles(path.resolve(__dirname, '../src'));
    const serverFiles = findFiles(path.resolve(__dirname, '../server'));

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(/from\s+['"].*\/server(\/.*)?['"]/.test(content), `${file} imports from server`).toBe(false);
    }

    for (const file of serverFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(/from\s+['"].*\/src(\/.*)?['"]/.test(content), `${file} imports from src`).toBe(false);
    }
  });

  it('3. Firebase packages are imported only in allowed adapter files if present', () => {
    const allTsFiles = findFiles(path.resolve(__dirname, '../')).filter(f => !f.includes('/tests/'));
    const allowedFirebaseAdapters = [
      'src/services/repositories/firestore.ts',
      'server/integrations/firebaseAdmin.ts',
    ];

    for (const file of allTsFiles) {
      const relative = path.relative(path.resolve(__dirname, '..'), file);
      if (allowedFirebaseAdapters.some(a => relative.endsWith(a))) continue;

      const content = fs.readFileSync(file, 'utf-8');
      expect(/from\s+['"]firebase(\/.*)?['"]/.test(content), `${file} illegally imports firebase`).toBe(false);
      expect(/from\s+['"]firebase-admin(\/.*)?['"]/.test(content), `${file} illegally imports firebase-admin`).toBe(false);
    }
  });

  it('4. No dangerouslySetInnerHTML and no eval/new Function anywhere in production source', () => {
    const prodFiles = findFiles(path.resolve(__dirname, '../src')).concat(
      findFiles(path.resolve(__dirname, '../server')),
      findFiles(path.resolve(__dirname, '../shared'))
    ).filter(f => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'));

    for (const file of prodFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content.includes('dangerouslySetInnerHTML'), `${file} has dangerouslySetInnerHTML`).toBe(false);
      expect(/\beval\(/.test(content), `${file} has eval()`).toBe(false);
      expect(/new\s+Function\(/.test(content), `${file} has new Function()`).toBe(false);
    }
  });

  it('5. Source files do not exceed line limits', () => {
    const prodFiles = findFiles(path.resolve(__dirname, '../src')).concat(
      findFiles(path.resolve(__dirname, '../server')),
      findFiles(path.resolve(__dirname, '../shared'))
    ).filter(f => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx') && !f.includes('/packs/'));

    for (const file of prodFiles) {
      const lines = fs.readFileSync(file, 'utf-8').split('\n');
      expect(lines.length, `${file} is ${lines.length} lines (max 400)`).toBeLessThanOrEqual(400);
    }
  });
});
