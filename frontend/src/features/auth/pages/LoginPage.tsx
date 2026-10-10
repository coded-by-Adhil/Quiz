import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { normalizeError } from "@/lib/normalizeError";
import { applyServerFieldErrors } from "@/features/auth/formErrors";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { useAuth } from "@/features/auth/useAuth";

interface LoginLocationState {
  notice?: unknown;
}

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const [formMessage, setFormMessage] = useState<string | undefined>();
  const [notice] = useState(() => {
    const state = location.state as LoginLocationState | null;
    return typeof state?.notice === "string" ? state.notice : undefined;
  });
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormMessage(undefined);

    try {
      await login(values);
    } catch (error: unknown) {
      const apiError = normalizeError(error);

      if (apiError.status === 401) {
        setFormMessage("Invalid email or password.");
        return;
      }

      if (apiError.status === 403) {
        setFormMessage("Your account is awaiting approval.");
        return;
      }

      if (apiError.status === 422) {
        const unknownFieldMessage = applyServerFieldErrors(
          apiError.fieldErrors,
          ["email", "password"],
          setError,
        );
        setFormMessage(unknownFieldMessage ?? apiError.message);
        return;
      }

      if (apiError.status === 429) {
        setFormMessage("Too many login attempts. Please wait and try again.");
        return;
      }

      setFormMessage(
        apiError.status === null
          ? "The API could not be reached. Check your connection and try again."
          : apiError.message,
      );
    }
  });

  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-slate-50 px-6 py-12 text-slate-950">
      <Card className="w-full max-w-md">
        <div className="grid gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Quiz Platform
          </p>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-600">
            Use your approved admin account to continue.
          </p>
        </div>

        {notice ? (
          <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
            {notice}
          </p>
        ) : null}

        {formMessage ? (
          <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
            {formMessage}
          </p>
        ) : null}

        <form className="mt-6 grid gap-5" onSubmit={onSubmit}>
          <Input
            autoComplete="email"
            error={errors.email?.message}
            label="Email"
            type="email"
            {...register("email")}
          />
          <Input
            autoComplete="current-password"
            error={errors.password?.message}
            label="Password"
            type="password"
            {...register("password")}
          />
          <Button loading={isSubmitting} type="submit">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Need an admin account?{" "}
          <Link className="font-semibold text-slate-950 underline" to="/register">
            Register
          </Link>
        </p>
      </Card>
    </main>
  );
}
