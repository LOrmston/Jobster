import { useState } from 'react';
import type { CandidateProfile, EmployerProfile } from '@jobster/shared';
import { api } from '../api';
import { CandidateProfileView } from '../components/CandidateProfileView';
import { CompanyLogo } from '../components/Avatar';
import { CandidateForm } from '../forms/CandidateForm';
import { EmployerForm } from '../forms/EmployerForm';
import { useSession } from '../session';
import { errorToast, toast } from '../toast';

export function Profile() {
  const { user, profile, refresh, signOut } = useSession();
  const [tab, setTab] = useState<'view' | 'edit'>('view');
  const isCandidate = user!.role === 'candidate';

  const save = async (input: Parameters<typeof api.saveProfile>[0]) => {
    try {
      await api.saveProfile(input);
      await refresh();
      toast('Profile saved');
      setTab('view');
    } catch (err) {
      errorToast(err);
    }
  };

  return (
    <div className="page">
      <div className="segmented" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'view'} className={tab === 'view' ? 'active' : ''} onClick={() => setTab('view')}>
          View
        </button>
        <button type="button" role="tab" aria-selected={tab === 'edit'} className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}>
          Edit
        </button>
      </div>

      {tab === 'view' ? (
        isCandidate ? (
          <>
            <p className="muted small center">This is how employers see you.</p>
            <CandidateProfileView candidate={profile as CandidateProfile} />
          </>
        ) : (
          <CompanyCard employer={profile as EmployerProfile} />
        )
      ) : isCandidate ? (
        <CandidateForm initial={profile as CandidateProfile} submitLabel="Save profile" onSubmit={save} />
      ) : (
        <EmployerForm initial={profile as EmployerProfile} submitLabel="Save company" onSubmit={save} />
      )}

      <div className="account">
        <span className="muted small">Signed in as {user!.email}</span>
        <button type="button" className="btn btn-ghost btn-small" onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function CompanyCard({ employer }: { employer: EmployerProfile }) {
  return (
    <section className="panel panel-hero">
      <div className="hero-company">
        <CompanyLogo employer={employer} size={56} />
        <div>
          <h2 className="hero-title">{employer.companyName}</h2>
          <div className="muted small">
            {employer.industry} · {employer.location}
          </div>
        </div>
      </div>
      <p className="prompt-a small-serif">{employer.tagline}</p>
      <p>{employer.about}</p>
    </section>
  );
}
