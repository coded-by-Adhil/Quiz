interface ScoreBarProps {
  score: number;
  totalMarks: number;
}

export function ScoreBar({ score, totalMarks }: ScoreBarProps) {
  if (totalMarks <= 0) {
    return <span className="text-small text-text-muted">-</span>;
  }

  const percentage = Math.min(Math.max((score / totalMarks) * 100, 0), 100);
  const label = `${Math.round(percentage)}%`;

  return (
    <div className="flex min-w-28 items-center gap-2">
      <div
        aria-label={`Score percentage ${label}`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(percentage)}
        className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-surface-raised"
        role="progressbar"
      >
        <div className="h-full origin-left rounded-full bg-primary" style={{ transform: `scaleX(${percentage / 100})` }} />
      </div>
      <span className="min-w-9 text-right text-label font-semibold tabular-nums text-text">{label}</span>
    </div>
  );
}
