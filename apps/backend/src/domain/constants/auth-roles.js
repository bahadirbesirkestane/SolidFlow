const AUTH_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  WORKER: "worker",
};

const ALL_AUTH_ROLES = Object.values(AUTH_ROLES);

module.exports = {
  AUTH_ROLES,
  ALL_AUTH_ROLES,
};
