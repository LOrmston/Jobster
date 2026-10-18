import { useEffect, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { CandidateFeedItem, CandidateProfile, EmployerProfile, Job, JobFeedItem, Match } from '@jobster/shared';
import { api } from '../api';
import { CandidateProfileView } from '../components/CandidateProfileView';
import { Deck } from '../components/Deck';
import { JobProfile } from '../components/JobProfile';
import { MatchCelebration } from '../components/MatchCelebration';
import { MatchInsights } from '../components/MatchInsights';
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

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <img src="/brand/lobster.png" alt="" className="empty-mark" />
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
        aside={(i) => <MatchInsights match={i.match} />}
        decide={(i, decision, extras) => api.swipe({ jobId: i.job.id, decision, ...extras })}
        onMatch={(i, r) => setCelebration({ match: r.match!, job: i.job, employer: i.employer, candidate: me })}
        empty={
          <Empty title="You’re all caught up">
            <p className="muted">New roles that fit your profile will appear here. Loosening a dealbreaker shows you more.</p>
            <div className="row center-row">
              <Link className="btn btn-primary" to="/likes">
                See who likes you
              </Link>
              <Link className="btn btn-ghost" to="/profile">
                Edit preferences
              </Link>
            </div>
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

  if (!jobs) return <p className="loading">Loading your roles…</p>;
  if (jobs.length === 0) {
    return (
      <Empty title="Post a role to start matching">
        <p className="muted">Tell us who you need. We’ll line up candidates who fit, best match first.</p>
        <Link className="btn btn-primary" to="/jobs/new">
          Post a role
        </Link>
      </Empty>
    );
  }

  return (
    <>
      <RoleFilter jobs={jobs} value={jobId!} onChange={(id) => setParams({ job: id })} label="Reviewing for" />
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
          render={(i, onLike) => <CandidateProfileView candidate={i.candidate} match={i.match} onLike={onLike} />}
          aside={(i) => <MatchInsights match={i.match} title={`Fit for ${i.job.title}`} />}
          decide={(i, decision, extras) => api.swipe({ jobId: i.job.id, candidateId: i.candidate.userId, decision, ...extras })}
          onMatch={(i, r) => setCelebration({ match: r.match!, job: i.job, employer: me, candidate: i.candidate })}
          empty={
            <Empty title="That’s everyone for this role">
              <p className="muted">You’ve seen every candidate who fits. Loosening a dealbreaker widens the pool.</p>
              <div className="row center-row">
                <Link className="btn btn-primary" to="/likes">
                  See who likes you
                </Link>
                <Link className="btn btn-ghost" to={`/jobs/${jobId}`}>
                  Edit role
                </Link>
              </div>
            </Empty>
          }
        />
      )}
      {celebration && <MatchCelebration {...celebration} viewer="employer" onClose={() => setCelebration(null)} />}
    </>
  );
}

/** Pill tabs for choosing one of an employer's roles; `null` means all roles. */
export function RoleFilter<V extends string | null>({
  jobs,
  value,
  onChange,
  label,
  allowAll,
}: {
  jobs: Pick<Job, 'id' | 'title'>[];
  value: V;
  onChange(id: V): void;
  label: string;
  allowAll?: boolean;
}) {
  if (jobs.length < 2 && !allowAll) return null;
  return (
    <div className="role-filter" role="tablist" aria-label={label}>
      <span className="role-filter-label">{label}</span>
      {allowAll && (
        <button type="button" role="tab" aria-selected={value === null} className={`pill${value === null ? ' pill-active' : ''}`} onClick={() => onChange(null as V)}>
          All roles
        </button>
      )}
      {jobs.map((job) => (
        <button
          key={job.id}
          type="button"
          role="tab"
          aria-selected={job.id === value}
          className={`pill${job.id === value ? ' pill-active' : ''}`}
          onClick={() => onChange(job.id as V)}
        >
          {job.title}
        </button>
      ))}
    </div>
  );
}
