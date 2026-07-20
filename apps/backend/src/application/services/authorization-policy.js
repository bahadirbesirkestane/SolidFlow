const { AUTH_ROLES } = require("../../domain/constants/auth-roles");
const { AppError } = require("../../shared/app-error");

const ADMIN_ONLY_PREFIXES = [
  "/api/config/",
];

function authorizeRequest({ method, pathname, auth }) {
  if (isPublicRoute(method, pathname)) {
    return;
  }

  if (!auth?.user) {
    throw new AppError("Bu islem icin giris yapmaniz gerekiyor.", {
      code: "AUTH_REQUIRED",
      statusCode: 401,
    });
  }

  const allowedRoles = resolveAllowedRoles(method, pathname);
  if (allowedRoles.length > 0 && !allowedRoles.includes(auth.user.role)) {
    throw new AppError("Bu islem icin yetkiniz bulunmuyor.", {
      code: "FORBIDDEN",
      statusCode: 403,
      details: {
        role: auth.user.role,
        pathname,
      },
    });
  }
}

function isPublicRoute(method, pathname) {
  if (pathname === "/api/system/frontend-shell" && method === "GET") {
    return true;
  }

  if (pathname === "/api/auth/login" && method === "POST") {
    return true;
  }

  if (pathname === "/api/auth/logout" && method === "POST") {
    return true;
  }

  if (pathname === "/app-config.js") {
    return true;
  }

  return false;
}

function resolveAllowedRoles(method, pathname) {
  if (pathname === "/api/auth/me") {
    return [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER, AUTH_ROLES.WORKER];
  }

  if (ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return [AUTH_ROLES.ADMIN];
  }

  if (pathname === "/api/operations/users" && method === "GET") {
    return [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER, AUTH_ROLES.WORKER];
  }

  if (pathname === "/api/operations/users" || pathname.startsWith("/api/operations/users/")) {
    return [AUTH_ROLES.ADMIN];
  }

  if (pathname === "/api/operations/open-jobs") {
    return [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER];
  }

  if (pathname.startsWith("/api/manual-workboards")) {
    return method === "GET"
      ? [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER, AUTH_ROLES.WORKER]
      : [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER];
  }

  if (pathname === "/api/operations/projects" && method === "POST") {
    return [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER];
  }

  if (pathname === "/api/operations/projects/bulk-work-orders" && method === "POST") {
    return [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER];
  }

  if (pathname.startsWith("/api/operations/projects/") && method === "DELETE") {
    return [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER];
  }

  if (pathname === "/api/operations/workflow-templates") {
    return [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER];
  }

  if (pathname.startsWith("/api/operations/workflow-instances/") && method === "DELETE") {
    return [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER];
  }

  if (pathname.startsWith("/api/operations/workflow-instance-steps/") && method === "PATCH") {
    return [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER, AUTH_ROLES.WORKER];
  }

  return [AUTH_ROLES.ADMIN, AUTH_ROLES.MANAGER, AUTH_ROLES.WORKER];
}

module.exports = {
  authorizeRequest,
};
