import { useEffect, useRef, useState } from "react";

interface GuestTimerState {
  announcement: string;
  isCritical: boolean;
  remainingSeconds: number | null;
}

const announcementText: Record<number, string> = {
  10: "10 seconds left",
  60: "1 minute left",
  300: "5 minutes left",
};

function secondsUntil(endAt: number): number {
  return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
}

export function useGuestTimer(
  startedAtClient: number,
  durationMinutes: number | null,
  onExpire: () => void,
): GuestTimerState {
  const endAt =
    durationMinutes === null ? null : startedAtClient + durationMinutes * 60 * 1000;
  const onExpireRef = useRef(onExpire);
  const seenAnnouncements = useRef<Set<number>>(new Set());
  const previousRemainingRef = useRef<number | null>(null);
  const deadlineHandledRef = useRef(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() =>
    endAt === null ? null : secondsUntil(endAt),
  );
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (endAt === null) {
      return;
    }

    const tick = () => {
      const nextRemaining = secondsUntil(endAt);
      setRemainingSeconds(nextRemaining);

      const previousRemaining = previousRemainingRef.current ?? nextRemaining + 1;
      for (const threshold of [300, 60, 10]) {
        if (
          previousRemaining > threshold &&
          nextRemaining <= threshold &&
          !seenAnnouncements.current.has(threshold)
        ) {
          seenAnnouncements.current.add(threshold);
          setAnnouncement(announcementText[threshold]);
        }
      }
      previousRemainingRef.current = nextRemaining;

      if (nextRemaining === 0 && !deadlineHandledRef.current) {
        deadlineHandledRef.current = true;
        onExpireRef.current();
      }
    };

    tick();
    const timerId = window.setInterval(tick, 1000);

    return () => window.clearInterval(timerId);
  }, [endAt]);

  return {
    announcement,
    isCritical: endAt !== null && remainingSeconds !== null && remainingSeconds < 60,
    remainingSeconds: endAt === null ? null : remainingSeconds,
  };
}
