export interface SpinnerProps {
  size?: "sm" | "md";
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
} as const;

export function Spinner({
  label = "Loading",
  size = "md",
}: SpinnerProps) {
  return (
    <span
      aria-label={label}
      className={[
        "inline-block animate-spin rounded-full border-slate-300 border-t-slate-900",
        sizeClasses[size],
      ].join(" ")}
      role="status"
    />
  );
}
