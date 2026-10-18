import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatSalary, JOB_TYPE_LABELS, WORK_MODE_LABELS, type Job, type JobInput, type JobPipeline } from '@jobster/shared';
import { api } from '../api';
import { JobForm } from '../forms/JobForm';
import { useEmployer } from '../session';
import { errorToast, toast } from '../toast';

const toInput = ({ id: _id, employerId: _e, createdAt: _c, ...rest }: Job): JobInput => rest;

/** An employer's roles, each with its hiring pipeline at a glance. */
export function Jobs() {
  const [pipeline, setPipeline] = useState<JobPipeline[] | null>(null);
  const load = () => api.pipeline().then(setPipeline, errorToast);

  useEffect(() => {
    void load();
  }, []);

  const toggle = async (job: Job) => {
    try {
      await api.updateJob(job.id, { ...toInput(job), active: !job.active });
      toast(job.active ? `${job.title} paused` : `${job.title} is live`);
      void load();
    } catch (err) {
      errorToast(err);
    }
  };

  if (!pipeline) return <p className="loading">Loading roles…</p>;

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div>
          <h1 className="page-title">Your roles</h1>
          <p className="muted">How hiring is going for each role.</p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary">
          Post a role
        </Link>
      </header>
      {pipeline.length === 0 && <p className="muted">No roles yet. Post one to start matching with candidates.</p>}
      <ul className="role-list">
        {pipeline.map(({ job, toReview, likedYou, matches, interviews }) => (
          <li key={job.id} className={`panel role-card${job.active ? '' : ' role-card-paused'}`}>
            <div className="role-card-head">
              <div>
                <h2 className="role-title">{job.title}</h2>
                <p className="muted small">
                  {formatSalary(job.salaryMin, job.salaryMax)} · {WORK_MODE_LABELS[job.workMode]} · {JOB_TYPE_LABELS[job.jobType]} · {job.location}
                </p>
              </div>
              <span className={`status ${job.active ? 'status-booked' : 'status-pending'}`}>{job.active ? 'Live' : 'Paused'}</span>
            </div>
            <dl className="pipeline">
              <Link to={`/?job=${job.id}`} className="stage">
                <dt>To review</dt>
                <dd>{toReview}</dd>
              </Link>
              <Link to={`/likes?role=${job.id}`} className="stage">
                <dt>Liked you</dt>
                <dd>{likedYou}</dd>
              </Link>
              <Link to={`/matches?role=${job.id}`} className="stage">
                <dt>Matches</dt>
                <dd>{matches}</dd>
              </Link>
              <Link to={`/matches?role=${job.id}`} className="stage">
                <dt>Interviews</dt>
                <dd>{interviews}</dd>
              </Link>
            </dl>
            <div className="row">
              {job.active && toReview > 0 && (
                <Link to={`/?job=${job.id}`} className="btn btn-primary btn-small">
                  Review {toReview} candidate{toReview === 1 ? '' : 's'}
                </Link>
              )}
              <Link to={`/jobs/${job.id}`} className="btn btn-ghost btn-small">
                Edit
              </Link>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => toggle(job)}>
                {job.active ? 'Pause' : 'Go live'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JobEditor() {
  const { id } = useParams<{ id: string }>();
  const employer = useEmployer();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null | undefined>(id ? undefined : null);

  useEffect(() => {
    if (!id) return;
    api.myJobs().then((jobs) => setJob(jobs.find((j) => j.id === id) ?? null), errorToast);
  }, [id]);

  if (job === undefined) return <p className="loading">Loading job…</p>;
  if (id && job === null) return <p className="loading">Job not found.</p>;

  const save = async (input: JobInput) => {
    try {
      const saved = job ? await api.updateJob(job.id, input) : await api.createJob(input);
      toast(job ? 'Role updated' : 'Role posted. Here are your best matches');
      navigate(job ? '/jobs' : `/?job=${saved.id}`);
    } catch (err) {
      errorToast(err);
    }
  };

  return (
    <div className="page">
      <Link to="/jobs" className="link">
        ‹ Your roles
      </Link>
      <h1 className="page-title">{job ? 'Edit role' : 'Post a role'}</h1>
      <JobForm initial={job ?? undefined} defaults={employer} submitLabel={job ? 'Save changes' : 'Post role'} onSubmit={save} />
    </div>
  );
}
