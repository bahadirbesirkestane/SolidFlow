# SolidDosyaOkuma

SolidWorks dosya ve klasor bilgisinden operasyonel kararlar, workflow ve raporlama ureten uygulama.

Bu repo artik yeni frontend uygulamasi ve tek backend omurgasi ile ilerler:

- `apps/backend/src`
- `apps/frontend/app`
- `data`
- `docs`

## Guncel Mimari Durum

### Backend

Backend `Node.js` uzerinde calisir ve clean architecture hedefiyle su katmanlara ayrilir:

- `domain`
- `application`
- `infrastructure`
- `presentation`

Backend hem API endpointlerini hem de frontend statik servis katmanini sunar.

### Frontend

Frontend ana uygulama olarak:

- `apps/frontend/app`
  - yeni `React + Vite + TypeScript` uygulamasi
  - tum aktif ekranlar ve kalici gelistirme burada yapilir

- `apps/frontend/public`
  - arsivlenen legacy kaynaklar
  - aktif uygulama render zincirinin parcasi degildir

Yeni frontend backend tarafindan `/app` altinda servis edilmek uzere tasarlanmistir.
Build alinmadiysa backend `/` ve sayfa route'lari `503` ile yeni frontend build'inin eksik oldugunu bildirir.

Route sahipligi su sekilde netlestirilmistir:

- `/`
  - build varsa yeni shell'e yonlenir
- `/app`
  - yeni React shell
- eski route'lar
  - uygun yeni `/app/...` karsiligina yonlendirilir

Yeni shell runtime durumu icin:

- `GET /api/system/frontend-shell`

endpoint'i kullanilir. Bu endpoint yeni frontend icin `data / meta / error` shape gecisinin referans cevabidir.

## Repo Yapisi

- `apps/backend/src`
  - use-case, domain servisleri, repository implementasyonlari ve HTTP sunucu
- `apps/frontend/app`
  - yeni React frontend
- `apps/frontend/public`
  - aktif olmayan legacy kaynak arsivi
- `data`
  - SQLite ve seed/config dosyalari
- `docs/architecture`
  - mimari karar kayitlari
- `docs/migration`
  - migration checklist ve gecis rehberleri

## Gelistirme Kurali

Bu repo icin birincil standart:

- `PROJE_KURALLARI_VE_AGENT_MODU.md`

Yeni frontend gelistirmeleri legacy shell icine eklenmez.
Yeni sayfa, route ve UI primitive'leri yalniz `apps/frontend/app` icinde gelistirilir.

## Calistirma

### Backend + yeni shell

```powershell
npm start
```

Ardindan:

- ana uygulama: `http://127.0.0.1:3000/`
- workflow builder: `http://127.0.0.1:3000/app/workflow-builder`

### Yeni React frontend gelistirme

Kurulum:

```powershell
npm run frontend:install
```

Gelisim sunucusu:

```powershell
npm run frontend:dev
```

Build:

```powershell
npm run frontend:build
```

Typecheck:

```powershell
npm run frontend:typecheck
```

Lint:

```powershell
npm run frontend:lint
```

Backend acikken ve frontend build alindiginda yeni shell su rotadan acilir:

- `http://127.0.0.1:3000/app`

Tasinmis eski legacy route'lar artik yeni shell'e yonlendirilir:

- `/genel-bakis` -> `/app/dashboard`
- `/operasyon-merkezi` -> `/app/operations-center`
- `/kullanici-is-ekrani` -> `/app/user-workspace`
- `/erp-merkezi` -> `/app/erp-center`
- `/tarama-ve-is-akisi` -> `/app/workflow-builder`
- `/kurallar/*` -> `/app/rules`

## Root Scriptler

- `npm start`
- `npm run start:backend`
- `npm run test:backend`
- `npm run frontend:install`
- `npm run frontend:dev`
- `npm run frontend:build`
- `npm run frontend:typecheck`
- `npm run frontend:lint`

## Test ve Kalite

Asgari kalite kapilari:

- backend testleri
- frontend typecheck
- frontend build
- frontend lint

Yeni mimaride bir ekran tamamlanmis sayilmaz:

- typed route config'e baglanmadan
- empty/loading/error state eklenmeden
- responsive kontrol yapilmadan
- legacy render yolu temizlenmeden

## Ilgili Belgeler

- `PROJE_KURALLARI_VE_AGENT_MODU.md`
- `docs/architecture/ADR-0001-frontend-reset.md`
- `docs/migration/frontend-migration-checklist.md`
- `apps/frontend/README.md`
- `apps/backend/README.md`
