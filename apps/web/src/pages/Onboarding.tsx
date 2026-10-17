import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { CandidateForm } from '../forms/CandidateForm';
import { EmployerForm } from '../forms/EmployerForm';
import { useSession } from '../session';
import { errorToast } from '../toast';

export function Onboarding() {
  const { user, refresh, signOut } = useSession();
  const navigate = useNavigate();
  const isCandidate = user!.role === 'candidate';

  const save = async (profile: Parameters<typeof api.saveProfile>[0]) => {
    try {
      await api.saveProfile(profile);
      await refresh();
      navigate(isCandidate ? '/' : '/jobs/new');
    } catch (err) {
      errorToast(err);
    }
  };

  return (
    <div className="page page-narrow">
      <span className="wordmark">Jobster</span>
      <h1 className="page-title">{isCandidate ? 'Let’s build your profile' : 'Tell candidates about you'}</h1>
      <p className="muted">
        {isCandidate
          ? 'Employers see this instead of a CV. The more you share, the better your matches.'
          : 'Next you’ll post your first job — then we’ll start lining up candidates.'}
      </p>
      {isCandidate ? <CandidateForm submitLabel="Start swiping" onSubmit={save} /> : <EmployerForm submitLabel="Continue" onSubmit={save} />}
      <button type="button" className="link" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
