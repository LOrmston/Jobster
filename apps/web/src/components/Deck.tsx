import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { SwipeResponse } from '@jobster/shared';
import { useSession } from '../session';
import { errorToast, toast } from '../toast';
import { ActionBar } from './ActionBar';
import { LikeModal } from './LikeModal';
import { SwipeCard, type SwipeCardHandle, type SwipeDirection } from './SwipeCard';

export interface LikeExtras {
  standout?: boolean;
  likedSection?: string;
  note?: string;
}

interface Props<T> {
  items: T[];
  keyOf(item: T): string;
  recipientName(item: T): string;
  render(item: T, onLikeSection: (label: string) => void): ReactNode;
  decide(item: T, decision: 'like' | 'pass', extras: LikeExtras): Promise<SwipeResponse>;
  onMatch(item: T, response: SwipeResponse): void;
  likeLabel: string;
  passLabel: string;
  empty: ReactNode;
}

/** A stack of profiles: swipe or tap to decide, heart a section to like it with a comment. */
export function Deck<T>({ items, keyOf, recipientName, render, decide, onMatch, likeLabel, passLabel, empty }: Props<T>) {
  const { standoutsRemaining, refresh } = useSession();
  const [queue, setQueue] = useState(items);
  const [likeSection, setLikeSection] = useState<string | null>(null);
  const card = useRef<SwipeCardHandle>(null);
  const pending = useRef<LikeExtras>({});

  useEffect(() => setQueue(items), [items]);

  const current = queue[0];
  const currentKey = current ? keyOf(current) : null;

  // Each new profile starts from the top, like turning to a fresh card.
  useEffect(() => window.scrollTo({ top: 0 }), [currentKey]);

  const swipe = (direction: SwipeDirection, extras: LikeExtras = {}) => {
    pending.current = extras;
    card.current?.swipe(direction);
  };

  const onSwiped = async (direction: SwipeDirection) => {
    if (!current) return;
    const extras = pending.current;
    pending.current = {};
    setQueue((q) => q.slice(1));
    try {
      const response = await decide(current, direction === 'right' ? 'like' : 'pass', direction === 'right' ? extras : {});
      if (extras.standout) void refresh();
      if (response.match) onMatch(current, response);
      else if (direction === 'right' && extras.note) toast(`Like sent to ${recipientName(current)}`);
    } catch (err) {
      errorToast(err);
      setQueue((q) => [current, ...q]);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (likeSection || !current || (e.target as HTMLElement).closest('input, textarea, select')) return;
      if (e.key === 'ArrowLeft') swipe('left');
      if (e.key === 'ArrowRight') swipe('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!current) return <>{empty}</>;

  return (
    <div className="deck">
      <div className="deck-stack">
        {queue[1] && <div className="deck-peek" aria-hidden />}
        <SwipeCard key={keyOf(current)} ref={card} onSwipe={onSwiped} likeLabel={likeLabel} passLabel={passLabel}>
          {render(current, setLikeSection)}
        </SwipeCard>
      </div>
      <ActionBar
        onPass={() => swipe('left')}
        onLike={() => swipe('right')}
        onStandout={() => swipe('right', { standout: true })}
        standoutsRemaining={standoutsRemaining}
        likeLabel={likeLabel}
      />
      {likeSection && (
        <LikeModal
          section={likeSection}
          recipient={recipientName(current)}
          standoutsRemaining={standoutsRemaining}
          onClose={() => setLikeSection(null)}
          onSend={({ note, standout }) => {
            setLikeSection(null);
            swipe('right', { likedSection: likeSection, note: note || undefined, standout });
          }}
        />
      )}
    </div>
  );
}
