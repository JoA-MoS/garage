import { WatchOptions } from '@garage/campsite-watcher-core';
import { readFile } from 'fs/promises';
import { stripComments } from 'jsonc-parser';
import { join } from 'path';

export async function getWatcherConfig(
  configPath = './assets/watcher-config.jsonc'
): Promise<WatchOptions[]> {
  const jsonString = stripComments(
    await readFile(join(__dirname, configPath), 'utf-8')
  );
  return JSON.parse(jsonString) as WatchOptions[];
}
