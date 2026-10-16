import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "./useReducedMotion";

interface ScoreSummaryProps {
  message: string;
  percentage: number;
  score: number;
  totalMarks: number;
}

function ScoreValue({ score }: { score: number }) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reducedMotion || !valueRef.current) return;
    const duration = Number.parseFloat(getComputedStyle(valueRef.current).getPropertyValue("--guest-score-duration")) || 900;
    const started = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const fraction = Math.min((now - started) / duration, 1);
      setDisplay(fraction === 1 ? score : Math.floor(score * (1 - (1 - fraction) ** 3)));
      if (fraction < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score, reducedMotion]);
  return <span ref={valueRef}>{reducedMotion ? score : display}</span>;
}

function Confetti() {
  const [visible, setVisible] = useState(true);
  const reducedMotion = useReducedMotion();
  if (!visible || reducedMotion) return null;
  return (
    <div aria-hidden="true" className="guest-confetti" onAnimationEnd={(event) => {
      if (event.target === event.currentTarget) setVisible(false);
    }}>
      {Array.from({ length: 20 }, (_, index) => (
        <i key={index} style={{
          "--confetti-x": `${Math.cos(index * 2.4) * (100 + index * 6)}px`,
          "--confetti-y": `${Math.sin(index * 2.4) * 130 + 100}px`,
          "--confetti-turn": `${index * 45}deg`,
        } as CSSProperties} />
      ))}
    </div>
  );
}

export function ScoreSummary({ message, percentage, score, totalMarks }: ScoreSummaryProps) {
  const titleId = useId();
  return (
    <section className="guest-score grid gap-4 rounded-lg border border-border bg-surface p-6 text-center" aria-labelledby={titleId}>
      <p className="text-small font-semibold text-primary">Your score</p>
      <div className="guest-score-dial">
        <svg aria-hidden="true" className="guest-score-ring hidden" viewBox="0 0 240 240" fill="none" style={{ "--guest-score-offset": 100 - Math.min(Math.max(percentage, 0), 100) } as CSSProperties}>
          <circle className="guest-ring-track" cx="120" cy="120" r="110" strokeWidth="2" />
          <circle cx="120" cy="120" r="110" pathLength="100" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        </svg>
        <h2 id={titleId}>
          <span className="sr-only">{score} / {totalMarks}</span>
          <span aria-hidden="true" className="guest-score-value text-display">
            <ScoreValue score={score} key={score} />
            <span className="guest-score-total"> / {totalMarks}</span>
          </span>
        </h2>
      </div>
      <p className="text-heading font-semibold text-text">{percentage}%</p>
      <p className="text-body text-text-muted">{message}</p>
      {percentage >= 80 ? <Confetti /> : null}
    </section>
  );
}
