import { useState, type ReactNode } from "react";
import { useReducedMotion } from "./useReducedMotion";

export function QuestionTransition({ index, children }: { index: number; children: ReactNode }) {
  const [position, setPosition] = useState({ index, direction: "forward" });
  if (position.index !== index) {
    setPosition({ index, direction: index < position.index ? "back" : "forward" });
  }
  return <div className="guest-slide" data-direction={position.direction} key={index}>{children}</div>;
}

// A closing review stays visible for its exit animation, but is never interactive.
export function GuestReveal({ open, children }: { open: boolean; children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [present, setPresent] = useState(open);
  const [previousOpen, setPreviousOpen] = useState(open);
  if (previousOpen !== open) {
    setPreviousOpen(open);
    if (open) setPresent(true);
  }
  if (!open && (!present || reducedMotion)) return null;
  return (
    <div aria-hidden={!open || undefined} className="guest-reveal" data-closing={!open} inert={!open}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && !open) setPresent(false);
      }}>
      {children}
    </div>
  );
}
