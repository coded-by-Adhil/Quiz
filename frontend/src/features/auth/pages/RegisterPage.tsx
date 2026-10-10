import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  UserRoundPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { normalizeError } from "@/lib/normalizeError";
import { applyServerFieldErrors } from "@/features/auth/formErrors";
import { useAuth } from "@/features/auth/useAuth";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas";

export function RegisterPage() {
  const { register: registerAdmin } = useAuth();
  const [formMessage, setFormMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
      password_confirmation: "",
    },
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormMessage(undefined);
    setSuccessMessage(undefined);

    try {
      const response = await registerAdmin(values);
      setSuccessMessage(response.message);
      reset();
    } catch (error: unknown) {
      const apiError = normalizeError(error);

      if (apiError.status === 422) {
        const unknownFieldMessage = applyServerFieldErrors(
          apiError.fieldErrors,
          ["name", "email", "password", "password_confirmation"],
          setError,
          { password_confirmation: "password" },
        );
        setFormMessage(unknownFieldMessage ?? apiError.message);
        return;
      }

      if (apiError.status === 429) {
        setFormMessage("Too many registration attempts. Please wait and try again.");
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
          icon={<UserRoundPlus aria-hidden="true" size={15} strokeWidth={1.8} />}
          variant="info"
        >
          New admin account
        </Badge>
        <div className="grid gap-4">
          <h1 className="max-w-xl text-display font-semibold tracking-[-0.03em] text-text">
            Start with a well-run question bank.
          </h1>
          <p className="max-w-xl text-body text-text-muted">
            Register once, then wait for platform approval before signing in to author quizzes.
          </p>
        </div>
        <div className="max-w-lg border-l-2 border-primary pl-5">
          <p className="font-mono text-label font-semibold uppercase tracking-[0.1em] text-text-muted">
            Approval flow
          </p>
          <p className="mt-1 text-small font-semibold text-text">
            Registration is submitted for super-admin review.
          </p>
        </div>
      </div>

      <Card className="w-full shadow-raised">
        <div className="grid gap-2">
          <p className="font-mono text-label font-semibold uppercase tracking-[0.12em] text-primary">
            Register
          </p>
          <h2 className="text-title font-semibold tracking-[-0.02em] text-text">
            Request access
          </h2>
          <p className="text-small text-text-muted">
            New accounts require super-admin approval before sign-in.
          </p>
        </div>

        {successMessage ? (
          <div className="mt-5 flex gap-3 rounded-md border border-success/40 bg-success/10 px-3 py-3 text-small text-success" role="status">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={17} strokeWidth={1.8} />
            <span>{successMessage}</span>
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
            autoComplete="name"
            error={errors.name?.message}
            label="Name"
            type="text"
            {...register("name")}
          />
          <Input
            autoComplete="email"
            error={errors.email?.message}
            label="Email"
            type="email"
            {...register("email")}
          />
          <Input
            autoComplete="new-password"
            error={errors.password?.message}
            helperText="Use at least 8 characters."
            label="Password"
            type="password"
            {...register("password")}
          />
          <Input
            autoComplete="new-password"
            error={errors.password_confirmation?.message}
            label="Confirm password"
            type="password"
            {...register("password_confirmation")}
          />
          <Button
            className="w-full"
            icon={<ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />}
            loading={isSubmitting}
            type="submit"
          >
            Submit registration
          </Button>
        </form>

        <p className="mt-6 text-small text-text-muted">
          Already registered?{" "}
          <Link
            className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors duration-fast ease-standard hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring"
            to="/login"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </section>
  );
}
