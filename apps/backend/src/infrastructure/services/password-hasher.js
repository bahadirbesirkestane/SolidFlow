const crypto = require("crypto");

class PasswordHasher {
  hashPassword(plainTextPassword) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(String(plainTextPassword), salt, 64).toString("hex");
    return `${salt}:${hash}`;
  }

  verifyPassword(plainTextPassword, storedHash) {
    const [salt, expectedHash] = String(storedHash || "").split(":");
    if (!salt || !expectedHash) {
      return false;
    }

    const actualHash = crypto.scryptSync(String(plainTextPassword), salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(actualHash, "hex"));
  }
}

module.exports = {
  PasswordHasher,
};
