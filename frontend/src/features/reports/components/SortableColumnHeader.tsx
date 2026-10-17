import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { TableHead } from "@/components/Table";
import type { SortDirection } from "@/features/quizzes/types";

interface SortableColumnHeaderProps<TSort extends string> {
  children: ReactNode;
  className?: string;
  direction: SortDirection;
  onSort: (sort: TSort, direction: SortDirection) => void;
  sort: TSort;
  sortKey: TSort;
}

export function SortableColumnHeader<TSort extends string>({
  children,
  className,
  direction,
  onSort,
  sort,
  sortKey,
}: SortableColumnHeaderProps<TSort>) {
  const isActive = sort === sortKey;
  const nextDirection: SortDirection = isActive && direction === "asc" ? "desc" : "asc";
  const Icon = !isActive ? ChevronsUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"} className={className}>
      <button
        className="inline-flex min-h-8 items-center gap-1 rounded-sm text-left transition-colors duration-fast ease-standard hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring"
        onClick={() => onSort(sortKey, nextDirection)}
        type="button"
      >
        {children}
        <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
      </button>
    </TableHead>
  );
}
