const { spawnSync } = require("node:child_process");
const path = require("node:path");

const scriptName = process.argv[2];

if (!scriptName) {
  console.error("Frontend komut adi gerekli. Ornek: node scripts/run-frontend-command.js build");
  process.exit(1);
}

const frontendAppDir = path.join(__dirname, "..", "apps", "frontend", "app");
const isWindows = process.platform === "win32";
const commandShell = process.env.ComSpec || "cmd.exe";

const commandMap = {
  build: {
    executable: path.join(frontendAppDir, "node_modules", ".bin", isWindows ? "vite.cmd" : "vite"),
    args: ["build", "--config", "vite.config.mjs"],
  },
  dev: {
    executable: path.join(frontendAppDir, "node_modules", ".bin", isWindows ? "vite.cmd" : "vite"),
    args: ["--config", "vite.config.mjs"],
  },
  lint: {
    executable: path.join(frontendAppDir, "node_modules", ".bin", isWindows ? "eslint.cmd" : "eslint"),
    args: ["."],
  },
  typecheck: {
    executable: path.join(frontendAppDir, "node_modules", ".bin", isWindows ? "tsc.cmd" : "tsc"),
    args: ["--noEmit"],
  },
  install: {
    executable: isWindows ? commandShell : "npm",
    args: isWindows ? ["/d", "/s", "/c", "npm.cmd", "install"] : ["install"],
  },
};

const commandConfig = commandMap[scriptName];

if (!commandConfig) {
  console.error(`Desteklenmeyen frontend komutu: ${scriptName}`);
  process.exit(1);
}

const executable = isWindows && commandConfig.executable.endsWith(".cmd")
  ? commandShell
  : commandConfig.executable;

const args = isWindows && commandConfig.executable.endsWith(".cmd")
  ? []
  : commandConfig.args;

const result = isWindows && commandConfig.executable.endsWith(".cmd")
  ? spawnSync(`"${commandConfig.executable}" ${commandConfig.args.join(" ")}`, {
      cwd: frontendAppDir,
      stdio: "inherit",
      shell: true,
    })
  : spawnSync(executable, args, {
      cwd: frontendAppDir,
      stdio: "inherit",
      shell: false,
    });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
