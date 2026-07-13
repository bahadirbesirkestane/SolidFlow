# Frontend

Bu klasorde aktif frontend uygulamasi `apps/frontend/app` altindadir.

## 1. Yeni uygulama

- yol: `apps/frontend/app`
- teknoloji: `React + Vite + TypeScript`
- durum: ana gelistirme hedefi

## 2. Legacy kaynaklar

- yol: `apps/frontend/public`
- teknoloji: vanilla JS + static template string yapisi
- durum: arsiv

Bu alan aktif render zincirine dahil degildir.
Yeni gelistirme veya yeni route sahipligi burada yapilmaz.

## Yeni Frontend Katmanlari

`apps/frontend/app/src` altinda su yapinin korunmasi beklenir:

- `app`
- `pages`
- `widgets`
- `features`
- `entities`
- `shared`

## Yasakli Paternler

Yeni frontend icinde su yapilar kullanilmaz:

- `window.APP_PAGE_TEMPLATES`
- global template registry
- `window.*Refs`
- string tabanli sayfa registry
- kontrolsuz `innerHTML` render

## Yeni Shell Omurgasi

Yeni shell su merkezlerle calisir:

- typed route config
- ortak app provider katmani
- tek API client giris noktasi
- runtime shell config endpointi: `GET /api/system/frontend-shell`

## Route Sahipligi

- ana uygulama: `/app`
- kok route: `/` -> `/app/operations-center`
- eski bookmark ve route'lar uygun yeni `/app/...` karsiligina yonlendirilir

## Komutlar

Kurulum:

```powershell
npm run frontend:install
```

Gelisim:

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
