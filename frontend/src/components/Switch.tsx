import type { InputHTMLAttributes } from "react";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  description?: string;
  label: string;
}

export function Switch({ description, id, label, ...props }: SwitchProps) {
  const inputId = id ?? props.name;
  const descriptionId = description && inputId ? `${inputId}-description` : undefined;

  return (
    <label className="flex min-h-10 cursor-pointer items-start gap-3" htmlFor={inputId}>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          {...props}
          aria-describedby={descriptionId}
          className="peer sr-only"
          id={inputId}
          type="checkbox"
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-11 rounded-full border border-border bg-surface-raised transition-colors duration-fast ease-standard peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-60 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-text-muted after:transition-transform after:duration-fast after:ease-standard peer-checked:after:translate-x-5 peer-checked:after:bg-primary-contrast"
        />
      </span>
      <span className="grid gap-0.5">
        <span className="text-small font-semibold text-text">{label}</span>
        {description ? (
          <span className="text-small text-text-muted" id={descriptionId}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
