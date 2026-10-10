import { BarChart3, LayoutDashboard, Users } from "lucide-react";
import { WorkspaceLayout } from "@/routes/WorkspaceLayout";

export function SuperAdminLayout() {
  return (
    <WorkspaceLayout
      accent="super"
      navItems={[
        { icon: LayoutDashboard, label: "Overview", to: "/superadmin" },
        { icon: Users, label: "Admin accounts", to: "/superadmin/admins" },
        { icon: BarChart3, label: "Platform stats", to: "/superadmin" },
      ]}
      roleLabel="Platform control"
    />
  );
}
