import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';

export type SwipeDirection = 'left' | 'right';

export interface SwipeCardHandle {
  /** Animate the card off screen, as if it had been dragged. */
  swipe(direction: SwipeDirection): void;
}

interface Props {
  ref?: Ref<SwipeCardHandle>;
  onSwipe(direction: SwipeDirection): void;
  likeLabel: string;
  passLabel: string;
  children: ReactNode;
}

const THRESHOLD = 110;
const FLY_MS = 280;

/**
 * Drag horizontally to decide, scroll vertically to read. The card only
 * claims the pointer once a drag is clearly sideways, so the profile inside
 * still scrolls naturally on touch screens.
 */
export function SwipeCard({ ref, onSwipe, likeLabel, passLabel, children }: Props) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const gesture = useRef<{ x: number; y: number; id: number; active: boolean } | null>(null);
  const offset = useRef(0);
  const suppressClick = useRef(false);

  const move = (value: number) => {
    offset.current = value;
    setDx(value);
  };

  const fly = (direction: SwipeDirection) => {
    if (leaving) return;
    setLeaving(true);
    setDragging(false);
    move((direction === 'right' ? 1 : -1) * window.innerWidth * 1.2);
    setTimeout(() => onSwipe(direction), FLY_MS);
  };

  useImperativeHandle(ref, () => ({ swipe: fly }));

  const onPointerDown = (e: React.PointerEvent) => {
    if (leaving || e.button !== 0) return;
    gesture.current = { x: e.clientX, y: e.clientY, id: e.pointerId, active: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const ddx = e.clientX - g.x;
    const ddy = e.clientY - g.y;
    if (!g.active) {
      if (Math.abs(ddx) > 8 && Math.abs(ddx) > Math.abs(ddy)) {
        g.active = true;
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      } else if (Math.abs(ddy) > 8) {
        gesture.current = null; // A vertical scroll: let the browser have it.
      }
      return;
    }
    move(ddx);
  };

  const onPointerEnd = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g?.active) return;
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 0);
    setDragging(false);
    if (Math.abs(offset.current) > THRESHOLD) fly(offset.current > 0 ? 'right' : 'left');
    else move(0);
  };

  const progress = Math.min(1, Math.abs(dx) / THRESHOLD);

  return (
    <div
      className={`swipe-card${dragging ? ' is-dragging' : ''}`}
      style={{
        transform: `translateX(${dx}px) rotate(${dx / 24}deg)`,
        transition: dragging ? 'none' : `transform ${FLY_MS}ms ease-out`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={(e) => {
        // A drag that ends over a button shouldn't also press it.
        if (suppressClick.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      <div className="stamp stamp-like" style={{ opacity: dx > 0 ? progress : 0 }} aria-hidden>
        {likeLabel}
      </div>
      <div className="stamp stamp-pass" style={{ opacity: dx < 0 ? progress : 0 }} aria-hidden>
        {passLabel}
      </div>
      {children}
    </div>
  );
}
