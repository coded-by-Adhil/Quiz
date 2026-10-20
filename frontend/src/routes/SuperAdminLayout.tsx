import { LayoutDashboard, Users } from "lucide-react";
import { WorkspaceLayout } from "@/routes/WorkspaceLayout";

export function SuperAdminLayout() {
  return (
    <WorkspaceLayout
      accent="super"
      navItems={[
        { activeWhen: (pathname) => pathname === "/superadmin", icon: LayoutDashboard, label: "Dashboard", to: "/superadmin" },
        { activeWhen: (pathname) => pathname.startsWith("/superadmin/admins"), icon: Users, label: "Admins", to: "/superadmin/admins" },
      ]}
      roleLabel="Platform control"
    />
  );
}
