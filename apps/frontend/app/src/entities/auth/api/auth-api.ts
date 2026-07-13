import { apiRequest } from "@/shared/api/client";

export type AuthRole = "admin" | "manager" | "worker";

export type AuthUser = {
  id: string;
  departmentId: string;
  departmentName?: string;
  fullName: string;
  email?: string;
  username: string;
  role: AuthRole;
  isActive: boolean;
  lastLoginAt?: string | null;
};

export function login(payload: { login: string; password: string }) {
  return apiRequest<{ user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiRequest<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export function getCurrentAuthUser() {
  return apiRequest<AuthUser>("/api/auth/me");
}
