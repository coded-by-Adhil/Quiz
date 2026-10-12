import { Search, X } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { Button } from "@/components/Button";

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  onClear?: () => void;
}

export function SearchInput({
  className,
  label,
  onClear,
  value,
  ...props
}: SearchInputProps) {
  const inputId = props.id ?? props.name;
  const hasValue = typeof value === "string" && value.length > 0;

  return (
    <div className="grid gap-1.5">
      <label className="text-small font-semibold text-text" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          size={17}
          strokeWidth={1.8}
        />
        <input
          {...props}
          className={[
            "min-h-10 w-full rounded-md border border-border bg-surface px-10 py-2 text-body text-text outline-none transition-[background-color,border-color,box-shadow,color] duration-fast ease-standard placeholder:text-text-muted",
            "focus:border-primary focus:ring-2 focus:ring-focus-ring focus:ring-offset-1 focus:ring-offset-surface",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          id={inputId}
          type="search"
          value={value}
        />
        {hasValue && onClear ? (
          <Button
            aria-label={`Clear ${label.toLowerCase()}`}
            className="absolute right-1 top-1/2 min-h-8 min-w-8 -translate-y-1/2 px-2"
            icon={<X aria-hidden="true" size={16} strokeWidth={1.8} />}
            onClick={onClear}
            title="Clear search"
            variant="ghost"
          />
        ) : null}
      </div>
    </div>
  );
}
