import { BarChart3, CircleHelp, LayoutDashboard, Link2 } from "lucide-react";
import { WorkspaceLayout } from "@/routes/WorkspaceLayout";

export function AdminLayout() {
  return (
    <WorkspaceLayout
      accent="admin"
      navItems={[
        {
          activeWhen: (pathname) => /^\/admin\/quizzes(?:\/(?:new|\d+(?:\/edit)?))?$/.test(pathname),
          icon: LayoutDashboard,
          label: "Quizzes",
          to: "/admin/quizzes",
        },
        { icon: CircleHelp, label: "Questions", to: "/admin/questions" },
        { icon: Link2, label: "Quiz links", to: "/admin/links" },
        {
          activeWhen: (pathname) => pathname === "/admin/reports" || /^\/admin\/quizzes\/\d+\/attempts$/.test(pathname),
          icon: BarChart3,
          label: "Reports",
          to: "/admin/reports",
        },
      ]}
      roleLabel="Admin workspace"
    />
  );
}
