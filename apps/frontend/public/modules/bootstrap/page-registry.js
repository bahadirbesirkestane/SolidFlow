const PAGE_REGISTRY = {
  dashboard: { hash: "#/genel-bakis" },
  projects: { hash: "#/operasyon-merkezi" },
  "user-workspace": { hash: "#/kullanici-is-ekrani" },
  "workflow-builder": { hash: "#/tarama-ve-is-akisi" },
  "erp-center": { hash: "#/erp-merkezi" },
  "rule-file-types": { hash: "#/kurallar/dosya-tipleri" },
  "rule-keywords": { hash: "#/kurallar/keyword" },
  "rule-file-names": { hash: "#/kurallar/dosya-adi" },
  "rule-overrides": { hash: "#/kurallar/override" },
  "open-jobs-monitor": { hash: "#/operasyon/acik-isler" },
  "audit-center": { hash: "#/operasyon/audit" },
  "reports-center": { hash: "#/operasyon/raporlar" },
  "team-center": { hash: "#/yonetim/ekip" },
  "settings-center": { hash: "#/yonetim/ayarlar" },
  "data-center": { hash: "#/yonetim/veri" },
  "approval-center": { hash: "#/yonetim/onay-kuyrugu" },
  "integration-center": { hash: "#/yonetim/entegrasyonlar" },
};

const PAGE_HASH_LOOKUP = Object.entries(PAGE_REGISTRY).reduce((accumulator, [pageName, config]) => {
  accumulator[config.hash] = pageName;
  return accumulator;
}, {});
