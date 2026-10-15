import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { AuthenticatedPlaceholderPage } from "@/features/auth/pages/AuthenticatedPlaceholderPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { DesignSystemPage } from "@/features/design-system/pages/DesignSystemPage";
import { GuestLandingPage } from "@/features/guest-quiz/pages/GuestLandingPage";
import { GuestQuizPage } from "@/features/guest-quiz/pages/GuestQuizPage";
import { GuestResultPage } from "@/features/guest-quiz/pages/GuestResultPage";
import { QuestionCreatePage } from "@/features/questions/pages/QuestionCreatePage";
import { QuestionEditPage } from "@/features/questions/pages/QuestionEditPage";
import { QuestionListPage } from "@/features/questions/pages/QuestionListPage";
import { LinkManagementPage } from "@/features/links/pages/LinkManagementPage";
import { QuizCreatePage } from "@/features/quizzes/pages/QuizCreatePage";
import { QuizDetailPage } from "@/features/quizzes/pages/QuizDetailPage";
import { QuizEditPage } from "@/features/quizzes/pages/QuizEditPage";
import { QuizListPage } from "@/features/quizzes/pages/QuizListPage";
import { StatusPage } from "@/features/status/pages/StatusPage";
import { AdminLayout } from "@/routes/AdminLayout";
import { AuthLayout } from "@/routes/AuthLayout";
import { GuestLayout } from "@/routes/GuestLayout";
import { GuestOnly, RequireAuth, RequireRole } from "@/routes/guards";
import { NotFoundPage } from "@/routes/NotFoundPage";
import { SuperAdminLayout } from "@/routes/SuperAdminLayout";

export const router = createBrowserRouter([
  {
    element: <GuestLayout />,
    children: [
      { element: <GuestLandingPage />, path: "q/:token" },
      {
        element: <GuestQuizPage />,
        path: "q/:token/attempt/:attemptId",
      },
      {
        element: <GuestResultPage />,
        path: "q/:token/attempt/:attemptId/result",
      },
    ],
  },
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
        element: <DesignSystemPage />,
        path: "/design-system",
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
                  { element: <QuestionListPage />, path: "admin/questions" },
                  { element: <QuestionCreatePage />, path: "admin/questions/new" },
                  { element: <QuestionEditPage />, path: "admin/questions/:id/edit" },
                  { element: <LinkManagementPage />, path: "admin/links" },
                  { element: <QuizListPage />, path: "admin/quizzes" },
                  { element: <QuizCreatePage />, path: "admin/quizzes/new" },
                  { element: <QuizDetailPage />, path: "admin/quizzes/:id" },
                  { element: <QuizEditPage />, path: "admin/quizzes/:id/edit" },
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
        element: <NotFoundPage />,
        path: "*",
      },
    ],
  },
]);
