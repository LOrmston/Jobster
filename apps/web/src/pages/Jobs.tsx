import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatSalary, JOB_TYPE_LABELS, WORK_MODE_LABELS, type Job, type JobInput } from '@jobster/shared';
import { api } from '../api';
import { JobForm } from '../forms/JobForm';
import { useEmployer } from '../session';
import { errorToast, toast } from '../toast';

const toInput = ({ id: _id, employerId: _e, createdAt: _c, ...rest }: Job): JobInput => rest;

export function Jobs() {
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    api.myJobs().then(setJobs, errorToast);
  }, []);

  const toggle = async (job: Job) => {
    try {
      const updated = await api.updateJob(job.id, { ...toInput(job), active: !job.active });
      setJobs((list) => list!.map((j) => (j.id === job.id ? updated : j)));
    } catch (err) {
      errorToast(err);
    }
  };

  if (!jobs) return <p className="loading">Loading jobs…</p>;

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Your jobs</h1>
        <Link to="/jobs/new" className="btn btn-primary btn-small">
          + Post a job
        </Link>
      </div>
      {jobs.length === 0 && <p className="muted">No jobs yet. Post one to start matching with candidates.</p>}
      <ul className="job-list">
        {jobs.map((job) => (
          <li key={job.id} className={`panel job-row${job.active ? '' : ' job-row-paused'}`}>
            <div>
              <strong>{job.title}</strong>
              <div className="muted small">
                {formatSalary(job.salaryMin, job.salaryMax)} · {WORK_MODE_LABELS[job.workMode]} · {JOB_TYPE_LABELS[job.jobType]} · {job.location}
              </div>
              <span className={`status ${job.active ? 'status-booked' : 'status-pending'}`}>{job.active ? 'Live' : 'Paused'}</span>
            </div>
            <div className="row">
              {job.active && (
                <Link to={`/?job=${job.id}`} className="btn btn-primary btn-small">
                  Find candidates
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
      toast(job ? 'Job updated' : 'Job posted — here are your best matches');
      navigate(job ? '/jobs' : `/?job=${saved.id}`);
    } catch (err) {
      errorToast(err);
    }
  };

  return (
    <div className="page">
      <Link to="/jobs" className="link">
        ‹ Your jobs
      </Link>
      <h1 className="page-title">{job ? 'Edit job' : 'Post a job'}</h1>
      <JobForm initial={job ?? undefined} defaults={employer} submitLabel={job ? 'Save changes' : 'Post job'} onSubmit={save} />
    </div>
  );
}
