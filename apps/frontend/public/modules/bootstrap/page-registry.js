const PAGE_REGISTRY = {
  dashboard: {
    path: "/genel-bakis",
    title: "Genel Bakış",
    description: "Yönetici görünümü, proje ilerleme özeti ve dikkat isteyen başlıklar.",
  },
  projects: {
    path: "/operasyon-merkezi",
    title: "Operasyon Merkezi",
    description: "Projeler, iş akışları, kullanıcılar ve audit süreçlerini tek merkezden yönet.",
  },
  "user-workspace": {
    path: "/kullanici-is-ekrani",
    title: "Kullanıcı İş Ekranı",
    description: "Seçilen personele ait işleri görüntüle, tamamla ve bir sonraki adıma devret.",
  },
  "workflow-builder": {
    path: "/tarama-ve-is-akisi",
    title: "Tarama ve İş Akışı",
    description: "Solid klasörlerini tara, parça listesi üret ve operasyon akışına hazırla.",
  },
  "erp-center": {
    path: "/erp-merkezi",
    title: "ERP Merkezi",
    description: "İş emirlerini, satır detaylarını ve operasyon başlangıç hazırlığını incele.",
  },
  "process-guide": {
    path: "/bilgi/surec-rehberi",
    title: "Bilgi ve Süreç Rehberi",
    description: "Tarama, kural, operasyon ve yönetici akışlarının tamamını tek rehberde izle.",
  },
  "rule-file-types": {
    path: "/kurallar/dosya-tipleri",
    title: "Dosya Tipi Kuralları",
    description: "Uzantı bazlı varsayılan süreç ve hizmet kararlarını yönet.",
  },
  "rule-keywords": {
    path: "/kurallar/keyword",
    title: "Keyword Kuralları",
    description: "Anahtar kelimelerle süreç ve hizmet sınıflandırmasını güçlendir.",
  },
  "rule-file-names": {
    path: "/kurallar/dosya-adi",
    title: "Dosya Adı Kuralları",
    description: "Önek, sonek, desen ve dönüşüm bazlı isim çıkarım kurallarını yönet.",
  },
  "rule-overrides": {
    path: "/kurallar/override",
    title: "Parça Override Kuralları",
    description: "Belirli parça kodu veya dosyaya özel zorlayıcı yönlendirmeler tanımla.",
  },
  "open-jobs-monitor": {
    path: "/operasyon/acik-isler",
    title: "Açık İş Takibi",
    description: "Bekleyen, ayrışan veya elle müdahale bekleyen işleri izle.",
  },
  "audit-center": {
    path: "/operasyon/audit",
    title: "Audit Merkezi",
    description: "Değişiklik, devir ve düzeltme kayıtlarını merkezi olarak incele.",
  },
  "reports-center": {
    path: "/operasyon/raporlar",
    title: "Rapor Merkezi",
    description: "Excel, CSV ve PDF çıktılarını tek merkezden yönet.",
  },
  "team-center": {
    path: "/yonetim/ekip",
    title: "Ekip ve Roller",
    description: "Departman, rol ve sorumluluk yapılarını yönetmek için ayrılmış alan.",
  },
  "settings-center": {
    path: "/yonetim/ayarlar",
    title: "Ayarlar",
    description: "Sistem davranışı, varsayılanlar ve yönetsel tercihler.",
  },
  "data-center": {
    path: "/yonetim/veri",
    title: "Veri Yönetimi",
    description: "Toplu düzeltme, arşivleme ve veri bakım araçları için ayrılmış alan.",
  },
  "approval-center": {
    path: "/yonetim/onay-kuyrugu",
    title: "Onay Kuyruğu",
    description: "Yönetici kararı gerektiren operasyon ve eşleşmeleri sırala.",
  },
  "integration-center": {
    path: "/yonetim/entegrasyonlar",
    title: "Entegrasyonlar",
    description: "ERP, raporlama ve dış servis bağlantılarını yönetmek için ayrılmış alan.",
  },
};

const PAGE_PATH_LOOKUP = Object.entries(PAGE_REGISTRY).reduce((accumulator, [pageName, config]) => {
  accumulator[config.path] = pageName;
  return accumulator;
}, {});

const PAGE_HASH_LOOKUP = Object.entries(PAGE_REGISTRY).reduce((accumulator, [pageName, config]) => {
  accumulator[`#${config.path}`] = pageName;
  return accumulator;
}, {});
