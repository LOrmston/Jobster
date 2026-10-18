import type { MatchResult } from '@jobster/shared';

export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 80 ? 'great' : score >= 60 ? 'good' : 'fair';
  return <span className={`score score-${tone}`}>{score}% match</span>;
}

/** The score and the top reasons, compact enough to sit inside a card. */
export function MatchSummaryLine({ match }: { match: MatchResult }) {
  return (
    <div className="match-line">
      <ScoreBadge score={match.score} />
      <span className="muted small">{match.highlights.slice(0, 2).join(' · ')}</span>
    </div>
  );
}

/**
 * The algorithm's full reasoning: what fits, what doesn't and how each
 * factor scored. The same breakdown is shown to both sides.
 */
export function MatchInsights({ match, title = 'Why it’s a match' }: { match: MatchResult; title?: string }) {
  return (
    <div className="insights">
      <div className="insights-head">
        <h3>{title}</h3>
        <ScoreBadge score={match.score} />
      </div>
      <ul className="insight-list">
        {match.highlights.map((h) => (
          <li key={h} className="insight-good">
            {h}
          </li>
        ))}
        {match.gaps.map((g) => (
          <li key={g} className="insight-gap">
            {g}
          </li>
        ))}
      </ul>
      <div className="factors">
        {match.factors.map((f) => (
          <div key={f.key} className="factor" title={f.detail}>
            <span className="factor-label">{f.label}</span>
            <span className="factor-bar">
              <span style={{ width: `${Math.round(f.score * 100)}%` }} />
            </span>
            <span className="factor-weight">{f.weight}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
