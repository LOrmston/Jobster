/** The lobster mark beside the wordmark, as in the logo. */
export function Brand({ size = 'medium' }: { size?: 'medium' | 'large' }) {
  return (
    <span className={`brand brand-${size}`}>
      <img src="/brand/lobster.png" alt="" className="brand-mark" />
      <span className="brand-word">
        <span className="brand-j">J</span>obster
      </span>
    </span>
  );
}

export function BrandLogo({ className = '' }: { className?: string }) {
  return <img src="/brand/logo.png" alt="Jobster — swipe right on your next job" className={`brand-logo ${className}`} />;
}
