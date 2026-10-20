import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SortDirection } from "@/features/quizzes/types";

function positivePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

interface UsePaginatedListUrlStateOptions<TSort extends string> {
  defaultSort: TSort;
  isSort: (value: string | null) => value is TSort;
}

export function usePaginatedListUrlState<TSort extends string>({
  defaultSort,
  isSort,
}: UsePaginatedListUrlStateOptions<TSort>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positivePage(searchParams.get("page"));
  const search = searchParams.get("search") ?? "";
  const rawSort = searchParams.get("sort");
  const sort = isSort(rawSort) ? rawSort : defaultSort;
  const direction: SortDirection = searchParams.get("direction") === "desc" ? "desc" : "asc";
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    // Browser back/forward can change the URL without changing the controlled input.
    // oxlint-disable-next-line react/set-state-in-effect
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (searchInput === search) return;

    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchInput.trim()) next.set("search", searchInput.trim());
      else next.delete("search");
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, searchInput, searchParams, setSearchParams]);

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(Math.max(1, nextPage)));
    setSearchParams(next);
  };

  const setSort = (nextSort: TSort, nextDirection: SortDirection) => {
    const next = new URLSearchParams(searchParams);
    next.set("sort", nextSort);
    next.set("direction", nextDirection);
    next.set("page", "1");
    setSearchParams(next);
  };

  return {
    baseParams: useMemo(
      () => ({ page, ...(search ? { search } : {}) }),
      [page, search],
    ),
    direction,
    page,
    search,
    searchInput,
    setPage,
    setSearchInput,
    setSort,
    sort,
    params: useMemo(
      () => ({ direction, page, ...(search ? { search } : {}), sort }),
      [direction, page, search, sort],
    ),
  };
}
