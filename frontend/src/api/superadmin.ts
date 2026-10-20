import { apiClient } from "@/api/client";
import type {
  AdminListPage,
  AdminListParams,
  PlatformAdmin,
  PlatformAdminDetail,
  SuperAdminStats,
} from "@/features/superadmin/types";

interface LaravelResourcePagination<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    next: string | null;
    prev: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    links: Array<{ active: boolean; label: string; url: string | null }>;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}

function unwrapPagination(
  response: LaravelResourcePagination<PlatformAdmin>,
): AdminListPage {
  return {
    current_page: response.meta.current_page,
    data: response.data,
    last_page: response.meta.last_page,
    per_page: response.meta.per_page,
    total: response.meta.total,
  };
}

export async function getStats(): Promise<SuperAdminStats> {
  const response = await apiClient.get<SuperAdminStats>("/api/superadmin/stats");
  return response.data;
}

export async function listAdmins(
  params: AdminListParams,
): Promise<AdminListPage> {
  const response = await apiClient.get<LaravelResourcePagination<PlatformAdmin>>(
    "/api/superadmin/admins",
    { params },
  );
  return unwrapPagination(response.data);
}

export async function getAdmin(id: number): Promise<PlatformAdminDetail> {
  const response = await apiClient.get<{ data: PlatformAdminDetail }>(
    `/api/superadmin/admins/${id}`,
  );
  return response.data.data;
}

export async function setApproval(
  id: number,
  isApproved: boolean,
): Promise<PlatformAdmin> {
  const response = await apiClient.patch<{ data: PlatformAdmin }>(
    `/api/superadmin/admins/${id}`,
    { is_approved: isApproved },
  );
  return response.data.data;
}
