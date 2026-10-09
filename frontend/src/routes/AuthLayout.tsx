import { Outlet } from "react-router-dom";
import { LayoutShell } from "@/routes/LayoutShell";

export function AuthLayout() {
  return (
    <LayoutShell label="Quiz Platform · Auth">
      <Outlet />
    </LayoutShell>
  );
}
