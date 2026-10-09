import { Outlet } from "react-router-dom";
import { LayoutShell } from "@/routes/LayoutShell";

export function GuestLayout() {
  return (
    <LayoutShell label="Quiz Platform · Guest">
      <Outlet />
    </LayoutShell>
  );
}
