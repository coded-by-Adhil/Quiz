import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { AuthenticatedPlaceholderPage } from "@/features/auth/pages/AuthenticatedPlaceholderPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { StatusPage } from "@/features/status/pages/StatusPage";
import { AdminLayout } from "@/routes/AdminLayout";
import { AuthLayout } from "@/routes/AuthLayout";
import { GuestLayout } from "@/routes/GuestLayout";
import { GuestOnly, RequireAuth, RequireRole } from "@/routes/guards";
import { NotFoundPage } from "@/routes/NotFoundPage";
import { RoutePlaceholder } from "@/routes/RoutePlaceholder";
import { SuperAdminLayout } from "@/routes/SuperAdminLayout";

export const router = createBrowserRouter([
  {
    element: <AuthProvider />,
    children: [
      {
        element: <Navigate replace to="/status" />,
        path: "/",
      },
      {
        element: <StatusPage />,
        path: "/status",
      },
      {
        element: <GuestOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { element: <LoginPage />, path: "login" },
              { element: <RegisterPage />, path: "register" },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RequireRole role="admin" />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { element: <AuthenticatedPlaceholderPage />, path: "admin/questions" },
                  { element: <AuthenticatedPlaceholderPage />, path: "admin/quizzes" },
                  { element: <AuthenticatedPlaceholderPage />, path: "admin/quizzes/:id" },
                  {
                    element: <AuthenticatedPlaceholderPage />,
                    path: "admin/quizzes/:id/attempts",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RequireRole role="super_admin" />,
            children: [
              {
                element: <SuperAdminLayout />,
                children: [
                  { element: <AuthenticatedPlaceholderPage />, path: "superadmin" },
                  {
                    element: <AuthenticatedPlaceholderPage />,
                    path: "superadmin/admins",
                  },
                  {
                    element: <AuthenticatedPlaceholderPage />,
                    path: "superadmin/admins/:id",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        element: <GuestLayout />,
        children: [{ element: <RoutePlaceholder />, path: "q/:token" }],
      },
      {
        element: <NotFoundPage />,
        path: "*",
      },
    ],
  },
]);
