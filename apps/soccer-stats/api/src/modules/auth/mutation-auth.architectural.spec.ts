import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Architectural Test: Mutation Auth Enforcement (#285)
 *
 * Every GraphQL mutation must require authentication. ClerkAuthGuard is
 * applied at the resolver class level, and @Public() opts a handler out of
 * it — which is acceptable for read queries and subscriptions, but never
 * for mutations on a publicly deployed API.
 *
 * WHY THIS MATTERS:
 * - The API is exposed publicly (App Runner + CloudFront)
 * - A @Public() mutation lets anyone create, modify, or delete game data
 *   without a token
 *
 * This spec discovers every *.resolver.ts file under src/modules, loads its
 * exported classes, and asserts that no method decorated with @Mutation()
 * also carries @Public() metadata — the same metadata ClerkAuthGuard's
 * Reflector reads at runtime.
 */
describe('Mutation Auth Architecture', () => {
  // Set by @Mutation() via addResolverMetadata (see @nestjs/graphql
  // resolvers.utils). Value is Resolver.MUTATION = 'Mutation'.
  const RESOLVER_TYPE_METADATA = 'graphql:resolver_type';

  const modulesDir = path.join(__dirname, '..');

  function findResolverFiles(dir: string): string[] {
    const files: string[] = [];

    function walk(currentDir: string) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && /\.resolver\.ts$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }

    walk(dir);
    return files;
  }

  it('should not have any @Public() mutations', () => {
    const resolverFiles = findResolverFiles(modulesDir);
    expect(resolverFiles.length).toBeGreaterThan(0);

    const violations: { file: string; method: string; mutation: string }[] = [];
    let mutationsChecked = 0;

    for (const file of resolverFiles) {
      const moduleExports = require(file) as Record<string, unknown>;

      for (const exported of Object.values(moduleExports)) {
        if (typeof exported !== 'function' || !exported.prototype) {
          continue;
        }

        for (const methodName of Object.getOwnPropertyNames(
          exported.prototype,
        )) {
          if (methodName === 'constructor') {
            continue;
          }
          const handler = exported.prototype[methodName];
          if (typeof handler !== 'function') {
            continue;
          }

          const resolverType = Reflect.getMetadata(
            RESOLVER_TYPE_METADATA,
            handler,
          );
          if (resolverType !== 'Mutation') {
            continue;
          }
          mutationsChecked++;

          if (Reflect.getMetadata(IS_PUBLIC_KEY, handler) === true) {
            violations.push({
              file: path.relative(modulesDir, file),
              method: `${exported.name}.${methodName}`,
              mutation:
                Reflect.getMetadata('graphql:resolver_name', handler) ??
                methodName,
            });
          }
        }
      }
    }

    // Sanity check that metadata discovery actually found the app's mutations
    // (guards against silent breakage if @nestjs/graphql changes its keys).
    expect(mutationsChecked).toBeGreaterThan(10);

    if (violations.length > 0) {
      const message = [
        '',
        '❌ ARCHITECTURAL VIOLATION: @Public() mutations detected!',
        '',
        'The following mutations can be called without authentication:',
        '',
        ...violations.map(
          (v) => `  📁 ${v.file} → ${v.method} (${v.mutation})`,
        ),
        '',
        'WHY THIS BREAKS SECURITY:',
        '  - The API is deployed publicly; anyone can call these mutations',
        '  - @Public() bypasses the class-level ClerkAuthGuard',
        '',
        'HOW TO FIX:',
        '  1. Remove @Public() from the mutation handler',
        '  2. The class-level @UseGuards(ClerkAuthGuard) then enforces auth',
        '  3. Add @CurrentUser() if the handler needs the acting user',
        '',
        'See issue #285.',
        '',
      ].join('\n');

      throw new Error(message);
    }
  });
});
