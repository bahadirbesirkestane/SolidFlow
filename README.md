# Solid Dosya Okuma

Klasor ve dosya isimlerinden is akisi ureten, dosya tipi kurallari ve parca bazli override mantigi ile yonetilebilen Node.js uygulamasi.

## Proje Yapisi

Proje artik backend ve frontend olarak ayrilmistir:

- `apps/backend/src`: API, domain, application, infrastructure ve presentation katmanlari
- `apps/frontend/public`: tarayici arayuzu
- `data`: SQLite ve seed/config verileri

Backend ile frontend ayni uygulama icinde ancak ayri sorumluluklarda tutulur:

- frontend tarayicida sadece UI ve API cagrilarini yonetir
- backend `http://127.0.0.1:3000` uzerinden hem `/api/*` endpointlerini hem de frontend statik dosyalarini sunar

Backend ic mimarisi clean architecture mantigi ile katmanlara ayrilmistir:

- `apps/backend/src/domain`: saf is kurallari
- `apps/backend/src/application`: use-case katmani
- `apps/backend/src/infrastructure`: dosya sistemi, veritabani ve repository uygulamalari
- `apps/backend/src/presentation`: HTTP sunucu ve API katmani

## Veri Katmani

Uygulama artik birincil veri kaynagi olarak:

- `data/solid-workflow.db`

dosyasini kullanir.

Ilk acilista mevcut JSON dosyalari otomatik migrate edilerek SQLite veritabanina seed edilir.

JSON dosyalari:

- `data/file-type-rules.json`
- `data/keyword-rules.json`
- `data/part-overrides.json`

seed ve yedek amacli korunur.

## Yonetilebilir Alanlar

### 1. Dosya Tipi Kurallari

`data/file-type-rules.json`

Her uzanti icin:

- gorunen ad
- varsayilan surec
- varsayilan hizmet tipi
- aktif/pasif durumu

yonetilebilir.

### 2. Anahtar Kelime Kurallari

`data/keyword-rules.json`

Dosya adina gore daha akilli surec tahmini yapmak icin kullanilir.

### 3. Parca Override

`data/part-overrides.json`

Belirli bir parca kodu veya dosya adi icin manuel surec ve hizmet atamasi yapar.

## Arayuz Sekmeleri

- `Operasyon Merkezi`
- `Is Akisi`
- `Dosya Tipleri`
- `Keyword Kurallari`
- `Parca Kurallari`

### Operasyon Merkezi Neler Sunar

- proje olusturma ve soldan secerek panel acma
- departman bazli kullanici ekleme ve pasife alma
- template'ten workflow ekleme
- klasorden otomatik workflow uretme
- workflow adimlarina ilgili departmandan bir veya birden cok kisiyi otomatik atama
- adim durumu guncelleme, siradaki adima devir, not dusme
- adim silindiginde otomatik `Acik Isler` alanina tasima
- secili proje icin audit kayitlarini sag panelden izleme
- secili proje icin `Excel`, `CSV` ve `PDF` operasyon raporu alma

## Atama Kurallari Altyapisi

`data/assignment-rules.json`

dosyasi ile departman karsiligi olan ifade ve kisaltmalar yonetilebilir.

Ornek:

- `SA` -> `Satin Alma`
- `M` -> `Montaj`
- `DT` -> `Dis Hizmet`

Bu dosya ileride UI uzerinden yonetilebilir hale getirilebilir.

## Raporlama

- Is akisi tablosundaki mevcut filtrelenmis gorunum `CSV Aktar` ile disari alinabilir.
- Tum tarama sonucu `Excel Aktar` ile `.xlsx` olarak indirilebilir.
- Parca override veya kural degisikliginden sonra tarama otomatik yenilenir.

## Calistirma

Uygulamayi dogrudan `public\\index.html` olarak acmayin. Sunucu uzerinden calisir.

1. `BASLAT.bat` dosyasina cift tiklayin
2. veya terminalde:

```powershell
npm start
```

Ardindan:

`http://127.0.0.1:3000`

adresini acin.

## Tek Komutla Calistirma

Kok dizinden:

```powershell
npm start
```

Bu komut:

- backend uygulamasini `apps/backend/src/server.js` uzerinden baslatir
- frontend dosyalarini `apps/frontend/public` klasorunden yayinlar
- boylece proje tek komutta butun olarak ayaga kalkar

## Konfigurasyon

Uygulama backend tarafinda `.env` dosyasi destekler. Ornek degiskenler icin:

- `.env.example`

Kullanilabilecek temel alanlar:

- `APP_HOST`
- `APP_PORT`
- `DEFAULT_SCAN_DIR`
- `DATA_DIR`
- `FRONTEND_PUBLIC_DIR`
- `FRONTEND_API_BASE_URL`

Frontend API adresi artik tek yerden yonetilir:

- backend `GET /app-config.js` endpointi ile runtime config yayinlar
- frontend bu config'i yukleyip tum API isteklerinde ayni `apiBaseUrl` degerini kullanir

## Gelistirme Notlari

- Yeni endpoint eklerken once `application` katmanina use-case ekleyin.
- Yeni veri kaynagi eklerken `infrastructure` katmaninda repository veya adapter olusturun.
- Domain kurallarini `presentation` katmanina tasimayin.

## Operasyonel Workflow Backend

Bu backend ile bir proje icinde bir veya birden fazla sirali is akisi yonetilebilir.

### Temel Mantik

- Her proje birden fazla workflow instance icerebilir.
- Her workflow instance bir template'ten uretilir.
- Her workflow step sirayla ilerler.
- Bir step tamamlandiginda bir sonraki step `ready` olur.
- Toplam proje ilerlemesi tum workflow step'lerinin tamamlanma oranindan hesaplanir.

### Hazir Template'ler

- `template-procurement-flow`
- `template-outsource-part-flow`

### Backend Endpointleri

#### Workflow Template Listele

`GET /api/operations/workflow-templates`

#### Kullanici ve Departmanlari Listele

`GET /api/operations/users`

Donen veri:

- `departments`
- `users`

#### Kullanici Ekle

`POST /api/operations/users`

#### Kullaniciyi Pasife Al

`DELETE /api/operations/users/:userId`

#### Proje Olustur

`POST /api/operations/projects`

Ornek body:

```json
{
  "code": "PRJ-001",
  "name": "Tartim Konveyor Projesi",
  "description": "Ornek operasyon projesi",
  "autoGenerateFromFolder": "C:\\Users\\...\\IN26016_TARTIM KONVOYOR"
}
```

`autoGenerateFromFolder` verilirse sistem klasoru tarar ve uygun workflow instance'larini otomatik olusturur.

#### Projeleri Listele

`GET /api/operations/projects`

#### Proje Dashboard

`GET /api/operations/projects/:projectId`

Donen veri:

- proje bilgisi
- toplu ilerleme yuzdesi
- workflow listesi
- her workflow'un mevcut step'i

#### Projeye Toplu Workflow Ekle

`POST /api/operations/projects/:projectId/workflow-instances`

Ornek body:

```json
{
  "workflows": [
    {
      "templateId": "template-procurement-flow",
      "instanceName": "Motor siparis sureci",
      "itemLabel": "Motor Grubu",
      "itemCount": 3,
      "itemPayload": {
        "partCodes": ["1150", "1152", "1153"]
      },
      "stepAssignments": [
        { "sequenceNo": 1, "assignee": "Ayse" },
        { "sequenceNo": 2, "assignee": "Mehmet" }
      ]
    }
  ]
}
```

#### Aktif Adimi Tamamla ve Sonrakine Devret

`POST /api/operations/workflow-instances/:instanceId/advance`

Ornek body:

```json
{
  "completedBy": "Ayse",
  "note": "Siparis verildi",
  "handoverTo": "Mehmet",
  "nextAssignee": "Mehmet",
  "nextAssigneeIds": ["user-mehmet"]
}
```

#### Workflow'a Yeni Adim Ekle

`POST /api/operations/workflow-instances/:instanceId/steps`

#### Workflow Adimi Guncelle

`PATCH /api/operations/workflow-instance-steps/:stepId`

Guncellenebilir alanlar:

- `name`
- `description`
- `status`
- `assigneeIds`
- `isOptional`
- `note`

#### Workflow Adimini Sil ve Acik Islere Tasima

`DELETE /api/operations/workflow-instance-steps/:stepId`

Silinen adim otomatik olarak `open_jobs` alanina tasinir.

#### Acik Isleri Listele

`GET /api/operations/open-jobs`

#### Proje Audit Kayitlari

`GET /api/operations/projects/:projectId/audit-events`

#### Proje Icin Otomatik Workflow Uret

`POST /api/operations/projects/:projectId/bootstrap-workflows`

Ornek body:

```json
{
  "folderPath": "C:\\Users\\...\\IN26016_TARTIM KONVOYOR"
}
```

### Step Statusleri

- `pending`
- `ready`
- `in_progress`
- `completed`

### Veritabani

Operasyonel workflow tablolari:

- `workflow_templates`
- `workflow_template_steps`
- `departments`
- `users`
- `projects`
- `workflow_instances`
- `workflow_instance_steps`
- `workflow_step_assignees`
- `open_jobs`
- `audit_events`

## Sorun Giderme

`Failed to fetch` hatasi alirsaniz genelde nedenlerden biri sudur:

- Sunucu calismiyordur
- Sayfa `file://` olarak acilmistir
- Tarayicida yanlis adres acilmistir
