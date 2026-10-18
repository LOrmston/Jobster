import { DurableObject } from 'cloudflare:workers';
import { createApp } from './app';
import { seed } from './seed';
import { COLLECTIONS, Store, type DbShape } from './store';

interface Env {
  DB: DurableObjectNamespace<JobsterDatabase>;
  ASSETS: Fetcher;
  /** "true" fills an empty database with the demo world and its public demo logins. */
  SEED_DEMO_DATA?: string;
}

type Collection = (typeof COLLECTIONS)[number];

const primaryKey: Record<Collection, (record: never) => string> = {
  users: (r: { id: string }) => r.id,
  sessions: (r: { token: string }) => r.token,
  candidates: (r: { userId: string }) => r.userId,
  employers: (r: { userId: string }) => r.userId,
  jobs: (r: { id: string }) => r.id,
  swipes: (r: { id: string }) => r.id,
  matches: (r: { id: string }) => r.id,
  messages: (r: { id: string }) => r.id,
};

const rowKey = (collection: string, key: string) => `${collection}\u0000${key}`;

/**
 * One Durable Object holds the whole database, playing the part the single
 * Node process plays locally: requests run one at a time against the
 * in-memory Store, and each change is written through to the object's
 * SQLite storage. Every record is its own row (rows max out at 2 MB), and
 * only rows that changed are written.
 */
export class JobsterDatabase extends DurableObject<Env> {
  private app?: ReturnType<typeof createApp>;
  /** JSON of each row as last written, so saves can skip unchanged rows. */
  private written = new Map<string, string>();

  private load() {
    const sql = this.ctx.storage.sql;
    sql.exec(`CREATE TABLE IF NOT EXISTS records (
      collection TEXT NOT NULL,
      key TEXT NOT NULL,
      json TEXT NOT NULL,
      PRIMARY KEY (collection, key)
    )`);
    const initial: Partial<Record<Collection, unknown[]>> = {};
    // rowid order is insertion order, which keeps chats and feeds in sequence.
    for (const row of sql.exec<{ collection: Collection; key: string; json: string }>('SELECT collection, key, json FROM records ORDER BY rowid')) {
      (initial[row.collection] ??= []).push(JSON.parse(row.json));
      this.written.set(rowKey(row.collection, row.key), row.json);
    }
    const store = new Store(initial as Partial<DbShape>, (data) => this.persist(data));
    if (store.isEmpty && this.env.SEED_DEMO_DATA === 'true') seed(store);
    return createApp(store);
  }

  private persist(data: DbShape) {
    const sql = this.ctx.storage.sql;
    const seen = new Set<string>();
    for (const collection of COLLECTIONS) {
      for (const record of data[collection]) {
        const key = primaryKey[collection](record as never);
        const id = rowKey(collection, key);
        const json = JSON.stringify(record);
        seen.add(id);
        if (this.written.get(id) === json) continue;
        sql.exec(
          'INSERT INTO records (collection, key, json) VALUES (?, ?, ?) ON CONFLICT (collection, key) DO UPDATE SET json = excluded.json',
          collection,
          key,
          json,
        );
        this.written.set(id, json);
      }
    }
    for (const id of [...this.written.keys()]) {
      if (seen.has(id)) continue;
      const [collection, key] = id.split('\u0000');
      sql.exec('DELETE FROM records WHERE collection = ? AND key = ?', collection, key);
      this.written.delete(id);
    }
  }

  override fetch(request: Request): Response | Promise<Response> {
    this.app ??= this.load();
    return this.app.fetch(request);
  }
}

export default {
  fetch(request, env) {
    // wrangler.jsonc routes only /api/* here; everything else is a static asset.
    if (!new URL(request.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    return env.DB.get(env.DB.idFromName('jobster')).fetch(request);
  },
} satisfies ExportedHandler<Env>;
