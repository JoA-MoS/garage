import * as fs from 'fs';
import * as path from 'path';

/**
 * Architectural Test: PubSub Singleton Enforcement
 *
 * This test ensures that only the PubSubModule creates a PubSub instance.
 * If any other module creates its own PubSub instance, GraphQL subscriptions
 * will NOT work across multiple browser windows/tabs because each module
 * would have its own isolated event bus.
 *
 * WHY THIS MATTERS:
 * - Window A subscribes to gameEventChanged via GameEventsResolver
 * - Window B records a goal, which publishes to PubSub
 * - If they're using DIFFERENT PubSub instances, Window A never receives the event
 *
 * THE FIX:
 * - PubSubModule is marked @Global() and provides a SINGLE PubSub instance
 * - All other modules inject 'PUB_SUB' instead of creating their own
 */
describe('PubSub Singleton Architecture', () => {
  const modulesDir = path.join(__dirname, '..');
  const pubSubModulePath = path.join(__dirname, 'pubsub.module.ts');

  function findFilesRecursively(dir: string, pattern: RegExp): string[] {
    const files: string[] = [];

    function walk(currentDir: string) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }

    walk(dir);
    return files;
  }

  it('should only have "new PubSub()" in PubSubModule', () => {
    const moduleFiles = findFilesRecursively(modulesDir, /\.module\.ts$/);

    const violations: { file: string; line: number; content: string }[] = [];

    for (const file of moduleFiles) {
      // Skip the PubSubModule itself - it's allowed to create the instance
      if (path.resolve(file) === path.resolve(pubSubModulePath)) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.includes('new PubSub(')) {
          violations.push({
            file: path.relative(modulesDir, file),
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    }

    if (violations.length > 0) {
      const message = [
        '',
        '❌ ARCHITECTURAL VIOLATION: Multiple PubSub instances detected!',
        '',
        'The following modules are creating their own PubSub instances:',
        '',
        ...violations.map((v) => `  📁 ${v.file}:${v.line}`),
        '',
        'WHY THIS BREAKS SUBSCRIPTIONS:',
        '  - Each PubSub instance is an isolated in-memory event bus',
        '  - Events published to one instance are NOT received by subscribers on another',
        "  - This means updates in one browser tab won't appear in other tabs",
        '',
        'HOW TO FIX:',
        '  1. Remove the local PubSub provider from the module',
        '  2. The @Global() PubSubModule automatically provides PUB_SUB to all modules',
        '  3. Just inject PUB_SUB in your service/resolver constructor:',
        "     @Inject('PUB_SUB') private pubSub: PubSub",
        '',
      ].join('\n');

      fail(message);
    }
  });

  it('should have PubSubModule marked as @Global()', () => {
    const content = fs.readFileSync(pubSubModulePath, 'utf-8');

    expect(content).toContain('@Global()');
    expect(content).toContain("provide: 'PUB_SUB'");
  });

  it('should export PUB_SUB from PubSubModule', () => {
    const content = fs.readFileSync(pubSubModulePath, 'utf-8');

    expect(content).toContain("exports: ['PUB_SUB']");
  });

  it('should not import PubSub from graphql-subscriptions in other modules', () => {
    const moduleFiles = findFilesRecursively(modulesDir, /\.module\.ts$/);

    const violations: string[] = [];

    for (const file of moduleFiles) {
      // Skip the PubSubModule itself
      if (path.resolve(file) === path.resolve(pubSubModulePath)) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');

      // Check for import of PubSub (indicates potential local instantiation)
      if (
        content.includes("from 'graphql-subscriptions'") &&
        content.includes('PubSub')
      ) {
        violations.push(path.relative(modulesDir, file));
      }
    }

    if (violations.length > 0) {
      const message = [
        '',
        '⚠️  WARNING: Modules importing PubSub directly:',
        '',
        ...violations.map((v) => `  📁 ${v}`),
        '',
        'These modules should NOT import PubSub from graphql-subscriptions.',
        "Instead, inject the shared instance via @Inject('PUB_SUB').",
        '',
      ].join('\n');

      fail(message);
    }
  });
});
