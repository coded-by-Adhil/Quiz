import { Clock3 } from "lucide-react";
import type { CSSProperties } from "react";

interface TimerProps {
  isCritical: boolean;
  remainingSeconds: number;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function Timer({ isCritical, remainingSeconds }: TimerProps) {
  return (
    <div
      data-urgent={remainingSeconds > 0 && remainingSeconds <= 10}
      style={{ "--guest-remaining-seconds": Math.max(remainingSeconds, 0) } as CSSProperties}
      aria-label={isCritical ? "Less than 1 minute left" : "Time remaining"}
      className={[
        "guest-timer inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-small font-semibold",
        isCritical
          ? "border-danger/50 bg-danger/10 text-danger"
          : "border-success/50 bg-success/10 text-success",
      ].join(" ")}
      role="timer"
    >
      <Clock3 aria-hidden="true" size={17} strokeWidth={1.8} />
      <svg aria-hidden="true" className="guest-timer-ring" viewBox="0 0 40 40" fill="none">
        <circle className="guest-ring-track" cx="20" cy="20" r="16" strokeWidth="2" />
        <circle cx="20" cy="20" r="16" pathLength="100" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="font-mono tabular-nums">{formatTime(Math.max(remainingSeconds, 0))}</span>
      {isCritical ? <span>Less than 1 minute left</span> : null}
    </div>
  );
}
