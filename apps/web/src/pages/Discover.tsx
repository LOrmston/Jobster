import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { CandidateFeedItem, CandidateProfile, EmployerProfile, Job, JobFeedItem, Match } from '@jobster/shared';
import { api } from '../api';
import { CandidateProfileView } from '../components/CandidateProfileView';
import { Deck } from '../components/Deck';
import { JobProfile } from '../components/JobProfile';
import { MatchCelebration } from '../components/MatchCelebration';
import { useCandidate, useEmployer, useSession } from '../session';
import { errorToast } from '../toast';

interface Celebration {
  match: Match;
  job: Job;
  employer: EmployerProfile;
  candidate: CandidateProfile;
}

export function Discover() {
  const { user } = useSession();
  return user!.role === 'candidate' ? <CandidateDiscover /> : <EmployerDiscover />;
}

function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-emoji" aria-hidden>
        🌱
      </div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function CandidateDiscover() {
  const me = useCandidate();
  const [items, setItems] = useState<JobFeedItem[] | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  useEffect(() => {
    api.jobFeed().then(setItems, errorToast);
  }, []);

  if (!items) return <p className="loading">Finding roles for you…</p>;

  return (
    <>
      <Deck
        items={items}
        keyOf={(i) => i.job.id}
        recipientName={(i) => i.employer.companyName}
        likeLabel="INTERESTED"
        passLabel="NOPE"
        render={(i, onLike) => <JobProfile job={i.job} employer={i.employer} match={i.match} onLike={onLike} />}
        decide={(i, decision, extras) => api.swipe({ jobId: i.job.id, decision, ...extras })}
        onMatch={(i, r) => setCelebration({ match: r.match!, job: i.job, employer: i.employer, candidate: me })}
        empty={
          <Empty title="You’re all caught up">
            <p className="muted">New roles that fit your profile will appear here. Check who’s already keen in Likes you.</p>
            <Link className="btn btn-primary" to="/likes">
              See who likes you
            </Link>
          </Empty>
        }
      />
      {celebration && <MatchCelebration {...celebration} viewer="candidate" onClose={() => setCelebration(null)} />}
    </>
  );
}

function EmployerDiscover() {
  const me = useEmployer();
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [items, setItems] = useState<CandidateFeedItem[] | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  useEffect(() => {
    api.myJobs().then((all) => setJobs(all.filter((j) => j.active)), errorToast);
  }, []);

  const jobId = params.get('job') ?? jobs?.[0]?.id;

  useEffect(() => {
    if (!jobId) return;
    setItems(null);
    api.candidateFeed(jobId).then(setItems, errorToast);
  }, [jobId]);

  if (!jobs) return <p className="loading">Loading your jobs…</p>;
  if (jobs.length === 0) {
    return (
      <Empty title="Post a job to start matching">
        <p className="muted">Tell us who you need. We’ll line up candidates who fit, ranked by match.</p>
        <Link className="btn btn-primary" to="/jobs/new">
          Post a job
        </Link>
      </Empty>
    );
  }

  return (
    <>
      <div className="job-switcher" role="tablist" aria-label="Hiring for">
        {jobs.map((job) => (
          <button
            key={job.id}
            type="button"
            role="tab"
            aria-selected={job.id === jobId}
            className={`pill${job.id === jobId ? ' pill-active' : ''}`}
            onClick={() => setParams({ job: job.id })}
          >
            {job.title}
          </button>
        ))}
      </div>
      {!items ? (
        <p className="loading">Finding candidates…</p>
      ) : (
        <Deck
          key={jobId}
          items={items}
          keyOf={(i) => i.candidate.userId}
          recipientName={(i) => i.candidate.name.split(' ')[0]!}
          likeLabel="SHORTLIST"
          passLabel="NOT NOW"
          render={(i, onLike) => <CandidateProfileView candidate={i.candidate} match={i.match} jobTitle={i.job.title} onLike={onLike} />}
          decide={(i, decision, extras) => api.swipe({ jobId: i.job.id, candidateId: i.candidate.userId, decision, ...extras })}
          onMatch={(i, r) => setCelebration({ match: r.match!, job: i.job, employer: me, candidate: i.candidate })}
          empty={
            <Empty title="That’s everyone for now">
              <p className="muted">You’ve seen every candidate who fits this role. Try loosening a dealbreaker, or check Likes you.</p>
              <Link className="btn btn-primary" to="/likes">
                See who likes you
              </Link>
            </Empty>
          }
        />
      )}
      {celebration && <MatchCelebration {...celebration} viewer="employer" onClose={() => setCelebration(null)} />}
    </>
  );
}
