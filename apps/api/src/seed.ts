import type { CandidateProfile, EmployerProfile, Job, Role } from '@jobster/shared';
import { hashPassword } from './auth';
import { recordSwipe, sendMessage } from './service';
import { Store, type StoredUser } from './store';

export const DEMO_PASSWORD = 'password123';
export const DEMO_CANDIDATE_EMAIL = 'candidate@jobster.dev';
export const DEMO_EMPLOYER_EMAIL = 'employer@jobster.dev';

type CandidateSeed = Omit<CandidateProfile, 'userId'> & { email: string };
type EmployerSeed = Omit<EmployerProfile, 'userId'> & {
  email: string;
  jobs: Omit<Job, 'id' | 'employerId' | 'createdAt' | 'active' | 'dealbreakers'>[];
};

const noDealbreakers = { workMode: false, salary: false, jobType: false };

const candidates: CandidateSeed[] = [
  {
    email: DEMO_CANDIDATE_EMAIL,
    name: 'Priya Shah',
    headline: 'Frontend engineer who sweats the details',
    location: 'London, UK',
    avatarColor: '#6c3ce0',
    yearsExperience: 6,
    seniority: 'senior',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'Accessibility', 'Design systems'],
    industries: ['Fintech', 'Healthtech'],
    workModes: ['remote', 'hybrid'],
    jobTypes: ['full_time'],
    salaryMin: 70000,
    willingToRelocate: false,
    rightToWork: true,
    experience: [
      { title: 'Senior Frontend Engineer', company: 'Monzo', years: 3 },
      { title: 'Frontend Developer', company: 'Deliveroo', years: 3 },
    ],
    prompts: [
      { question: 'My proudest work achievement is…', answer: 'Rebuilding a checkout that cut drop-off by 18% — and made it fully screen-reader friendly.' },
      { question: 'I do my best work when…', answer: 'I’m close to designers and can ship small, often, and measure what happens.' },
    ],
    dealbreakers: { workMode: true, salary: false, jobType: false },
  },
  {
    email: 'tom@example.com',
    name: 'Tom Okafor',
    headline: 'Backend engineer, payments and distributed systems',
    location: 'Manchester, UK',
    avatarColor: '#e0543c',
    yearsExperience: 8,
    seniority: 'senior',
    skills: ['Go', 'PostgreSQL', 'Kubernetes', 'AWS', 'Kafka', 'TypeScript'],
    industries: ['Fintech'],
    workModes: ['remote'],
    jobTypes: ['full_time', 'contract'],
    salaryMin: 85000,
    willingToRelocate: false,
    rightToWork: true,
    experience: [
      { title: 'Staff Engineer', company: 'Starling Bank', years: 4 },
      { title: 'Software Engineer', company: 'Sky', years: 4 },
    ],
    prompts: [
      { question: 'A problem I love solving…', answer: 'Making money move exactly once, even when the network has other ideas.' },
      { question: 'My ideal team…', answer: 'Writes things down, reviews kindly and is on call for its own code.' },
    ],
    dealbreakers: noDealbreakers,
  },
  {
    email: 'sofia@example.com',
    name: 'Sofia Marin',
    headline: 'Product designer turning messy problems into calm interfaces',
    location: 'London, UK',
    avatarColor: '#2c9c74',
    yearsExperience: 5,
    seniority: 'mid',
    skills: ['Figma', 'UX design', 'Prototyping', 'User research', 'Design systems', 'Accessibility'],
    industries: ['Fintech', 'Retail'],
    workModes: ['hybrid', 'onsite'],
    jobTypes: ['full_time'],
    salaryMin: 60000,
    willingToRelocate: false,
    rightToWork: true,
    experience: [{ title: 'Product Designer', company: 'Wise', years: 5 }],
    prompts: [
      { question: 'You should hire me because…', answer: 'I bring research to every decision and still ship pixels on Friday.' },
      { question: 'The way to win me over is…', answer: 'Show me the support tickets. I’ll find the design problem in them.' },
    ],
    dealbreakers: noDealbreakers,
  },
  {
    email: 'james@example.com',
    name: 'James Whitfield',
    headline: 'Data analyst who likes a tidy SQL query',
    location: 'Bristol, UK',
    avatarColor: '#d18a00',
    yearsExperience: 3,
    seniority: 'mid',
    skills: ['SQL', 'Python', 'dbt', 'Looker', 'Statistics'],
    industries: ['Retail', 'Fintech'],
    workModes: ['remote', 'hybrid'],
    jobTypes: ['full_time'],
    salaryMin: 45000,
    willingToRelocate: true,
    rightToWork: true,
    experience: [{ title: 'Data Analyst', company: 'Ovo Energy', years: 3 }],
    prompts: [
      { question: 'A skill I’m currently learning…', answer: 'Causal inference — so we can stop arguing about whether the feature worked.' },
    ],
    dealbreakers: noDealbreakers,
  },
  {
    email: 'aisha@example.com',
    name: 'Aisha Rahman',
    headline: 'Junior full-stack developer, bootcamp grad, fast learner',
    location: 'Birmingham, UK',
    avatarColor: '#c2387a',
    yearsExperience: 1,
    seniority: 'junior',
    skills: ['JavaScript', 'React', 'Node.js', 'CSS', 'Git'],
    industries: ['Edtech'],
    workModes: ['remote', 'hybrid', 'onsite'],
    jobTypes: ['full_time', 'internship'],
    salaryMin: 30000,
    willingToRelocate: true,
    rightToWork: true,
    experience: [{ title: 'Junior Developer', company: 'Freelance', years: 1 }],
    prompts: [
      { question: 'I do my best work when…', answer: 'I can pair with someone more experienced and ask the “obvious” questions.' },
      { question: 'You should hire me because…', answer: 'I built and shipped four real apps in my first year, including one for my mum’s bakery.' },
    ],
    dealbreakers: noDealbreakers,
  },
  {
    email: 'liam@example.com',
    name: 'Liam Doyle',
    headline: 'Engineering manager growing happy, high-output teams',
    location: 'London, UK',
    avatarColor: '#2a6fdb',
    yearsExperience: 12,
    seniority: 'lead',
    skills: ['Leadership', 'Hiring', 'TypeScript', 'React', 'Agile', 'Node.js'],
    industries: ['Fintech', 'Media'],
    workModes: ['hybrid'],
    jobTypes: ['full_time'],
    salaryMin: 110000,
    willingToRelocate: false,
    rightToWork: true,
    experience: [
      { title: 'Engineering Manager', company: 'BBC', years: 5 },
      { title: 'Tech Lead', company: 'Ocado', years: 7 },
    ],
    prompts: [{ question: 'My ideal team…', answer: 'Ships weekly, laughs daily and never has to ask permission to fix things.' }],
    dealbreakers: { workMode: false, salary: true, jobType: false },
  },
  {
    email: 'mei@example.com',
    name: 'Mei Chen',
    headline: 'ML engineer putting models into production',
    location: 'Cambridge, UK',
    avatarColor: '#7a4fd6',
    yearsExperience: 4,
    seniority: 'mid',
    skills: ['Python', 'PyTorch', 'Machine learning', 'AWS', 'SQL', 'Docker'],
    industries: ['Healthtech', 'AI'],
    workModes: ['remote', 'hybrid'],
    jobTypes: ['full_time', 'contract'],
    salaryMin: 75000,
    willingToRelocate: false,
    rightToWork: false,
    experience: [{ title: 'Machine Learning Engineer', company: 'Babylon Health', years: 4 }],
    prompts: [{ question: 'A problem I love solving…', answer: 'Getting a model from a notebook to 1,000 requests a second without anyone noticing.' }],
    dealbreakers: noDealbreakers,
  },
  {
    email: 'oliver@example.com',
    name: 'Oliver Grant',
    headline: 'Frontend developer with an eye for motion',
    location: 'Leeds, UK',
    avatarColor: '#0f8b8d',
    yearsExperience: 4,
    seniority: 'mid',
    skills: ['React', 'TypeScript', 'CSS', 'Animation', 'Next.js'],
    industries: ['Media', 'Retail'],
    workModes: ['remote', 'hybrid'],
    jobTypes: ['full_time', 'contract'],
    salaryMin: 55000,
    willingToRelocate: true,
    rightToWork: true,
    experience: [{ title: 'Frontend Developer', company: 'Sky Betting & Gaming', years: 4 }],
    prompts: [{ question: 'My proudest work achievement is…', answer: 'A World Cup live-score page that stayed up while 3 million people refreshed it.' }],
    dealbreakers: noDealbreakers,
  },
];

const employers: EmployerSeed[] = [
  {
    email: DEMO_EMPLOYER_EMAIL,
    companyName: 'Brightwave',
    tagline: 'Banking for small businesses that actually helps',
    about: 'We build the money tools small businesses wish their bank had: invoicing, cashflow forecasts and instant payments. 120 people, Series B, London-first.',
    industry: 'Fintech',
    size: '51-200',
    location: 'London, UK',
    logoEmoji: '🌊',
    jobs: [
      {
        title: 'Senior Frontend Engineer',
        summary: 'Own the web app 40,000 small businesses use to get paid. You’ll lead our design-system work and pair closely with product and design.',
        location: 'London',
        workMode: 'hybrid',
        jobType: 'full_time',
        salaryMin: 75000,
        salaryMax: 95000,
        seniority: 'senior',
        minYears: 5,
        requiredSkills: ['React', 'TypeScript', 'Accessibility'],
        niceToHaveSkills: ['GraphQL', 'Design systems'],
        industry: 'Fintech',
        perks: ['2 days in office', '£2k learning budget', '30 days holiday'],
        prompts: [
          { question: 'In your first 90 days you’ll…', answer: 'Ship our new invoice editor and help us choose the next big frontend bet.' },
          { question: 'The team you’d join…', answer: 'Six engineers, one designer, zero ego. We demo every Friday.' },
        ],
      },
      {
        title: 'Product Designer',
        summary: 'Design the moments that matter for small business owners — getting paid, chasing invoices, seeing what’s coming. Research-led, shipping-focused.',
        location: 'London',
        workMode: 'hybrid',
        jobType: 'full_time',
        salaryMin: 60000,
        salaryMax: 75000,
        seniority: 'mid',
        minYears: 3,
        requiredSkills: ['Figma', 'UX design', 'Prototyping'],
        niceToHaveSkills: ['User research', 'Design systems'],
        industry: 'Fintech',
        perks: ['Hybrid', 'Latest kit', 'Share options'],
        prompts: [{ question: 'You’ll love it here if…', answer: 'You’d rather talk to five customers than argue about button colours.' }],
      },
      {
        title: 'Data Analyst',
        summary: 'Turn payment data into decisions. You’ll own our core metrics, build dashboards people actually open and answer the CEO’s Friday questions.',
        location: 'London',
        workMode: 'remote',
        jobType: 'full_time',
        salaryMin: 45000,
        salaryMax: 58000,
        seniority: 'mid',
        minYears: 2,
        requiredSkills: ['SQL', 'Python'],
        niceToHaveSkills: ['dbt', 'Looker'],
        industry: 'Fintech',
        perks: ['Remote-first', 'Quarterly offsites'],
        prompts: [{ question: 'A typical day looks like…', answer: 'Morning stand-up, a deep-dive with product, and one question that changes the roadmap.' }],
      },
    ],
  },
  {
    email: 'hiring@northstarhealth.example',
    companyName: 'Northstar Health',
    tagline: 'GP appointments in minutes, not weeks',
    about: 'An NHS partner building digital front doors for GP surgeries. Mission-driven, 300 people across the UK.',
    industry: 'Healthtech',
    size: '201-1000',
    location: 'Manchester, UK',
    logoEmoji: '⭐',
    jobs: [
      {
        title: 'Frontend Engineer',
        summary: 'Help patients book care without picking up the phone. Accessible React at NHS scale, with real users from day one.',
        location: 'Manchester',
        workMode: 'remote',
        jobType: 'full_time',
        salaryMin: 65000,
        salaryMax: 80000,
        seniority: 'senior',
        minYears: 4,
        requiredSkills: ['React', 'TypeScript', 'Accessibility'],
        niceToHaveSkills: ['Node.js'],
        industry: 'Healthtech',
        perks: ['Remote', 'Private healthcare', '9-day fortnight'],
        prompts: [{ question: 'Why people stay…', answer: 'Every release, a surgery somewhere gets a quieter Monday morning.' }],
      },
      {
        title: 'Machine Learning Engineer',
        summary: 'Build triage models that route patients to the right care. Production ML with clinicians in the loop.',
        location: 'Manchester',
        workMode: 'hybrid',
        jobType: 'full_time',
        salaryMin: 75000,
        salaryMax: 95000,
        seniority: 'mid',
        minYears: 3,
        requiredSkills: ['Python', 'Machine learning', 'SQL'],
        niceToHaveSkills: ['PyTorch', 'AWS'],
        industry: 'Healthtech',
        perks: ['Visa sponsorship', 'Conference budget'],
        prompts: [],
      },
    ],
  },
  {
    email: 'talent@ledgerly.example',
    companyName: 'Ledgerly',
    tagline: 'Payments infrastructure for European marketplaces',
    about: 'We move billions for marketplaces across Europe. Small, senior engineering team; big, interesting problems.',
    industry: 'Fintech',
    size: '11-50',
    location: 'London, UK',
    logoEmoji: '📒',
    jobs: [
      {
        title: 'Senior Backend Engineer (Go)',
        summary: 'Design the ledger at the heart of our payments platform. Exactly-once, auditable and very fast.',
        location: 'London',
        workMode: 'remote',
        jobType: 'full_time',
        salaryMin: 90000,
        salaryMax: 120000,
        seniority: 'senior',
        minYears: 6,
        requiredSkills: ['Go', 'PostgreSQL', 'Kafka'],
        niceToHaveSkills: ['Kubernetes', 'AWS'],
        industry: 'Fintech',
        perks: ['Fully remote', 'Equity', 'Home-office budget'],
        prompts: [{ question: 'We’re looking for someone who…', answer: 'Gets a little excited about double-entry bookkeeping.' }],
      },
      {
        title: 'Full-stack Engineer',
        summary: 'Build the dashboard our marketplace customers live in. TypeScript end to end, small team, lots of ownership.',
        location: 'London',
        workMode: 'hybrid',
        jobType: 'full_time',
        salaryMin: 70000,
        salaryMax: 88000,
        seniority: 'mid',
        minYears: 3,
        requiredSkills: ['TypeScript', 'React', 'Node.js'],
        niceToHaveSkills: ['PostgreSQL', 'GraphQL'],
        industry: 'Fintech',
        perks: ['Equity', 'Hybrid'],
        prompts: [],
      },
    ],
  },
  {
    email: 'jobs@pixelpost.example',
    companyName: 'Pixel & Post',
    tagline: 'The design studio behind your favourite brands',
    about: 'An independent digital studio in Leeds making websites and apps for brands like Yorkshire Tea and Leeds United.',
    industry: 'Media',
    size: '11-50',
    location: 'Leeds, UK',
    logoEmoji: '🎨',
    jobs: [
      {
        title: 'Creative Frontend Developer',
        summary: 'Bring award-winning designs to life with motion, WebGL and buttery-smooth React.',
        location: 'Leeds',
        workMode: 'onsite',
        jobType: 'full_time',
        salaryMin: 45000,
        salaryMax: 60000,
        seniority: 'mid',
        minYears: 2,
        requiredSkills: ['React', 'CSS', 'Animation'],
        niceToHaveSkills: ['Next.js', 'TypeScript'],
        industry: 'Media',
        perks: ['Dog-friendly studio', 'Free lunch Fridays'],
        prompts: [{ question: 'The team you’d join…', answer: 'Eight designers, five developers and one very good studio dog called Biscuit.' }],
      },
      {
        title: 'Junior Web Developer',
        summary: 'Learn from a senior team while shipping real client work from your first month. Mentoring built in.',
        location: 'Leeds',
        workMode: 'hybrid',
        jobType: 'full_time',
        salaryMin: 28000,
        salaryMax: 34000,
        seniority: 'junior',
        minYears: 0,
        requiredSkills: ['JavaScript', 'CSS'],
        niceToHaveSkills: ['React', 'Git'],
        industry: 'Media',
        perks: ['Mentoring', 'Relocation support'],
        prompts: [],
      },
    ],
  },
  {
    email: 'people@greengrocer.example',
    companyName: 'Greengrocer',
    tagline: 'Fresh food delivered in 20 minutes',
    about: 'Quick-commerce for fresh, local produce across five UK cities. Data-driven and growing fast.',
    industry: 'Retail',
    size: '201-1000',
    location: 'Bristol, UK',
    logoEmoji: '🥕',
    jobs: [
      {
        title: 'Analytics Engineer',
        summary: 'Own the data models that tell us what to stock, where and when. Modern stack, real impact on waste.',
        location: 'Bristol',
        workMode: 'hybrid',
        jobType: 'full_time',
        salaryMin: 50000,
        salaryMax: 65000,
        seniority: 'mid',
        minYears: 2,
        requiredSkills: ['SQL', 'dbt'],
        niceToHaveSkills: ['Python', 'Looker'],
        industry: 'Retail',
        perks: ['Free weekly veg box', 'Hybrid', 'Cycle to work'],
        prompts: [{ question: 'Why people stay…', answer: 'We cut food waste by 30% last year, and analytics led the way.' }],
      },
      {
        title: 'Engineering Manager',
        summary: 'Lead two squads building our rider and picker apps. Grow people, sharpen delivery, keep things kind.',
        location: 'Bristol',
        workMode: 'hybrid',
        jobType: 'full_time',
        salaryMin: 95000,
        salaryMax: 115000,
        seniority: 'lead',
        minYears: 8,
        requiredSkills: ['Leadership', 'Hiring', 'Agile'],
        niceToHaveSkills: ['TypeScript', 'React'],
        industry: 'Retail',
        perks: ['Relocation package', 'Bonus'],
        prompts: [],
      },
    ],
  },
];

function addUser(store: Store, email: string, role: Role, passwordHash: string): StoredUser {
  const user: StoredUser = {
    id: Store.id(),
    email,
    role,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  store.data.users.push(user);
  return user;
}

/** Fill the store with a believable starter world, including likes waiting for both demo accounts. */
export function seed(store: Store): void {
  store.reset();
  const byEmail = new Map<string, StoredUser>();
  // Every demo account shares a password, so hash it once: hashing is
  // deliberately slow, and Workers bill for CPU time.
  const passwordHash = hashPassword(DEMO_PASSWORD);

  for (const { email, ...profile } of candidates) {
    const user = addUser(store, email, 'candidate', passwordHash);
    byEmail.set(email, user);
    store.data.candidates.push({ ...profile, userId: user.id });
  }

  const jobsByTitle = new Map<string, Job>();
  for (const { email, jobs, ...profile } of employers) {
    const user = addUser(store, email, 'employer', passwordHash);
    byEmail.set(email, user);
    store.data.employers.push({ ...profile, userId: user.id });
    for (const job of jobs) {
      const created: Job = {
        ...job,
        id: Store.id(),
        employerId: user.id,
        active: true,
        dealbreakers: { experience: false, rightToWork: job.title.includes('Backend'), skills: false },
        createdAt: new Date().toISOString(),
      };
      store.data.jobs.push(created);
      jobsByTitle.set(`${profile.companyName}:${job.title}`, created);
    }
  }

  const user = (email: string) => byEmail.get(email)!;
  const job = (key: string) => jobsByTitle.get(key)!;
  const candidateLikes = (email: string, jobKey: string, extra: { standout?: boolean; likedSection?: string; note?: string } = {}) =>
    recordSwipe(store, user(email), { jobId: job(jobKey).id, decision: 'like', standout: false, ...extra });
  const employerLikes = (
    employerEmail: string,
    jobKey: string,
    candidateEmail: string,
    extra: { standout?: boolean; likedSection?: string; note?: string } = {},
  ) =>
    recordSwipe(store, user(employerEmail), {
      jobId: job(jobKey).id,
      candidateId: user(candidateEmail).id,
      decision: 'like',
      standout: false,
      ...extra,
    });

  // Employers who already like the demo candidate.
  employerLikes('hiring@northstarhealth.example', 'Northstar Health:Frontend Engineer', DEMO_CANDIDATE_EMAIL, {
    standout: true,
    likedSection: 'My proudest work achievement is…',
    note: 'Accessible checkout work is exactly what our patients need. Fancy a chat?',
  });
  employerLikes('talent@ledgerly.example', 'Ledgerly:Full-stack Engineer', DEMO_CANDIDATE_EMAIL);

  // Candidates who already like the demo employer's jobs.
  candidateLikes('sofia@example.com', 'Brightwave:Product Designer', {
    standout: true,
    likedSection: 'You’ll love it here if…',
    note: 'Five customers over button colours, every time. I’d love to hear more!',
  });
  candidateLikes('james@example.com', 'Brightwave:Data Analyst');
  candidateLikes('oliver@example.com', 'Brightwave:Senior Frontend Engineer', {
    likedSection: 'The team you’d join…',
    note: 'Friday demos are my love language.',
  });

  // An existing match with a conversation for each demo account.
  candidateLikes(DEMO_CANDIDATE_EMAIL, 'Brightwave:Senior Frontend Engineer', {
    likedSection: 'In your first 90 days you’ll…',
    note: 'An invoice editor with a proper design system behind it? Count me in.',
  });
  const { match } = employerLikes(DEMO_EMPLOYER_EMAIL, 'Brightwave:Senior Frontend Engineer', DEMO_CANDIDATE_EMAIL);
  if (match) {
    sendMessage(store, user(DEMO_EMPLOYER_EMAIL), match.id, 'Hi Priya! Loved your checkout story. Are you free for a 30-minute video call next week?');
  }

  store.save();
}
