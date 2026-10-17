import { useState } from 'react';
import {
  COMPANY_SIZE_LABELS,
  COMPANY_SIZES,
  employerProfileSchema,
  type EmployerProfile,
  type EmployerProfileInput,
} from '@jobster/shared';
import { Field, FormSection, zodErrors, type Errors } from '../components/form';

const LOGOS = ['🚀', '🌊', '⭐', '🧪', '🏗️', '🎨', '🥕', '📒', '💡', '🛰️', '🌿', '🦊'];

const blank: EmployerProfileInput = {
  companyName: '',
  tagline: '',
  about: '',
  industry: '',
  size: '11-50',
  location: '',
  logoEmoji: LOGOS[0]!,
};

interface Props {
  initial?: EmployerProfile;
  submitLabel: string;
  onSubmit(profile: EmployerProfileInput): Promise<void>;
}

export function EmployerForm({ initial, submitLabel, onSubmit }: Props) {
  const [form, setForm] = useState<EmployerProfileInput>(() => {
    if (!initial) return blank;
    const { userId: _, ...rest } = initial;
    return rest;
  });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof EmployerProfileInput>(key: K, value: EmployerProfileInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = employerProfileSchema.safeParse(form);
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
      <FormSection title="Your company">
        <Field label="Company name" error={errors.companyName}>
          <input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} autoComplete="organization" />
        </Field>
        <div className="field">
          <span className="field-label">Logo</span>
          <div className="swatches">
            {LOGOS.map((logo) => (
              <button
                key={logo}
                type="button"
                className={`swatch swatch-emoji${form.logoEmoji === logo ? ' swatch-active' : ''}`}
                aria-pressed={form.logoEmoji === logo}
                onClick={() => set('logoEmoji', logo)}
              >
                {logo}
              </button>
            ))}
          </div>
        </div>
        <Field label="Tagline" error={errors.tagline} hint="What you do, in one line">
          <input value={form.tagline} maxLength={120} onChange={(e) => set('tagline', e.target.value)} />
        </Field>
        <Field label="About" error={errors.about} hint="A short paragraph: mission, stage, culture">
          <textarea rows={4} maxLength={1000} value={form.about} onChange={(e) => set('about', e.target.value)} />
        </Field>
        <div className="row">
          <Field label="Industry" error={errors.industry}>
            <input value={form.industry} placeholder="e.g. Fintech" onChange={(e) => set('industry', e.target.value)} />
          </Field>
          <Field label="Size">
            <select value={form.size} onChange={(e) => set('size', e.target.value as EmployerProfileInput['size'])}>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s}>
                  {COMPANY_SIZE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Headquarters" error={errors.location}>
          <input value={form.location} placeholder="e.g. Manchester, UK" onChange={(e) => set('location', e.target.value)} />
        </Field>
      </FormSection>
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
