import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  QuizListParams,
  QuizSort,
  SortDirection,
} from "@/features/quizzes/types";

function positivePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function validSort(value: string | null): QuizSort {
  return value === "created_at" ? "created_at" : "title";
}

function validDirection(value: string | null): SortDirection {
  return value === "desc" ? "desc" : "asc";
}

export function useQuizListUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positivePage(searchParams.get("page"));
  const search = searchParams.get("search") ?? "";
  const sort = validSort(searchParams.get("sort"));
  const direction = validDirection(searchParams.get("direction"));
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    // Browser back/forward can change the URL without changing the controlled input.
    // oxlint-disable-next-line react/set-state-in-effect
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (searchInput === search) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchInput.trim()) {
        next.set("search", searchInput.trim());
      } else {
        next.delete("search");
      }
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, searchInput, searchParams, setSearchParams]);

  const params = useMemo<QuizListParams>(
    () => ({
      direction,
      page,
      ...(search ? { search } : {}),
      sort,
    }),
    [direction, page, search, sort],
  );

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(Math.max(1, nextPage)));
    setSearchParams(next);
  };

  const setSort = (nextSort: QuizSort, nextDirection: SortDirection) => {
    const next = new URLSearchParams(searchParams);
    next.set("sort", nextSort);
    next.set("direction", nextDirection);
    next.set("page", "1");
    setSearchParams(next);
  };

  return {
    direction,
    page,
    params,
    search,
    searchInput,
    setPage,
    setSearchInput,
    setSort,
    sort,
  };
}
