import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/** Read a JSON fixture relative to the calling module's directory. */
export async function readJsonFixture<T>(moduleUrl: string, ...segments: string[]): Promise<T> {
  const dir = dirname(fileURLToPath(moduleUrl));
  const text = await readFile(join(dir, ...segments), 'utf8');
  return JSON.parse(text) as T;
}

export async function readTextFixture(moduleUrl: string, ...segments: string[]): Promise<string> {
  const dir = dirname(fileURLToPath(moduleUrl));
  return readFile(join(dir, ...segments), 'utf8');
}
