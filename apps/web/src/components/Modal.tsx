import { useEffect, type ReactNode } from 'react';

interface Props {
  onClose(): void;
  children: ReactNode;
  variant?: 'dialog' | 'sheet' | 'celebration';
  label: string;
}

export function Modal({ onClose, children, variant = 'dialog', label }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={`backdrop backdrop-${variant}`} onClick={onClose}>
      <div className={`modal modal-${variant}`} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
