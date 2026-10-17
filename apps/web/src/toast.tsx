import { useEffect, useState } from 'react';

const EVENT = 'jobster:toast';

export function toast(message: string): void {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export function errorToast(err: unknown): void {
  toast(err instanceof Error ? err.message : 'Something went wrong');
}

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 3500);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  return message ? (
    <div className="toast" role="status">
      {message}
    </div>
  ) : null;
}
