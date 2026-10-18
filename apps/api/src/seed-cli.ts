import { DB_FILE } from './config';
import { fileStore } from './file-store';
import { DEMO_CANDIDATE_EMAIL, DEMO_EMPLOYER_EMAIL, DEMO_PASSWORD, seed } from './seed';

seed(fileStore(DB_FILE));
console.log(`Reset ${DB_FILE} with demo data.`);
console.log(`Candidate: ${DEMO_CANDIDATE_EMAIL} / ${DEMO_PASSWORD}`);
console.log(`Employer:  ${DEMO_EMPLOYER_EMAIL} / ${DEMO_PASSWORD}`);
