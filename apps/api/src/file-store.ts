import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Store, type DbShape } from './store';

/** A Store kept in a JSON file, for local development and single-server hosting. */
export function fileStore(file: string): Store {
  const initial = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Partial<DbShape>) : {};
  return new Store(initial, (data) => {
    mkdirSync(dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify(data, null, 2));
    renameSync(tmp, file);
  });
}
