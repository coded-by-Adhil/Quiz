import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  className,
  error,
  helperText,
  id,
  label,
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;
  const errorId = error && textareaId ? `${textareaId}-error` : undefined;
  const helperId = helperText && textareaId ? `${textareaId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-1.5">
      <label className="text-small font-semibold text-text" htmlFor={textareaId}>
        {label}
      </label>
      <textarea
        {...props}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={[
          "min-h-28 resize-y rounded-md border border-border bg-surface px-3 py-2 text-body text-text outline-none transition-[background-color,border-color,box-shadow,color] duration-fast ease-standard placeholder:text-text-muted",
          "focus:border-primary focus:ring-2 focus:ring-focus-ring focus:ring-offset-1 focus:ring-offset-surface",
          "disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-text-muted disabled:opacity-70",
          error ? "border-danger focus:border-danger focus:ring-danger" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        id={textareaId}
      />
      {helperText && !error ? (
        <p className="text-small text-text-muted" id={helperId}>
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p className="text-small text-danger" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
