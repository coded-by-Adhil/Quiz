import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      {...props}
      className={["w-full border-separate border-spacing-0 text-left", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} className={className} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} className={className} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} className={["group", className].filter(Boolean).join(" ")} />;
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={[
        "border-b border-border bg-surface-raised px-3 py-3 text-label font-semibold uppercase tracking-[0.08em] text-text-muted first:rounded-tl-md last:rounded-tr-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={["border-b border-border px-3 py-3 align-middle text-small text-text", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
