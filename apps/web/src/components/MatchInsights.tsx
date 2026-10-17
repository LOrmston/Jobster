import { useState } from 'react';
import type { MatchResult } from '@jobster/shared';

export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 80 ? 'great' : score >= 60 ? 'good' : 'fair';
  return <span className={`score score-${tone}`}>{score}% match</span>;
}

/** Explains the algorithm's verdict: the same reasons are shown to both sides. */
export function MatchInsights({ match }: { match: MatchResult }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="insights">
      <div className="insights-head">
        <ScoreBadge score={match.score} />
        <button type="button" className="link" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Hide breakdown' : 'Why?'}
        </button>
      </div>
      <ul className="insight-list">
        {match.highlights.slice(0, open ? undefined : 3).map((h) => (
          <li key={h} className="insight-good">
            {h}
          </li>
        ))}
        {open &&
          match.gaps.map((g) => (
            <li key={g} className="insight-gap">
              {g}
            </li>
          ))}
      </ul>
      {open && (
        <div className="factors">
          {match.factors.map((f) => (
            <div key={f.key} className="factor">
              <span className="factor-label">{f.label}</span>
              <span className="factor-bar">
                <span style={{ width: `${Math.round(f.score * 100)}%` }} />
              </span>
              <span className="factor-weight">{f.weight}%</span>
            </div>
          ))}
          <p className="muted small">Bars show how well each factor fits; percentages show how much each factor counts.</p>
        </div>
      )}
    </div>
  );
}
