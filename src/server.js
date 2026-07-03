const path = require("path");
const { buildApplication } = require("./bootstrap");

const PORT = process.env.PORT || 3000;
const HOST = "127.0.0.1";
const rootPath = path.join(__dirname, "..");
const { server, defaultScanDir } = buildApplication(rootPath);

server.listen(PORT, HOST, () => {
  console.log(`Sunucu calisiyor: http://${HOST}:${PORT}`);
  console.log(`Varsayilan tarama klasoru: ${defaultScanDir}`);
});
