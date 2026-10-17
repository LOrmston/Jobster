import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const here = fileURLToPath(new URL('.', import.meta.url));

export const PORT = Number(process.env.PORT ?? 4000);
export const DB_FILE = process.env.JOBSTER_DB ?? resolve(here, '../data/db.json');
export const WEB_DIST = resolve(here, '../../web/dist');
