# PROJE KURALLARI VE AGENT MODU

Bu belge, `SolidDosyaOkuma` reposu icin tek baglayici teknik gelistirme standardidir.
Amac; projeyi gecici duzeltmelerle buyuten bir kod tabanindan, uzun omurlu ve profesyonel bir urun omurgasina tasimaktir.

Bu standardin odak noktalari:

- clean architecture
- SOLID prensipleri
- katmanli ve sorumlulugu ayrilmis backend
- component tabanli ve testlenebilir frontend
- tek kaynakli UI standardi
- izlenebilir veri akisi ve API kontratlari
- kontrollu migration

Bu belge, yeni gelistirme kararlarinda varsayilan referanstir.
Bu belgenin acikca izin vermedigi hizli cozumler, varsayilan olarak teknik borc kabul edilir.

## 1. Kapsam ve Oncelik

Bu belge su alanlari kapsar:

- repo seviyesi mimari kararlar
- backend katman kurallari
- frontend uygulama mimarisi
- UI ve design system standartlari
- veri akisi ve API kontratlari
- test ve kalite beklentileri
- migration ve legacy sinirlari
- agent calisma modeli

Oncelik sirasi:

1. veri dogrulugu
2. mimari tutarlilik
3. testlenebilirlik
4. kullanilabilir UI
5. yeni ozellik

Yeni ozellik, temel mimariyi zedeleyerek eklenmez.

## 2. Proje Baglami

- Sektor: endustriyel makine uretimi
- Problem alani: SolidWorks dosya ve klasor bilgisinden operasyonel kararlar ve workflow uretimi
- Uygulama tipi: hafif MES / operasyon yonetim sistemi

Sistemin ana gorevleri:

- proje klasorlerini taramak
- dosya ve klasor bilgisinden kural tabanli karar uretmek
- workflow, kullanici, departman, audit ve acik is akisini yonetmek
- operasyon ve raporlama ekranlarini sunmak

## 3. Mimari Vizyon

Bu repo iki farkli uygulama omurgasi icerebilir:

1. `legacy shell`
   - mevcut `apps/frontend/public` tabanli vanilla JS arayuzu
   - sadece tasinmamis ekranlari gecici olarak barindirir
   - route siniri `/legacy` altinda kabul edilir

2. `new architecture shell`
   - `React + Vite + TypeScript` tabanli yeni frontend
   - yeni sayfalar ve kalici gelistirme sadece burada yapilir
   - route siniri `/app` altinda kabul edilir

Hedef durum:

- backend clean architecture ile calisir
- frontend component tabanli ve typed route/config ile calisir
- legacy yapilar kontrollu olarak kaldirilir

## 4. Repo Yapisi ve Sorumluluklar

- `apps/backend/src`
  - backend uygulama katmanlari
- `apps/frontend/public`
  - legacy frontend shell
- `apps/frontend/app`
  - yeni React uygulamasi
- `data`
  - SQLite veritabani ve kontrollu seed/config girdileri
- `docs`
  - ADR, migration checklist ve teknik rehberler

## 5. Zorunlu Genel Ilkeler

1. Ayni sorumluluk iki farkli yerde kalici olarak tutulmaz.
2. Is kurali UI katmanina tasinmaz.
3. Teknik kararlar, sadece "calisiyor" olmasi ile dogrulanmis sayilmaz.
4. Buyuk degisiklikler parcali ve geri alinabilir adimlarla yapilir.
5. Veri akisi, render akisi ve UI davranisi ayri dusunulur.
6. Global mutable state, zorunlu teknik gerekce olmadan kullanilmaz.
7. Yeni kod, eski hatali paternlere uyum saglamak icin yazilmaz; dogru yapinin etrafinda sekillenir.

## 6. Backend Standarti

### 6.1 Katmanlar

- `domain`
  - saf is kurallari
  - entity, value object, domain service, karar motoru
  - HTTP, veritabani, dosya sistemi ve UI bilgisi icermez

- `application`
  - use-case, orkestrasyon, is akisi koordinasyonu
  - domain servisleri ve repository abstractionlari ile calisir
  - teknik detay bilmez

- `infrastructure`
  - SQLite, JSON, dosya sistemi, raporlama, adapter ve repository implementasyonlari
  - teknik entegrasyonlar burada yasar

- `presentation`
  - HTTP request/response, route ve transport adaptorlugu
  - is kurali biriktirmez

### 6.2 Zorunlu Kurallar

1. `domain` katmani `application`, `infrastructure` veya `presentation` katmanlarini import edemez.
2. `application` katmani dogrudan `http`, `fs`, `sqlite` veya `response` objesi ile calisamaz.
3. `presentation` katmaninda karar, siniflandirma veya workflow orkestrasyonu yazilamaz.
4. Repository implementasyonlari sadece `infrastructure` icinde bulunur.
5. HTTP handler icinde is kurali yazmak yasaktir.
6. Bir davranis eklenmeden once bunun `use-case`, `domain service`, `repository` veya `adapter` ihtiyaci netlestirilir.

### 6.3 API Standarti

Legacy endpointler gecici olarak mevcut shape ile calisabilir.
Yeni veya revize edilen endpointler ise su response standardina gore tasarlanir:

- `data`
- `meta`
- `error`

Kurallar:

1. Basarili cevaplarda veri `data` altinda doner.
2. Liste cevaplari `meta` altinda sayfalama veya ozet bilgisi tasiyabilir.
3. Hata cevaplari tutarli bir `error.code`, `error.message`, `error.details` seklinde tanimlanir.
4. UI icin gerekiyorsa ayri `view-model` endpointleri use-case katmani uzerinden uretilir.

### 6.4 Veri ve Kontrat Disiplini

1. SQLite operasyonel gercegin birincil kaynagidir.
2. JSON dosyalari seed, migration girdisi veya yonetilebilir config olarak ele alinir.
3. Veri modeli degisikligi varsa repository, seed, migration ve UI etkisi birlikte kontrol edilir.
4. Bir endpoint frontend icin normalize veri gerektiriyorsa bu donusum `presentation` icinde daginik bicimde degil, `application` seviyesinde cozulur.

## 7. Frontend Standarti

### 7.1 Yetkili Stack

Yeni frontend stack:

- React
- Vite
- TypeScript
- TanStack Query

Bu stack yeni frontend icin varsayilan ve yetkili standarttir.

### 7.2 Yasaklanan Legacy Paternler

Asagidaki paternler yeni gelistirmelerde kullanilamaz:

- `window.APP_PAGE_TEMPLATES`
- `window.APP_PAGE_CONFIG`
- `window.*Refs`
- HTML string'ini JS icinde global registry ile saklamak
- kontrolsuz `innerHTML` tabanli sayfa kurmak
- sayfa state'ini `window` uzerinden tasimak
- ayni sayfa icin iki farkli render kaynagini aktif tutmak

Legacy shell icinde gecici olarak var olabilirler; ancak yeni ekran veya yeni davranis bu paternlerle eklenmez.

### 7.3 Yeni Frontend Klasorleme

`apps/frontend/app/src` en az su katmanlari icermelidir:

- `app`
- `pages`
- `widgets`
- `features`
- `entities`
- `shared`

Yorum:

- `app`
  - router, provider, query client, app shell
- `pages`
  - route seviyesindeki sayfalar
- `widgets`
  - birden fazla feature veya entity kullanan ekran bolumleri
- `features`
  - kullanici aksiyonu odakli UI mantigi
- `entities`
  - domain odakli veri ve UI parcalari
- `shared`
  - ortak UI primitive, token, util, api client, tipler

### 7.4 Frontend Tasarim Kurallari

1. Route, sayfa basligi, sidebar ve navigation metadata tek typed config kaynagindan beslenir.
2. Sayfa bilesenleri dogrudan `fetch` cagiramaz; API erisimi tek client katmanindan gecer.
3. Server state icin varsayilan arac `TanStack Query` dir.
4. Lokal UI state component veya feature scope icinde kalir.
5. Presentational component ve container logic ayrimi korunur.
6. Sayfa layout kararlari ortak primitive'lerle cozulur; her ekranda sifirdan layout yazilmaz.

## 8. UI ve Design System Standarti

Tek bir tasarim dili zorunludur.

### 8.1 Tek Kaynak Ilkesi

1. Design tokens tek kaynaktan tanimlanir.
2. Spacing, radius, color, shadow, typography ve breakpoint degerleri daginik tutulmaz.
3. Her ekran kendi ozel buton, kart veya form yorumunu uretmez.

### 8.2 Zorunlu UI Primitive'leri

Yeni frontend en az su primitive setini kullanir:

- `PageShell`
- `SectionCard`
- `DataTable`
- `FormField`
- `SplitLayout`
- `DrawerPanel`
- `StatusBanner`

### 8.3 Responsive ve Tasma Kurallari

1. Yatay tasma sadece izinli kapsayicilarda olabilir.
2. `body` veya ana sayfa kabugu yatay scroll uretmemelidir.
3. Form alanlari minimum okunabilir genislik standardina sahip olmalidir.
4. Tablo tasmasi yalniz `table wrapper` icinde yasanir.
5. Mobil davranis, masaustu davranisindan tureyen yamalarla degil, bilincli breakpoint kurallariyla yazilir.

## 9. Operasyon Merkezi ve Kritik Ekran Kurallari

`Operasyon Merkezi` yeni mimariye ilk tasinacak kritik ekrandir.

Yeni duzende:

- sol: proje listesi ve filtre/ozet rail
- sag ust: proje olusturma ve kullanici yonetimi
- alt tam genislik: secili proje calisma alani
- audit ve acik isler: drawer veya yan panel, ana icerigi ezmeden

Kurallar:

1. `Secili Proje Calisma Alani` sagda dar kolona sikistirilamaz.
2. Ust yonetim panelleri ile alt calisma alani farkli layout bolgeleri olarak ele alinir.
3. Workflow aksiyonlari, form alanlari ve tablolar ayni gorunur hiyerarsi icinde kurulur.

## 10. Gelistirme Sureci Standarti

Yeni ozellik veya buyuk refactor oncesi asgari su adimlar zorunludur:

1. mimari etki analizi
2. veri akisi etkisi
3. API kontrati
4. acceptance criteria
5. test senaryosu

Gerekiyorsa kisa bir ADR eklenir.

### 10.1 Migration Kuralı

Yeni frontend migration'larinda su checklist zorunludur:

1. route tasi
2. state tasi
3. API adapter yaz
4. primitive bilesenlere gec
5. responsive test
6. legacy kaldir

## 11. Test ve Kalite Kapilari

### 11.1 Backend

1. Kritik domain servisleri unit test ile korunur.
2. Use-case seviyesinde en az temel integration senaryolari bulunur.
3. Yeni kural motoru, parser veya resolver degisikligi testsiz birakilmaz.

### 11.2 Frontend

1. Yeni React uygulamasi icin `typecheck` zorunludur.
2. Build alinmadan degisiklik tamamlanmis sayilmaz.
3. Page smoke test ve responsive dogrulama zorunludur.
4. Kritik ekranlar icin veri yukleme, empty state, error state ve action state kontrol edilir.

### 11.3 PR veya Iterasyon Kabul Listesi

Bir iterasyon tamamlanmis sayilmadan once en az su sorular cevaplanir:

- mimari sinirlar korundu mu
- veri akisi net mi
- API shape tutarli mi
- UI primitive'leri kullanildi mi
- masaustu ve dar ekran kontrol edildi mi
- test veya dogrulama sonucu kaydedildi mi

## 12. Legacy ve Yeni Mimari Siniri

`apps/frontend/public` gecici olarak `legacy shell` kabul edilir.

Kurallar:

1. Tasinmamis sayfalar disinda legacy shell'e yeni ozellik eklenmez.
2. Yeni sayfalar sadece `apps/frontend/app` icinde gelistirilir.
3. Ayni route icin legacy ve yeni render yolu ayni anda aktif tutulmaz.
4. Bir sayfa yeni shell'e tasindiginda legacy baglari temizlenir.
5. Tasinmis ekranlar ana uygulama rota sahipligini `/app` altinda alir.
6. Legacy acik kalan ekranlar `/legacy` altinda gecici olarak korunur.

## 13. Agent Calisma Modu

Bu projede calisan agent su sekilde davranir:

1. Once mevcut yapinin gercek durumunu okur.
2. Katman siniri bozan hizli cozumleri varsayilan cozum olarak secmez.
3. Gecici cozum ile kalici cozum farkini acikca belirtir.
4. Buyuk degisiklikleri parcali ama karar-verilmis sekilde uygular.
5. UI duzeltmesini yalniz CSS yamasina indirgemez; gerekirse render ve veri akisina kadar iner.

## 14. Zorunlu Dokumantasyonlar

Asagidaki belgeler bu standardin uzantisi olarak korunur:

- `README.md`
- `apps/frontend/README.md`
- `apps/backend/README.md`
- `docs/architecture/ADR-0001-frontend-reset.md`
- `docs/migration/frontend-migration-checklist.md`

## 15. Son Hukum

Varsayilan ilke sudur:

- hizli degil, dogru
- gecici degil, geri alinabilir
- daginik degil, katmanli
- gorunen cozum degil, profesyonel temel

Bu repoda yeni gelistirme, legacy string-template arayuz mantigina geri donerek degil; temiz backend sinirlari ve React tabanli yeni frontend omurgasi etrafinda devam eder.
