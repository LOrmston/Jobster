import { useState } from 'react';
import {
  JOB_PROMPTS,
  JOB_TYPE_LABELS,
  JOB_TYPES,
  jobSchema,
  SENIORITY_LABELS,
  SENIORITY_LEVELS,
  WORK_MODE_LABELS,
  WORK_MODES,
  type Job,
  type JobInput,
} from '@jobster/shared';
import { ChipInput, Field, FormSection, numberValue, PromptsEditor, Toggle, zodErrors, type Errors } from '../components/form';

const blank = (location: string, industry: string): JobInput => ({
  title: '',
  summary: '',
  location,
  workMode: 'hybrid',
  jobType: 'full_time',
  salaryMin: 40000,
  salaryMax: 55000,
  seniority: 'mid',
  minYears: 2,
  requiredSkills: [],
  niceToHaveSkills: [],
  industry,
  perks: [],
  prompts: [{ question: JOB_PROMPTS[0]!, answer: '' }],
  dealbreakers: { experience: false, rightToWork: false, skills: false },
  active: true,
});

interface Props {
  initial?: Job;
  defaults: { location: string; industry: string };
  submitLabel: string;
  onSubmit(job: JobInput): Promise<void>;
}

export function JobForm({ initial, defaults, submitLabel, onSubmit }: Props) {
  const [form, setForm] = useState<JobInput>(() => {
    if (!initial) return blank(defaults.location.split(',')[0]!, defaults.industry);
    const { id: _id, employerId: _e, createdAt: _c, ...rest } = initial;
    return rest;
  });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof JobInput>(key: K, value: JobInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = jobSchema.safeParse({ ...form, prompts: form.prompts.filter((p) => p.answer.trim()) });
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await onSubmit(parsed.data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <FormSection title="The role">
        <Field label="Job title" error={errors.title}>
          <input value={form.title} maxLength={100} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Summary" error={errors.summary} hint={`Keep it succinct — two or three sentences. ${400 - form.summary.length} characters left.`}>
          <textarea rows={3} maxLength={400} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
        </Field>
        <div className="row">
          <Field label="Location" error={errors.location}>
            <input value={form.location} onChange={(e) => set('location', e.target.value)} />
          </Field>
          <Field label="Working">
            <select value={form.workMode} onChange={(e) => set('workMode', e.target.value as JobInput['workMode'])}>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {WORK_MODE_LABELS[m]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="row">
          <Field label="Contract">
            <select value={form.jobType} onChange={(e) => set('jobType', e.target.value as JobInput['jobType'])}>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {JOB_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Industry" error={errors.industry}>
            <input value={form.industry} onChange={(e) => set('industry', e.target.value)} />
          </Field>
        </div>
        <div className="row">
          <Field label="Salary from (£)" error={errors.salaryMin}>
            <input type="number" min={0} step={1000} value={form.salaryMin} onChange={(e) => set('salaryMin', numberValue(e.target.value))} />
          </Field>
          <Field label="Salary to (£)" error={errors.salaryMax}>
            <input type="number" min={0} step={1000} value={form.salaryMax} onChange={(e) => set('salaryMax', numberValue(e.target.value))} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Who you’re looking for">
        <div className="row">
          <Field label="Level">
            <select value={form.seniority} onChange={(e) => set('seniority', e.target.value as JobInput['seniority'])}>
              {SENIORITY_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {SENIORITY_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Minimum years" error={errors.minYears}>
            <input type="number" min={0} max={40} value={form.minYears} onChange={(e) => set('minYears', numberValue(e.target.value))} />
          </Field>
        </div>
        <Field label="Required skills" error={errors.requiredSkills} hint="The biggest factor in who you’re shown. Press Enter after each.">
          <ChipInput value={form.requiredSkills} onChange={(v) => set('requiredSkills', v)} placeholder="e.g. Python" />
        </Field>
        <Field label="Nice-to-have skills">
          <ChipInput value={form.niceToHaveSkills} onChange={(v) => set('niceToHaveSkills', v)} placeholder="e.g. dbt" />
        </Field>
        <Field label="Perks">
          <ChipInput value={form.perks} onChange={(v) => set('perks', v)} placeholder="e.g. 4-day week" />
        </Field>
      </FormSection>

      <FormSection title="Dealbreakers">
        <p className="muted small">Candidates who fail a dealbreaker are never shown. Everyone else is ranked by match score.</p>
        <Toggle
          label="Must meet the minimum years"
          checked={form.dealbreakers.experience}
          onChange={(v) => set('dealbreakers', { ...form.dealbreakers, experience: v })}
        />
        <Toggle
          label="Must have at least half the required skills"
          checked={form.dealbreakers.skills}
          onChange={(v) => set('dealbreakers', { ...form.dealbreakers, skills: v })}
        />
        <Toggle
          label="Must already have the right to work"
          hint="Turn off if you can sponsor visas"
          checked={form.dealbreakers.rightToWork}
          onChange={(v) => set('dealbreakers', { ...form.dealbreakers, rightToWork: v })}
        />
      </FormSection>

      <FormSection title="Prompts">
        <p className="muted small">Give candidates a feel for the job beyond the bullet points.</p>
        <PromptsEditor value={form.prompts} onChange={(v) => set('prompts', v)} questions={JOB_PROMPTS} />
      </FormSection>

      <Toggle label="Live — show this job to candidates" checked={form.active} onChange={(v) => set('active', v)} />

      {Object.keys(errors).length > 0 && <p className="error">Please fix the highlighted fields.</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
