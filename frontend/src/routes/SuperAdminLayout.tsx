import { Outlet } from "react-router-dom";
import { LayoutShell } from "@/routes/LayoutShell";

export function SuperAdminLayout() {
  return (
    <LayoutShell label="Quiz Platform · Super Admin">
      <Outlet />
    </LayoutShell>
  );
}
