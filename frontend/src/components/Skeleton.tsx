interface SkeletonProps {
  className?: string;
  label?: string;
}

export function Skeleton({
  className = "h-4 w-full",
  label = "Loading content",
}: SkeletonProps) {
  return (
    <div
      aria-label={label}
      className={[
        "animate-pulse rounded-sm bg-surface-raised",
        className,
      ].join(" ")}
      role="status"
    />
  );
}
