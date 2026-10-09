import { Outlet } from "react-router-dom";
import { LayoutShell } from "@/routes/LayoutShell";

export function AdminLayout() {
  return (
    <LayoutShell label="Quiz Platform · Admin">
      <Outlet />
    </LayoutShell>
  );
}
