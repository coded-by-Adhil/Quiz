import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { normalizeError } from "@/lib/normalizeError";
import { ToastProvider } from "@/components/ToastProvider";
import { router } from "@/routes/router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const apiError = normalizeError(error);

        if (
          apiError.status !== null &&
          apiError.status >= 400 &&
          apiError.status < 500
        ) {
          return false;
        }

        return failureCount < 2;
      },
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
