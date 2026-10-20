import { useSearchParams } from "react-router-dom";
import { usePaginatedListUrlState } from "@/lib/usePaginatedListUrlState";
import type { AdminApprovalStatus, AdminListParams } from "@/features/superadmin/types";

const pageSizes = [10, 20, 50, 100] as const;

function isPageSize(value: string | null): value is `${(typeof pageSizes)[number]}` {
  return value !== null && pageSizes.some((size) => String(size) === value);
}

function isStatus(value: string | null): value is AdminApprovalStatus {
  return value === "approved" || value === "pending";
}

export function useAdminListUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get("status");
  const shared = usePaginatedListUrlState<"name">({
    defaultSort: "name",
    isSort: (value): value is "name" => value === "name",
  });
  const status = isStatus(rawStatus) ? rawStatus : undefined;
  const perPage = isPageSize(searchParams.get("per_page"))
    ? Number(searchParams.get("per_page"))
    : 20;

  const setStatus = (nextStatus: AdminApprovalStatus | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (nextStatus) next.set("status", nextStatus);
    else next.delete("status");
    next.set("page", "1");
    setSearchParams(next);
  };

  const setPerPage = (nextPerPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPerPage === 20) next.delete("per_page");
    else next.set("per_page", String(nextPerPage));
    next.set("page", "1");
    setSearchParams(next);
  };

  const params: AdminListParams = {
    ...shared.baseParams,
    per_page: perPage,
    ...(status ? { status } : {}),
  };

  return {
    ...shared,
    params,
    perPage,
    setPerPage,
    setStatus,
    status,
  };
}
