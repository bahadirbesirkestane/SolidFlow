const crypto = require("crypto");
const { randomUUID } = require("crypto");
const { nowIso } = require("../../shared/time-utils");

class SqliteAuthSessionRepository {
  constructor(db) {
    this.db = db;
  }

  async createSession({ userId, ipAddress, userAgent, expiresAt }) {
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = hashSessionToken(rawToken);
    const id = `session-${randomUUID()}`;
    const timestamp = nowIso();

    this.db.prepare(`
      INSERT INTO auth_sessions (
        id,
        user_id,
        token_hash,
        ip_address,
        user_agent,
        expires_at,
        created_at,
        last_seen_at,
        revoked_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      tokenHash,
      ipAddress || "",
      userAgent || "",
      expiresAt,
      timestamp,
      timestamp,
      null,
    );

    return {
      id,
      token: rawToken,
      expiresAt,
    };
  }

  async getActiveSessionWithUser(token) {
    const tokenHash = hashSessionToken(token);
    const now = nowIso();
    const row = this.db.prepare(`
      SELECT
        s.id AS session_id,
        s.user_id,
        s.expires_at,
        s.last_seen_at,
        u.id,
        u.department_id,
        u.full_name,
        u.email,
        u.username,
        u.role,
        u.is_active,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        d.name AS department_name
      FROM auth_sessions s
      INNER JOIN users u ON u.id = s.user_id
      LEFT JOIN departments d ON d.id = u.department_id
      WHERE s.token_hash = ?
        AND s.revoked_at IS NULL
        AND s.expires_at > ?
      LIMIT 1
    `).get(tokenHash, now);

    if (!row || !row.id || !row.is_active) {
      return null;
    }

    this.db.prepare(`
      UPDATE auth_sessions
      SET last_seen_at = ?
      WHERE id = ?
    `).run(now, row.session_id);

    return {
      session: {
        id: row.session_id,
        userId: row.user_id,
        expiresAt: row.expires_at,
        lastSeenAt: row.last_seen_at,
      },
      user: {
        id: row.id,
        departmentId: row.department_id,
        departmentName: row.department_name || "",
        fullName: row.full_name,
        email: row.email || "",
        username: row.username || "",
        role: row.role || "worker",
        isActive: Boolean(row.is_active),
        lastLoginAt: row.last_login_at || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    };
  }

  async revokeSession(token) {
    const tokenHash = hashSessionToken(token);
    this.db.prepare(`
      UPDATE auth_sessions
      SET revoked_at = ?
      WHERE token_hash = ? AND revoked_at IS NULL
    `).run(nowIso(), tokenHash);
  }
}

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

module.exports = {
  SqliteAuthSessionRepository,
};
