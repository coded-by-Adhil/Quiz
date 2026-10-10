import { useState } from "react";
import { AlertCircle, ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { normalizeError } from "@/lib/normalizeError";
import { applyServerFieldErrors } from "@/features/auth/formErrors";
import { useAuth } from "@/features/auth/useAuth";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";

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
    defaultValues: { email: "", password: "" },
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
    <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-center lg:gap-16 lg:py-16">
      <div className="grid max-w-2xl gap-6">
        <Badge
          icon={<ShieldCheck aria-hidden="true" size={15} strokeWidth={1.8} />}
          variant="info"
        >
          Approved workspace access
        </Badge>
        <div className="grid gap-4">
          <h1 className="max-w-xl text-display font-semibold tracking-[-0.03em] text-text">
            A clear place to run every quiz.
          </h1>
          <p className="max-w-xl text-body text-text-muted">
            Build question banks, assemble quizzes, and read results from one calm workspace.
          </p>
        </div>
        <dl className="grid max-w-lg gap-4 border-l-2 border-primary pl-5 sm:grid-cols-2">
          <div>
            <dt className="font-mono text-label font-semibold uppercase tracking-[0.1em] text-text-muted">
              Admins
            </dt>
            <dd className="mt-1 text-small font-semibold text-text">Create and manage</dd>
          </div>
          <div>
            <dt className="font-mono text-label font-semibold uppercase tracking-[0.1em] text-text-muted">
              Super admins
            </dt>
            <dd className="mt-1 text-small font-semibold text-text">Oversee the platform</dd>
          </div>
        </dl>
      </div>

      <Card className="w-full shadow-raised">
        <div className="grid gap-2">
          <p className="font-mono text-label font-semibold uppercase tracking-[0.12em] text-primary">
            Sign in
          </p>
          <h2 className="text-title font-semibold tracking-[-0.02em] text-text">
            Welcome back
          </h2>
          <p className="text-small text-text-muted">
            Use your approved admin account to continue.
          </p>
        </div>

        {notice ? (
          <div className="mt-5 flex gap-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-3 text-small text-warning" role="status">
            <Clock3 aria-hidden="true" className="mt-0.5 shrink-0" size={17} strokeWidth={1.8} />
            <span>{notice}</span>
          </div>
        ) : null}

        {formMessage ? (
          <div className="mt-5 flex gap-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-3 text-small text-danger" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={17} strokeWidth={1.8} />
            <span>{formMessage}</span>
          </div>
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
          <Button
            className="w-full"
            icon={<ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />}
            loading={isSubmitting}
            type="submit"
          >
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-small text-text-muted">
          Need an admin account?{" "}
          <Link
            className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors duration-fast ease-standard hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring"
            to="/register"
          >
            Register
          </Link>
        </p>
      </Card>
    </section>
  );
}
