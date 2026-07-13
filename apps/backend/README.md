# Backend

Bu klasor uygulamanin backend tarafini icerir.

## Sorumluluklar

- HTTP API sunmak
- kural motoru ve workflow use-case'lerini calistirmak
- SQLite ve JSON veri katmanini yonetmek
- raporlama servislerini calistirmak
- yeni frontend build ciktilarini servis etmek

## Katmanlar

- `src/domain`
- `src/application`
- `src/infrastructure`
- `src/presentation`

## Katman Kurallari

1. `domain` hicbir teknik detay bilmez.
2. `application` use-case ve orkestrasyon katmanidir.
3. `infrastructure` repository, adapter ve dis sistem implementasyonlarini tasir.
4. `presentation` yalniz HTTP adaptorlugudur.

## Frontend Sunum Siniri

Backend yeni frontend uygulamasini servis eder:

- `/`
  - build hazirsa yeni React shell'e yonlenir
- `/app`
  - yeni React shell build ciktilari
- eski route'lar
  - uygun yeni `/app/...` karsiligina yonlendirilir

Yeni shell kontrat baslangici icin:

- `GET /api/system/frontend-shell`

endpoint'i `data / meta / error` shape ile cevap verir.

Route sahipligi:

- `/genel-bakis` -> `/app/dashboard`
- `/operasyon-merkezi` -> `/app/operations-center`
- `/kullanici-is-ekrani` -> `/app/user-workspace`
- `/erp-merkezi` -> `/app/erp-center`
- `/kurallar/*` -> `/app/rules`
- `/tarama-ve-is-akisi` -> `/app/workflow-builder`

`/app` build'i yoksa backend kok route'u `503` doner.

## Test

Backend testleri root dizinden:

```powershell
npm run test:backend
```
