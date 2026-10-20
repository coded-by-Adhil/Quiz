import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getAdmin, getStats, listAdmins, setApproval } from "@/api/superadmin";
import type {
  AdminListParams,
  PlatformAdmin,
  PlatformAdminDetail,
} from "@/features/superadmin/types";

export const superAdminKeys = {
  admins: (params: AdminListParams) => ["superadmin", "admins", params] as const,
  admin: (id: number) => ["superadmin", "admins", id] as const,
  adminsRoot: ["superadmin", "admins"] as const,
  stats: ["superadmin", "stats"] as const,
};

export function useSuperAdminStatsQuery() {
  return useQuery({
    queryKey: superAdminKeys.stats,
    queryFn: getStats,
  });
}

export function usePlatformAdminsQuery(params: AdminListParams) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryKey: superAdminKeys.admins(params),
    queryFn: () => listAdmins(params),
  });
}

export function usePlatformAdminQuery(id: number | null) {
  return useQuery({
    enabled: id !== null,
    queryKey: id === null ? superAdminKeys.adminsRoot : superAdminKeys.admin(id),
    queryFn: () => getAdmin(id as number),
  });
}

export function useSetAdminApprovalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isApproved }: { id: number; isApproved: boolean }) =>
      setApproval(id, isApproved),
    onSuccess: async (admin: PlatformAdmin) => {
      queryClient.setQueryData<PlatformAdminDetail | undefined>(superAdminKeys.admin(admin.id), (current) => {
        if (!current) return current;
        return { ...current, ...admin };
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: superAdminKeys.stats }),
        queryClient.invalidateQueries({ queryKey: superAdminKeys.adminsRoot }),
      ]);
    },
  });
}
