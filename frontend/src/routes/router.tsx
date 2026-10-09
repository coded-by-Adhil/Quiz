import { createBrowserRouter, Navigate } from "react-router-dom";
import { StatusPage } from "@/features/status/pages/StatusPage";
import { AdminLayout } from "@/routes/AdminLayout";
import { AuthLayout } from "@/routes/AuthLayout";
import { GuestLayout } from "@/routes/GuestLayout";
import { NotFoundPage } from "@/routes/NotFoundPage";
import { RoutePlaceholder } from "@/routes/RoutePlaceholder";
import { SuperAdminLayout } from "@/routes/SuperAdminLayout";

export const router = createBrowserRouter([
  {
    element: <Navigate replace to="/status" />,
    path: "/",
  },
  {
    element: <StatusPage />,
    path: "/status",
  },
  {
    children: [
      { element: <RoutePlaceholder />, path: "login" },
      { element: <RoutePlaceholder />, path: "register" },
    ],
    element: <AuthLayout />,
  },
  {
    children: [
      { element: <RoutePlaceholder />, path: "admin/questions" },
      { element: <RoutePlaceholder />, path: "admin/quizzes" },
      { element: <RoutePlaceholder />, path: "admin/quizzes/:id" },
      { element: <RoutePlaceholder />, path: "admin/quizzes/:id/attempts" },
    ],
    element: <AdminLayout />,
  },
  {
    children: [
      { element: <RoutePlaceholder />, path: "superadmin" },
      { element: <RoutePlaceholder />, path: "superadmin/admins" },
      { element: <RoutePlaceholder />, path: "superadmin/admins/:id" },
    ],
    element: <SuperAdminLayout />,
  },
  {
    children: [{ element: <RoutePlaceholder />, path: "q/:token" }],
    element: <GuestLayout />,
  },
  {
    element: <NotFoundPage />,
    path: "*",
  },
]);
