interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const safeTotal = Math.max(total, 1);
  const value = Math.min(Math.max(current, 0), safeTotal);
  const percentage = (value / safeTotal) * 100;

  return (
    <div
      aria-label={`Question ${value} of ${safeTotal}`}
      aria-valuemax={safeTotal}
      aria-valuemin={0}
      aria-valuenow={value}
      className="guest-progress h-2 w-full overflow-hidden rounded-full bg-surface-raised"
      role="progressbar"
    >
      <div
        className="h-full origin-left rounded-full bg-primary transition-transform duration-standard ease-standard"
        style={{ transform: `scaleX(${percentage / 100})` }}
      />
    </div>
  );
}
