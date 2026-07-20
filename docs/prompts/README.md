# Prompt Zinciri

Bu klasor, projeyi yeni `React + Vite + TypeScript` shell ustunde gercek kullanim senaryosuna tasimak icin sira bazli promptlar icerir.

## Kullanim Kurali

1. Promptlar yalniz sira ile kullanilir.
2. Bir adim tam dogrulanmadan sonraki prompt verilmez.
3. Her prompt, implementasyon + test + sonuc raporu ister.
4. Agent bir adim icinde sonraki adimin isini baslatmaz.
5. Her adim sonunda:
   - degisen dosyalar
   - calisan testler
   - calismayan testler veya bilinen riskler
   raporlanir.
6. Ek kurallar her yeni prompt icin gecerlidir:
   - mevcut calisan sistemleri bozma
   - buyuk refactor yapma
   - kullaniciya gorunen metinler Turkce olacak
   - Turkce karakter bozulmasi yapma

## Prompt Sirasi

1. [step-01-app-shell-and-api-contract.md](./step-01-app-shell-and-api-contract.md)
2. [step-02-operations-center-parity.md](./step-02-operations-center-parity.md)
3. [step-03-rules-migration.md](./step-03-rules-migration.md)
4. [step-04-dashboard-user-erp-migration.md](./step-04-dashboard-user-erp-migration.md)
5. [step-05-legacy-retirement-and-routing.md](./step-05-legacy-retirement-and-routing.md)
6. [step-06-final-hardening-and-release-check.md](./step-06-final-hardening-and-release-check.md)
7. [step-07-backend-stabilization-and-auth-foundation.md](./step-07-backend-stabilization-and-auth-foundation.md)
8. [step-08-real-user-management-and-role-based-shell.md](./step-08-real-user-management-and-role-based-shell.md)
9. [step-09-worklist-ui-and-task-detail-panel.md](./step-09-worklist-ui-and-task-detail-panel.md)
10. [step-10-task-actions-history-and-admin-observability.md](./step-10-task-actions-history-and-admin-observability.md)
11. [step-11-centralized-rule-management-and-routing-governance.md](./step-11-centralized-rule-management-and-routing-governance.md)
12. [step-12-fair-scoring-performance-and-production-readiness.md](./step-12-fair-scoring-performance-and-production-readiness.md)
13. [step-13-manual-workboard-foundation.md](./step-13-manual-workboard-foundation.md)
14. [step-14-manual-workboard-management-ui.md](./step-14-manual-workboard-management-ui.md)
15. [step-15-manual-workboard-display-and-hardening.md](./step-15-manual-workboard-display-and-hardening.md)
16. [step-16-file-distribution-and-copy-pipeline.md](./step-16-file-distribution-and-copy-pipeline.md)
17. [step-16-file-distribution-execution-prompt.md](./step-16-file-distribution-execution-prompt.md)

## Uygulama Ilkesi

- Yeni gelistirme `apps/frontend/app` icinde yapilir.
- `apps/frontend/public` aktif gelistirme hedefi degildir.
- Ayni davranis iki farkli yerde kalici olarak tutulmaz.
- Once backend ve auth omurgasi guclendirilir, sonra yeni operasyon kabiliyetleri eklenir.
- Her adim sonunda backend testleri ve ilgili frontend kalite kapilari kosulur.
