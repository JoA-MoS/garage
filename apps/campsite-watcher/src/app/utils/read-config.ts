import { readFile } from 'fs/promises';
import path from 'path';
import { stripComments } from 'jsonc-parser';
import { WatchOptions } from '../interfaces/watch-options.interface';

export async function getWatcherConfig(
  configPath = './assets/watcher-config.jsonc'
): Promise<WatchOptions[]> {
  const jsonString = stripComments(
    await readFile(path.join(__dirname, configPath), 'utf-8')
  );
  return JSON.parse(jsonString) as WatchOptions[];
}
