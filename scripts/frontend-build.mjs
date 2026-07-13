import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const frontendAppDir = path.join(rootDir, "apps", "frontend", "app");
const viteModuleUrl = pathToFileURL(
  path.join(frontendAppDir, "node_modules", "vite", "dist", "node", "index.js"),
).href;
const viteConfigUrl = pathToFileURL(path.join(frontendAppDir, "vite.config.mjs")).href;

process.chdir(frontendAppDir);

const viteModule = await import(viteModuleUrl);
const viteConfigModule = await import(viteConfigUrl);

await viteModule.build({
  configFile: false,
  ...viteConfigModule.default,
});
