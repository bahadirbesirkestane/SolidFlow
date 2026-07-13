import { useQuery } from "@tanstack/react-query";
import { getFrontendShellConfig } from "@/entities/system/api/frontend-shell-api";

export function useFrontendShellConfig() {
  return useQuery({
    queryKey: ["system", "frontend-shell"],
    queryFn: getFrontendShellConfig,
    staleTime: 60_000,
  });
}
