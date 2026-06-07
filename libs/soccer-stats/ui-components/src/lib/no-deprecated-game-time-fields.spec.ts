import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const sourceRoot = __dirname;
const deprecatedTimeFieldPattern = /\b(?:gameMinute|gameSecond)\b/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      return sourceFiles(path);
    }

    return /\.(?:ts|tsx)$/.test(entry) && !entry.endsWith('.spec.ts')
      ? [path]
      : [];
  });
}

describe('period-relative game event timing fields', () => {
  it('does not use deprecated gameMinute/gameSecond field names in UI components', () => {
    const matches = sourceFiles(sourceRoot)
      .map((path) => ({
        path,
        content: readFileSync(path, 'utf8'),
      }))
      .filter(({ content }) => deprecatedTimeFieldPattern.test(content))
      .map(({ path }) => relative(sourceRoot, path));

    expect(matches).toEqual([]);
  });
});
