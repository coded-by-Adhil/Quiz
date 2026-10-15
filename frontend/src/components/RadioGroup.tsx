import type { ReactNode } from "react";

export interface RadioOption {
  id: number;
  label: ReactNode;
  disabled?: boolean;
}

interface RadioGroupProps {
  error?: string;
  legend: string;
  onSelect: (id: number) => void;
  options: RadioOption[];
  selectedId: number | null;
}

export function RadioGroup({
  error,
  legend,
  onSelect,
  options,
  selectedId,
}: RadioGroupProps) {
  return (
    <fieldset className="grid gap-3" aria-invalid={error ? true : undefined}>
      <legend className="text-small font-semibold text-text">{legend}</legend>
      <div className="grid gap-2">
        {options.map((option) => (
          <label
            className={[
              "flex min-h-12 items-start gap-3 rounded-md border border-border bg-surface px-3 py-3 text-small transition-colors duration-fast ease-standard",
              option.disabled
                ? "cursor-not-allowed bg-surface-raised text-text-muted opacity-70"
                : "cursor-pointer hover:border-primary hover:bg-surface-raised",
            ].join(" ")}
            key={option.id}
          >
            <input
              checked={selectedId === option.id}
              className="mt-0.5 h-4 w-4 accent-primary focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
              disabled={option.disabled}
              name={legend}
              onChange={() => onSelect(option.id)}
              type="radio"
            />
            <span className="min-w-0 flex-1">{option.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p className="text-small text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
