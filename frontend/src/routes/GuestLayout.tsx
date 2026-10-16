import { Outlet } from "react-router-dom";
import { GuestBackground } from "@/features/guest-quiz/components/GuestArtwork";

export function GuestLayout() {
  return (
    <div className="guest-shell" data-guest-theme="lagoon">
      <GuestBackground />
      <header className="guest-header">
        <span className="guest-logo">Q</span>
        <span className="guest-wordmark">Quiz Platform</span>
      </header>
      <main className="guest-main">
        <Outlet />
      </main>
    </div>
  );
}
