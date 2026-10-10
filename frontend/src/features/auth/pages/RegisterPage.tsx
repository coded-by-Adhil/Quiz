import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { normalizeError } from "@/lib/normalizeError";
import { applyServerFieldErrors } from "@/features/auth/formErrors";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas";
import { useAuth } from "@/features/auth/useAuth";

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
          {
            password_confirmation: "password",
          },
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
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-slate-50 px-6 py-12 text-slate-950">
      <Card className="w-full max-w-md">
        <div className="grid gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Quiz Platform
          </p>
          <h1 className="text-2xl font-semibold">Register an admin account</h1>
          <p className="text-sm text-slate-600">
            New accounts require super admin approval before sign-in.
          </p>
        </div>

        {successMessage ? (
          <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
            {successMessage}
          </p>
        ) : null}

        {formMessage ? (
          <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
            {formMessage}
          </p>
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
          <Button loading={isSubmitting} type="submit">
            Submit registration
          </Button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already registered?{" "}
          <Link className="font-semibold text-slate-950 underline" to="/login">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
