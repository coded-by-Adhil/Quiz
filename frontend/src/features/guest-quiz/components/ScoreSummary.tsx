import { Award } from "lucide-react";

interface ScoreSummaryProps {
  message: string;
  percentage: number;
  score: number;
  totalMarks: number;
}

export function ScoreSummary({
  message,
  percentage,
  score,
  totalMarks,
}: ScoreSummaryProps) {
  return (
    <section className="grid gap-4 rounded-lg border border-border bg-surface p-6 text-center shadow-raised" aria-labelledby="score-summary-title">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Award aria-hidden="true" size={26} strokeWidth={1.7} />
      </div>
      <div className="grid gap-1">
        <p className="text-small font-semibold uppercase tracking-[0.1em] text-primary">Your score</p>
        <h1 className="text-display font-semibold tracking-[-0.03em] text-text" id="score-summary-title">
          {score} / {totalMarks}
        </h1>
        <p className="text-heading font-semibold text-text">{percentage}%</p>
        <p className="text-body text-text-muted">{message}</p>
      </div>
    </section>
  );
}
