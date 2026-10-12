import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/Button";

interface PaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
}

export function Pagination({ currentPage, onPageChange, totalPages }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Question pagination" className="flex items-center justify-between gap-4">
      <Button
        aria-label="Previous page"
        disabled={currentPage === 1}
        icon={<ChevronLeft aria-hidden="true" size={17} strokeWidth={1.8} />}
        onClick={() => onPageChange(currentPage - 1)}
        title="Previous page"
        variant="secondary"
      />
      <p className="text-small text-text-muted" aria-live="polite">
        Page <strong className="text-text">{currentPage}</strong> of {totalPages}
      </p>
      <Button
        aria-label="Next page"
        disabled={currentPage === totalPages}
        icon={<ChevronRight aria-hidden="true" size={17} strokeWidth={1.8} />}
        onClick={() => onPageChange(currentPage + 1)}
        title="Next page"
        variant="secondary"
      />
    </nav>
  );
}
