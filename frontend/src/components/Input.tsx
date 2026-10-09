import type { InputHTMLAttributes } from "react";

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({
  className,
  error,
  id,
  label,
  ...props
}: InputProps) {
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-slate-800" htmlFor={id}>
        {label}
      </label>
      <input
        {...props}
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        className={[
          "min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none",
          "placeholder:text-slate-400 focus:border-slate-600 focus:ring-2 focus:ring-slate-200",
          error ? "border-rose-600 focus:border-rose-600 focus:ring-rose-100" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        id={id}
      />
      {error ? (
        <p className="text-sm text-rose-700" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
