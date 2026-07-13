window.APP_PAGE_CONFIG = [
  {
    name: "workflow-builder",
    path: "/legacy/tarama-ve-is-akisi",
    title: "Tarama ve Is Akisi",
    description: "Solid klasorlerini tara, parca listesi uret ve operasyon akisina hazirla.",
    nav: {
      section: "Tarama ve Kural Motoru",
      label: "Tarama ve Is Akisi",
      description: "Klasor analizi ve otomatik akis hazirligi",
      icon: "<>",
    },
    shortcuts: true,
  },
  {
    name: "open-jobs-monitor",
    path: "/legacy/operasyon/acik-isler",
    title: "Acik Is Takibi",
    description: "Bekleyen, ayrisan veya elle mudahale bekleyen isleri izle.",
    nav: {
      section: "Izleme ve Raporlama",
      label: "Acik Is Takibi",
      description: "Bekleyen ve mudahale isteyen kayitlar",
      icon: "..",
    },
  },
  {
    name: "audit-center",
    path: "/legacy/operasyon/audit",
    title: "Audit Merkezi",
    description: "Degisiklik, devir ve duzeltme kayitlarini merkezi olarak incele.",
    nav: {
      section: "Izleme ve Raporlama",
      label: "Audit Merkezi",
      description: "Degisiklik gecmisi ve akis izleme",
      icon: "@@",
    },
  },
  {
    name: "reports-center",
    path: "/legacy/operasyon/raporlar",
    title: "Rapor Merkezi",
    description: "Excel, CSV ve PDF ciktilarini tek merkezden yonet.",
    nav: {
      section: "Izleme ve Raporlama",
      label: "Rapor Merkezi",
      description: "Excel, CSV ve PDF cikti alani",
      icon: "++",
    },
  },
  {
    name: "process-guide",
    path: "/legacy/bilgi/surec-rehberi",
    title: "Surec Rehberi",
    description: "Tarama, kural, operasyon ve yonetici akislarini tek rehberde izle.",
    nav: {
      section: "Izleme ve Raporlama",
      label: "Surec Rehberi",
      description: "Sistem mantigi ve sonraki adimlar",
      icon: "??",
    },
  },
  {
    name: "team-center",
    path: "/legacy/yonetim/ekip",
    title: "Ekip ve Roller",
    description: "Departman, rol ve sorumluluk yapilarini yonetmek icin ayrilmis alan.",
  },
  {
    name: "settings-center",
    path: "/legacy/yonetim/ayarlar",
    title: "Ayarlar",
    description: "Sistem davranisi, varsayilanlar ve yonetsel tercihler.",
  },
  {
    name: "data-center",
    path: "/legacy/yonetim/veri",
    title: "Veri Yonetimi",
    description: "Toplu duzeltme, arsivleme ve veri bakim araclari icin ayrilmis alan.",
  },
  {
    name: "approval-center",
    path: "/legacy/yonetim/onay-kuyrugu",
    title: "Onay Kuyrugu",
    description: "Yonetici karari gerektiren operasyon ve eslesmeleri sirala.",
  },
  {
    name: "integration-center",
    path: "/legacy/yonetim/entegrasyonlar",
    title: "Entegrasyonlar",
    description: "ERP, raporlama ve dis servis baglantilarini yonetmek icin ayrilmis alan.",
  },
];

(function buildPageConfigRuntime() {
  const pageConfig = Array.isArray(window.APP_PAGE_CONFIG) ? window.APP_PAGE_CONFIG : [];

  window.APP_PAGE_REGISTRY = Object.fromEntries(pageConfig.map((entry) => [entry.name, entry]));
  window.APP_PAGE_RENDER_ORDER = pageConfig.map((entry) => entry.name);
  window.APP_PAGE_PATH_LOOKUP = Object.fromEntries(pageConfig.map((entry) => [entry.path, entry.name]));
  window.APP_PAGE_HASH_LOOKUP = Object.fromEntries(pageConfig.map((entry) => [`#${entry.path}`, entry.name]));
  window.APP_NAV_SECTIONS = pageConfig.reduce((sections, entry) => {
    if (!entry.nav?.section) {
      return sections;
    }

    const section = sections.find((item) => item.label === entry.nav.section);
    if (section) {
      section.items.push(entry);
      return sections;
    }

    sections.push({
      label: entry.nav.section,
      items: [entry],
    });
    return sections;
  }, []);
}());
