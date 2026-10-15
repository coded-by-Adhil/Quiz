import { BarChart3, CircleHelp, LayoutDashboard, Link2 } from "lucide-react";
import { WorkspaceLayout } from "@/routes/WorkspaceLayout";

export function AdminLayout() {
  return (
    <WorkspaceLayout
      accent="admin"
      navItems={[
        { icon: LayoutDashboard, label: "Quizzes", to: "/admin/quizzes" },
        { icon: CircleHelp, label: "Questions", to: "/admin/questions" },
        { icon: Link2, label: "Quiz links", to: "/admin/links" },
        { icon: BarChart3, label: "Reports", to: "/admin/quizzes" },
      ]}
      roleLabel="Admin workspace"
    />
  );
}
