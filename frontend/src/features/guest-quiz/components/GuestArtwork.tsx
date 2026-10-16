import { CircleHelp, Clock3, Link2Off, RotateCcw, WifiOff } from "lucide-react";

export function GuestBackground() {
  return (
    <div aria-hidden="true" className="guest-background">
      {[0, 1].map((side) => (
        <svg className="guest-waves" viewBox="0 0 300 500" fill="none" key={side}>
          {[0, 1, 2, 3, 4].map((line) => (
            <path key={line} d={`M${20 + line * 40} 0 Q${-60 + line * 40} 120 ${80 + line * 40} 240 T${20 + line * 40} 500`} stroke="currentColor" strokeWidth="2" />
          ))}
        </svg>
      ))}
    </div>
  );
}

export function LandingArtwork() {
  return (
    <svg aria-hidden="true" className="guest-art guest-landing-art" viewBox="0 0 160 160" fill="none">
      <g transform="rotate(-12 80 80)">
        <rect className="guest-art-secondary" x="16" y="35" width="94" height="104" rx="20" />
        <rect className="guest-art-surface" x="44" y="20" width="94" height="104" rx="20" stroke="currentColor" strokeWidth="3" />
        <path d="m66 66 13 14 29-32" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M69 100h40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </g>
      <path className="guest-art-accent" d="m119 100 28 8-19 44-9-17-18 4Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export type GuestStateKind = "unavailable" | "not-found" | "session" | "timeout" | "network";
const stateIcons = { unavailable: Link2Off, "not-found": CircleHelp, session: RotateCcw, timeout: Clock3, network: WifiOff };

export function GuestStateArtwork({ kind }: { kind: GuestStateKind }) {
  const Icon = stateIcons[kind];
  return (
    <svg aria-hidden="true" className="guest-art" viewBox="0 0 128 128" fill="none">
      <rect className="guest-art-secondary" x="7" y="29" width="84" height="84" rx="22" transform="rotate(-8 49 71)" />
      <rect className="guest-art-surface" x="31" y="14" width="80" height="88" rx="20" stroke="currentColor" strokeWidth="2" />
      <path className="guest-art-accent" d="m94 87 24 11-20 25-3-14-14-3Z" stroke="currentColor" strokeWidth="2" />
      <Icon x="47" y="32" width="48" height="48" strokeWidth="1.6" />
    </svg>
  );
}
