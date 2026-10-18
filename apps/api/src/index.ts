import { relative } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createApp } from './app';
import { DB_FILE, PORT, WEB_DIST } from './config';
import { fileStore } from './file-store';
import { DEMO_CANDIDATE_EMAIL, DEMO_EMPLOYER_EMAIL, DEMO_PASSWORD, seed } from './seed';

const store = fileStore(DB_FILE);
if (store.isEmpty) {
  seed(store);
  console.log(`Seeded demo data. Sign in as ${DEMO_CANDIDATE_EMAIL} or ${DEMO_EMPLOYER_EMAIL} (password: ${DEMO_PASSWORD}).`);
}

const app = createApp(store);

// In production the API also serves the built web app, falling back to
// index.html so client-side routes like /matches/123 survive a refresh.
if (process.env.NODE_ENV === 'production') {
  const root = relative(process.cwd(), WEB_DIST);
  app.use('*', serveStatic({ root }));
  app.get('*', serveStatic({ path: `${root}/index.html` }));
}

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Jobster API listening on http://localhost:${PORT}`);
});
