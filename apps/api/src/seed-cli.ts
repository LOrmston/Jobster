import { DB_FILE } from './config';
import { DEMO_CANDIDATE_EMAIL, DEMO_EMPLOYER_EMAIL, DEMO_PASSWORD, seed } from './seed';
import { Store } from './store';

const store = new Store(DB_FILE);
seed(store);
console.log(`Reset ${DB_FILE} with demo data.`);
console.log(`Candidate: ${DEMO_CANDIDATE_EMAIL} / ${DEMO_PASSWORD}`);
console.log(`Employer:  ${DEMO_EMPLOYER_EMAIL} / ${DEMO_PASSWORD}`);
