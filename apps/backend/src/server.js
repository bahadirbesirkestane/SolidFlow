const path = require("path");
const { buildApplication } = require("./bootstrap");
const { createAppConfig } = require("./config/app-config");

const rootPath = path.join(__dirname, "..", "..", "..");
const appConfig = createAppConfig({ rootPath });
const { server, defaultScanDir } = buildApplication(rootPath, appConfig);
const { host, port } = appConfig.server;

server.listen(port, host, () => {
  console.log(`Sunucu calisiyor: http://${host}:${port}`);
  console.log(`Varsayilan tarama klasoru: ${defaultScanDir}`);
  console.log(`Frontend yayin klasoru: ${appConfig.paths.publicDir}`);
});
