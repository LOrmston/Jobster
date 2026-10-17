import { useState } from 'react';
import {
  CANDIDATE_PROMPTS,
  candidateProfileSchema,
  JOB_TYPE_LABELS,
  JOB_TYPES,
  SENIORITY_LABELS,
  SENIORITY_LEVELS,
  WORK_MODE_LABELS,
  WORK_MODES,
  type CandidateProfile,
  type CandidateProfileInput,
} from '@jobster/shared';
import { ChipInput, Field, FormSection, numberValue, PillGroup, PromptsEditor, Toggle, zodErrors, type Errors } from '../components/form';

const COLOURS = ['#6c3ce0', '#e0543c', '#2c9c74', '#d18a00', '#c2387a', '#2a6fdb', '#0f8b8d', '#1c1a27'];

const blank: CandidateProfileInput = {
  name: '',
  headline: '',
  location: '',
  avatarColor: COLOURS[0]!,
  yearsExperience: 0,
  seniority: 'mid',
  skills: [],
  industries: [],
  workModes: ['remote', 'hybrid'],
  jobTypes: ['full_time'],
  salaryMin: 30000,
  willingToRelocate: false,
  rightToWork: true,
  experience: [],
  prompts: [{ question: CANDIDATE_PROMPTS[0]!, answer: '' }],
  dealbreakers: { workMode: false, salary: false, jobType: false },
};

interface Props {
  initial?: CandidateProfile;
  submitLabel: string;
  onSubmit(profile: CandidateProfileInput): Promise<void>;
}

export function CandidateForm({ initial, submitLabel, onSubmit }: Props) {
  const [form, setForm] = useState<CandidateProfileInput>(() => {
    if (!initial) return blank;
    const { userId: _, ...rest } = initial;
    return rest;
  });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof CandidateProfileInput>(key: K, value: CandidateProfileInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = candidateProfileSchema.safeParse({ ...form, prompts: form.prompts.filter((p) => p.answer.trim()) });
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
      <FormSection title="About you">
        <Field label="Full name" error={errors.name}>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Headline" error={errors.headline} hint="One line that sums up what you do">
          <input value={form.headline} maxLength={120} placeholder="e.g. Backend engineer who loves payments" onChange={(e) => set('headline', e.target.value)} />
        </Field>
        <Field label="Location" error={errors.location}>
          <input value={form.location} placeholder="e.g. London, UK" onChange={(e) => set('location', e.target.value)} />
        </Field>
        <div className="field">
          <span className="field-label">Profile colour</span>
          <div className="swatches">
            {COLOURS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch${form.avatarColor === c ? ' swatch-active' : ''}`}
                style={{ background: c }}
                aria-label={`Colour ${c}`}
                aria-pressed={form.avatarColor === c}
                onClick={() => set('avatarColor', c)}
              />
            ))}
          </div>
        </div>
      </FormSection>

      <FormSection title="Experience">
        <div className="row">
          <Field label="Years of experience" error={errors.yearsExperience}>
            <input type="number" min={0} max={60} value={form.yearsExperience} onChange={(e) => set('yearsExperience', numberValue(e.target.value))} />
          </Field>
          <Field label="Level">
            <select value={form.seniority} onChange={(e) => set('seniority', e.target.value as CandidateProfileInput['seniority'])}>
              {SENIORITY_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {SENIORITY_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Skills" error={errors.skills} hint="Press Enter after each one. These drive your matches.">
          <ChipInput value={form.skills} onChange={(v) => set('skills', v)} placeholder="e.g. React, SQL, Figma" />
        </Field>
        <Field label="Industries you’ve worked in" hint="Optional">
          <ChipInput value={form.industries} onChange={(v) => set('industries', v)} placeholder="e.g. Fintech" />
        </Field>
        <div className="field">
          <span className="field-label">Recent roles</span>
          {form.experience.map((item, i) => (
            <div key={i} className="row experience-row">
              <input
                placeholder="Title"
                value={item.title}
                onChange={(e) => set('experience', form.experience.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
              />
              <input
                placeholder="Company"
                value={item.company}
                onChange={(e) => set('experience', form.experience.map((x, j) => (j === i ? { ...x, company: e.target.value } : x)))}
              />
              <input
                type="number"
                min={0}
                aria-label="Years"
                className="narrow"
                value={item.years}
                onChange={(e) => set('experience', form.experience.map((x, j) => (j === i ? { ...x, years: numberValue(e.target.value) } : x)))}
              />
              <button type="button" className="link danger" aria-label="Remove role" onClick={() => set('experience', form.experience.filter((_, j) => j !== i))}>
                ×
              </button>
            </div>
          ))}
          {errors.experience && <span className="error">Fill in a title and company for each role</span>}
          {form.experience.length < 10 && (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => set('experience', [...form.experience, { title: '', company: '', years: 1 }])}>
              + Add a role
            </button>
          )}
        </div>
      </FormSection>

      <FormSection title="What you’re looking for">
        <Field label="Ways of working" error={errors.workModes}>
          <PillGroup options={WORK_MODES} labels={WORK_MODE_LABELS} value={form.workModes} onChange={(v) => set('workModes', v)} />
        </Field>
        <Field label="Contract types" error={errors.jobTypes}>
          <PillGroup options={JOB_TYPES} labels={JOB_TYPE_LABELS} value={form.jobTypes} onChange={(v) => set('jobTypes', v)} />
        </Field>
        <Field label="Minimum salary (£ per year)" error={errors.salaryMin}>
          <input type="number" min={0} step={1000} value={form.salaryMin} onChange={(e) => set('salaryMin', numberValue(e.target.value))} />
        </Field>
        <Toggle label="I’m open to relocating" checked={form.willingToRelocate} onChange={(v) => set('willingToRelocate', v)} />
        <Toggle label="I have the right to work in the UK" checked={form.rightToWork} onChange={(v) => set('rightToWork', v)} />
      </FormSection>

      <FormSection title="Dealbreakers">
        <p className="muted small">Roles that fail a dealbreaker won’t be shown to you at all. Leave these off to see more.</p>
        <Toggle
          label="Only show my ways of working"
          checked={form.dealbreakers.workMode}
          onChange={(v) => set('dealbreakers', { ...form.dealbreakers, workMode: v })}
        />
        <Toggle label="Only show roles that meet my salary" checked={form.dealbreakers.salary} onChange={(v) => set('dealbreakers', { ...form.dealbreakers, salary: v })} />
        <Toggle label="Only show my contract types" checked={form.dealbreakers.jobType} onChange={(v) => set('dealbreakers', { ...form.dealbreakers, jobType: v })} />
      </FormSection>

      <FormSection title="Prompts">
        <p className="muted small">Up to three. They give employers something to like — and to start a conversation with.</p>
        <PromptsEditor value={form.prompts} onChange={(v) => set('prompts', v)} questions={CANDIDATE_PROMPTS} />
        {errors.prompts && <span className="error">{errors.prompts}</span>}
      </FormSection>

      {Object.keys(errors).length > 0 && <p className="error">Please fix the highlighted fields.</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
