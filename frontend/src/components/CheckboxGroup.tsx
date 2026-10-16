import type { ReactNode } from "react";
import { Check } from "lucide-react";

export interface CheckboxOption {
  id: number;
  label: ReactNode;
  checked: boolean;
  disabled?: boolean;
}

interface CheckboxGroupProps {
  error?: string;
  legend: string;
  optionSize?: "default" | "comfortable";
  onToggle: (id: number, checked: boolean) => void;
  options: CheckboxOption[];
}

export function CheckboxGroup({
  error,
  legend,
  optionSize = "default",
  onToggle,
  options,
}: CheckboxGroupProps) {
  return (
    <fieldset className="grid gap-3" aria-invalid={error ? true : undefined}>
      <legend className="text-small font-semibold text-text">{legend}</legend>
      <div className="grid gap-2">
        {options.map((option) => (
          <label
            data-slot="option"
            className={[
              "flex items-start gap-3 rounded-md border border-border bg-surface px-3 py-3 text-small transition-colors duration-fast ease-standard",
              optionSize === "comfortable" ? "min-h-12" : "min-h-10",
              option.disabled
                ? "cursor-not-allowed bg-surface-raised text-text-muted opacity-70"
                : "cursor-pointer hover:border-primary hover:bg-surface-raised",
            ].join(" ")}
            key={option.id}
          >
            <input
              checked={option.checked}
              className="mt-0.5 h-4 w-4 accent-primary focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
              disabled={option.disabled}
              onChange={(event) => onToggle(option.id, event.target.checked)}
              type="checkbox"
            />
            <span className="min-w-0 flex-1">{option.label}</span>
            <Check aria-hidden="true" className="guest-option-check hidden" size={20} />
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
