import { useQuery } from "@tanstack/react-query";
import { getHealth, getPing } from "@/api/status";

export function usePingQuery() {
  return useQuery({
    queryKey: ["status", "ping"],
    queryFn: getPing,
  });
}

export function useHealthQuery() {
  return useQuery({
    queryKey: ["status", "health"],
    queryFn: getHealth,
  });
}
