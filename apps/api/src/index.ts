import { createApp } from './app';
import { DB_FILE, PORT, WEB_DIST } from './config';
import { DEMO_CANDIDATE_EMAIL, DEMO_EMPLOYER_EMAIL, DEMO_PASSWORD, seed } from './seed';
import { Store } from './store';

const store = new Store(DB_FILE);
if (store.isEmpty) {
  seed(store);
  console.log(`Seeded demo data. Sign in as ${DEMO_CANDIDATE_EMAIL} or ${DEMO_EMPLOYER_EMAIL} (password: ${DEMO_PASSWORD}).`);
}

const app = createApp(store, { staticDir: process.env.NODE_ENV === 'production' ? WEB_DIST : undefined });
app.listen(PORT, () => {
  console.log(`Jobster API listening on http://localhost:${PORT}`);
});
