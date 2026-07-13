import { useQuery } from "@tanstack/react-query";
import { ApiRequestError } from "@/shared/api/client";
import { getCurrentAuthUser } from "@/entities/auth/api/auth-api";

export function useAuthSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: getCurrentAuthUser,
    retry(failureCount, error) {
      if (error instanceof ApiRequestError && error.statusCode === 401) {
        return false;
      }

      return failureCount < 1;
    },
  });
}
