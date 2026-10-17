import { CrossIcon, HeartIcon, StarIcon } from './Section';

interface Props {
  onPass(): void;
  onLike(): void;
  onStandout(): void;
  standoutsRemaining: number;
  disabled?: boolean;
  likeLabel?: string;
}

export function ActionBar({ onPass, onLike, onStandout, standoutsRemaining, disabled, likeLabel = 'Like' }: Props) {
  return (
    <div className="action-bar">
      <button type="button" className="round-btn round-pass" onClick={onPass} disabled={disabled} aria-label="Pass" title="Pass (←)">
        <CrossIcon />
      </button>
      <button
        type="button"
        className="round-btn round-standout"
        onClick={onStandout}
        disabled={disabled || standoutsRemaining === 0}
        aria-label="Standout"
        title={standoutsRemaining ? 'Send a Standout — they’ll see you first' : 'No Standouts left today'}
      >
        <StarIcon />
      </button>
      <button type="button" className="round-btn round-like" onClick={onLike} disabled={disabled} aria-label={likeLabel} title={`${likeLabel} (→)`}>
        <HeartIcon filled />
      </button>
    </div>
  );
}
