import { useNavigate } from 'react-router-dom';
import type { CandidateProfile, EmployerProfile, Job, Match } from '@jobster/shared';
import { CandidateAvatar, CompanyLogo } from './Avatar';
import { Modal } from './Modal';

interface Props {
  match: Match;
  job: Job;
  employer: EmployerProfile;
  candidate: CandidateProfile;
  viewer: 'candidate' | 'employer';
  onClose(): void;
}

export function MatchCelebration({ match, job, employer, candidate, viewer, onClose }: Props) {
  const navigate = useNavigate();
  const other = viewer === 'candidate' ? employer.companyName : candidate.name;
  return (
    <Modal onClose={onClose} variant="celebration" label="It’s a match">
      <div className="celebrate-avatars">
        <CandidateAvatar candidate={candidate} size={84} />
        <CompanyLogo employer={employer} size={84} />
      </div>
      <h2 className="celebrate-title">It’s a match!</h2>
      <p>
        You and {other} both want to talk about <strong>{job.title}</strong>.
      </p>
      <div className="modal-actions">
        <button type="button" className="btn btn-light" onClick={() => navigate(`/matches/${match.id}`)}>
          {viewer === 'employer' ? 'Message & book an interview' : 'Send a message'}
        </button>
        <button type="button" className="btn btn-ghost-light" onClick={onClose}>
          Keep swiping
        </button>
      </div>
    </Modal>
  );
}
