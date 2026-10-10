import { BarChart3, CircleHelp, LayoutDashboard } from "lucide-react";
import { WorkspaceLayout } from "@/routes/WorkspaceLayout";

export function AdminLayout() {
  return (
    <WorkspaceLayout
      accent="admin"
      navItems={[
        { icon: LayoutDashboard, label: "Quizzes", to: "/admin/quizzes" },
        { icon: CircleHelp, label: "Question bank", to: "/admin/questions" },
        { icon: BarChart3, label: "Reports", to: "/admin/quizzes" },
      ]}
      roleLabel="Admin workspace"
    />
  );
}
