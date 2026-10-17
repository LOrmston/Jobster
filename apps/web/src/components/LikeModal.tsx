import { useState } from 'react';
import { Modal } from './Modal';
import { HeartIcon, StarIcon } from './Section';

interface Props {
  section: string;
  recipient: string;
  standoutsRemaining: number;
  onSend(options: { note: string; standout: boolean }): void;
  onClose(): void;
}

/** Hinge's signature move: like one specific thing, and say why. */
export function LikeModal({ section, recipient, standoutsRemaining, onSend, onClose }: Props) {
  const [note, setNote] = useState('');
  return (
    <Modal onClose={onClose} label={`Like ${section}`}>
      <p className="muted small">You’re liking</p>
      <blockquote className="liked-quote">{section}</blockquote>
      <label className="field">
        <span className="field-label">Add a comment (optional)</span>
        <textarea
          autoFocus
          rows={3}
          maxLength={300}
          value={note}
          placeholder={`Tell ${recipient} what caught your eye…`}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="modal-actions">
        <button type="button" className="btn btn-primary" onClick={() => onSend({ note: note.trim(), standout: false })}>
          <HeartIcon filled /> Send like
        </button>
        <button
          type="button"
          className="btn btn-standout"
          disabled={standoutsRemaining === 0}
          onClick={() => onSend({ note: note.trim(), standout: true })}
          title="Standouts go to the top of their list. You get one a day."
        >
          <StarIcon /> Send as Standout ({standoutsRemaining} left)
        </button>
      </div>
    </Modal>
  );
}
