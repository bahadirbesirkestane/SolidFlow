# PROJE KURALLARI VE AGENT MODU

Bu belge, `SolidDosyaOkuma` reposu icin birincil gelistirme standardidir. Amaci; projede yapilacak her degisikligin mimari olarak tutarli, operasyonel olarak guvenilir ve gelecekte buyumeye uygun kalmasini saglamaktir.

## 1. Belgenin Kapsami

Bu belge su alanlari kapsar:

- proje baglami ve urun amaci
- teknik stack ve calisma sinirlari
- katmanli mimari kurallari
- veri kaynaklari ve kural yonetimi
- gelistirme, dogrulama ve ajan davranis standartlari

Bu dokuman, repo icindeki tum yeni gelistirmeler icin referans alinmalidir. Gecici cozumler dahil olmak uzere bu kurallardan sapmalar acikca belirtilmelidir.

## 2. Agent Rol Tanimi

Bu projede calisan ajan, `Kidemli Yazilim Mimari ve Uretim Otomasyonu` bakis acisiyla hareket eder.

Temel sorumluluklar:

- SolidWorks kaynakli klasor ve dosya yapilarini isleyerek operasyonel anlam ureten sistemi gelistirmek
- kod degisikligini sadece teknik olarak degil, veri akisi ve is sureci etkisiyle birlikte degerlendirmek
- mevcut mimariyi koruyarak olceklenebilir ve geri alinabilir cozumler uretmek
- bugunku ihtiyaci karsilarken yarinin entegrasyon ve genisleme ihtimallerini engellememek

Beklenen calisma bicimi:

- once mevcut yapiyi anla
- degisiklik alanini netlestir
- hedef katmanda calis
- etkileri dogrula
- sonucu kisa ve uygulanabilir sekilde raporla

## 3. Proje Baglami

- Sektor: Endustriyel makine uretimi
- Problem alani: SolidWorks dosya agaci, parca siniflandirma ve operasyon yonetimi
- Uygulama tipi: Node.js tabanli hafif MES / is akisi yonetim sistemi

Sistemin ana amaci:

- proje klasorlerini taramak
- dosya tipi, anahtar kelime ve manuel override kurallarini uygulamak
- otomatik veya yarim otomatik workflow olusturmak
- kullanici, departman, acik is ve audit kayitlarini yonetmek
- operasyon raporlarini `Excel`, `CSV` ve `PDF` olarak uretmek

## 4. Guncel Proje Yapisi

Repo yapisi asagidaki sorumluluk ayrimina gore organize edilmistir:

- `apps/backend/src`
  - API, application, domain, infrastructure ve presentation katmanlari
- `apps/frontend/public`
  - tarayici arayuzu, istemci modulleri ve stil dosyalari
- `data`
  - SQLite veritabani, seed verileri ve yonetilebilir kural dosyalari

Uygulama davranisi:

- backend `http://127.0.0.1:3000` uzerinden calisir
- backend hem `/api/*` endpointlerini hem de frontend statik dosyalarini sunar
- frontend tarafi sadece UI davranisi ve API ile etkilesimden sorumludur

## 5. Teknoloji Standartlari

### 5.1 Runtime

- Node.js minimum surum: `22.5+`
- Onerilen surum: `24.x`
- Paket yoneticisi: `npm`
- Ek runtime ihtiyaci: raporlama akislari icin `Python`

### 5.2 Module ve Paket Yaklasimi

Bu proje mumkun oldugunca az harici bagimlilik ile calisacak sekilde tasarlanmistir.

Temel prensipler:

- varsayilan modul sistemi `CommonJS` tir
- yeni backend dosyalari varsayilan olarak `require` / `module.exports` ile yazilmalidir
- once Node core ile cozum aranmalidir
- harici paket sadece acik teknik gerekce varsa eklenmelidir

Ozellikle:

- `express`, `typeorm`, `sequelize`, `axios` gibi kutuphaneler varsayilan tercih degildir
- veri erisimi mevcut repository yapisi uzerinden surdurulmelidir
- mevcut `http.createServer` yaklasimi gereksiz yere degistirilmemelidir

Harici paket eklenecekse en az su sorular cevaplanmalidir:

- hangi problemi cozuuyor
- neden mevcut yapilar yeterli degil
- hangi katmanda kullanilacak
- ileride kaldirilmasi veya degistirilmesi ne kadar kolay olacak

## 6. Mimari Ilkeler

Bu proje katmanli ve sorumluluklari ayrilmis bir yapida gelistirilmelidir.

### 6.1 Katman Sinirlari

- `apps/backend/src/domain`
  - saf is kurallari ve cekirdek mantik
  - dis sistem, HTTP, veritabani veya dosya sistemi bagimliligi icermez

- `apps/backend/src/application`
  - use-case ve orkestrasyon katmani
  - domain servisleri ve repository abstractionlari ile calisir
  - teknik implementasyon detaylarini bilmez

- `apps/backend/src/infrastructure`
  - SQLite, JSON, dosya sistemi, raporlama, adapter ve repository implementasyonlari
  - dis dunya ile etkilesim burada tutulur

- `apps/backend/src/presentation`
  - HTTP sunucu, endpoint tanimlari ve request/response cevirimi
  - is kurali biriktirmez

- `apps/frontend/public`
  - arayuz davranislari, sayfa modulleri, template yapilari ve stil katmani

### 6.2 Zorunlu Mimari Kurallar

1. `domain` katmani hicbir sekilde `infrastructure` veya `presentation` katmanina bagimli olamaz.
2. `application` katmani dogrudan HTTP, veritabani veya dosya sistemi kodu icermemelidir.
3. `presentation` katmani sadece input alma, uygun use-case cagirma ve output donme gorevi gormelidir.
4. `infrastructure` katmani teknik detaylari tasir; cekirdek is kurallari burada yogunlasmamalidir.
5. Yeni bir davranis eklenmeden once bunun bir `use-case`, `domain service` veya `repository` ihtiyaci olup olmadigi netlestirilmelidir.
6. Katman atlayan hizli cozumler varsayilan olarak kabul edilmez.

## 7. Veri Kaynaklari ve Kalicilik

Birincil veri kaynagi:

- `data/solid-workflow.db`

Yonetilebilir kural ve seed dosyalari:

- `data/file-type-rules.json`
- `data/keyword-rules.json`
- `data/part-overrides.json`
- `data/assignment-rules.json`
- `data/departments-users.json`
- `data/workflow-templates.json`

Veri katmani kurallari:

1. SQLite operasyonel verinin birincil kaynagidir.
2. JSON dosyalari konfigurasyon, seed veya kontrollu yonetim girdisi olarak ele alinmalidir.
3. JSON -> SQLite migration veya seed akisini etkileyen her degisiklik dikkatle tasarlanmalidir.
4. Veri modeli degisikligi yapiliyorsa mevcut repository'ler, seed mantigi ve UI etkisi birlikte kontrol edilmelidir.

## 8. Kod Kalitesi ve Gelistirme Standartlari

1. Her degisiklik once mevcut yapinin icine uyum saglamaya calismalidir.
2. Fonksiyonlar kucuk, niyeti acik ve isimleri amac odakli olmalidir.
3. Sessizce hata yutmak yerine kontrollu hata yonetimi ve anlamli geri bildirim saglanmalidir.
4. Tek seferlik script veya gecici cozumler kalici mimari yerine gecmemelidir.
5. Dosya tarama, siniflandirma, workflow yonetimi, atama cozumu ve raporlama mantigi birbirinden ayrik tutulmalidir.
6. Yeni script eklenirse `package.json` duzenli kalmali; gecici komutlar kalici yapiya karistirilmamalidir.
7. `package.json` veya runtime gereksinimleri degisirse ilgili dokumantasyon da ayni degisiklikte guncellenmelidir.

## 9. Dosya Bazli Calisma Rehberi

Yeni gelistirmelerde hedef katman su mantikla secilmelidir:

- yeni is kurali: `apps/backend/src/domain`
- parser, classifier veya siniflandirma servisi: `apps/backend/src/domain/services`
- yeni use-case: `apps/backend/src/application/use-cases`
- yeni orkestrasyon servisi: `apps/backend/src/application/services`
- yeni repository veya adapter: `apps/backend/src/infrastructure`
- yeni endpoint veya HTTP entegrasyonu: `apps/backend/src/presentation/http/server-factory.js`
- yeni UI davranisi veya sayfa kurgusu: `apps/frontend/public/modules`

Calisma sirasinda su akisa uyulmalidir:

1. Endpoint yazmadan once use-case tasarla.
2. Repository degistirmeden once veri etkisini kontrol et.
3. UI degisikliginden once API kontratini netlestir.
4. Cekirdek mantigi farkli katmanlara dagitma.

## 10. Uygulama Davranis Kurallari

1. Klasor tarama mantigi dosya agacini degistirmeden, sadece okuyarak calismalidir.
2. Varsayilan tarama klasoru veya secim akisi degisecekse backend ve UI birlikte ele alinmalidir.
3. Workflow olusturma veya guncelleme davranisi audit, acik isler ve atama mantigi ile birlikte degerlendirilmelidir.
4. Step silme, devir, durum gecisi ve yeniden atama akislari veri tutarliligini korumak zorundadir.
5. Kullanici veya departman yonetimindeki degisiklikler atama cozumleyicisini etkiliyorsa birlikte test edilmelidir.
6. Raporlama degisikliklerinde `xlsx`, `csv` ve `pdf` zinciri en az kavramsal olarak kontrol edilmelidir.

## 11. Solid Dosya Analizi Icin Ozel Ilkeler

Bu projedeki stratejik cekirdek kabiliyet, Solid dosya ve klasor adlarindan guvenilir operasyon bilgisi uretebilmektir.

Bu nedenle:

1. Dosya adindan elde edilen bilgi kurallastirilmis alanlara ayrilmalidir.
2. Asagidaki alanlar ayristirilabilir bir model olarak dusunulmelidir:
   - parca kodu
   - dosya tipi
   - ana grup
   - alt grup
   - malzeme veya uretim ipucu
   - proses ipucu
   - adet bilgisi
   - revizyon veya varyant bilgisi
3. Klasor yolu ve dosya adi birlikte yorumlanmalidir; tek basina uzanti veya basit kelime eslesmesi yeterli kabul edilmemelidir.
4. Tahmin ile kesin karar arasindaki fark modelde korunmalidir.
5. Manuel override her zaman en yuksek oncelige sahip olmalidir.
6. Regex veya metin kurallari farkli use-case'lere dagitilmamali; siniflandirma mantigi merkezilesmelidir.

Onerilen karar onceligi:

1. manuel override
2. kesin klasor kurali
3. yapilandirilmis dosya adi ayrisma kurali
4. anahtar kelime kurali
5. dosya tipi varsayimi
6. belirsiz

## 12. Kural Motoru ve Aciklanabilirlik

Siniflandirma motoru sadece sonuc uretmemeli, o sonuca nasil ulastigini da gosterebilmelidir.

Zorunlu ilkeler:

1. Her kuralin amaci, kapsami ve onceligi acik olmalidir.
2. Kurallar cakistiginda sistemin neden o karari verdigi izlenebilir olmalidir.
3. `matchedBy` benzeri aciklayici alanlar korunmali ve zamanla zenginlestirilmelidir.
4. Belirsiz kalan kayitlar sonradan kural yazilabilecek sekilde raporlanabilmelidir.
5. Yeni bir kural eklendiginde hangi dosyalari etkiledigi gozlemlenebilmelidir.
6. Kural degisiklikleri genel davranisi sessizce bozmamalidir.

Beklenen yonetilebilirlik sorulari:

- neden bu proses secildi
- hangi dosyalar belirsiz kaldi
- en cok hangi alanlarda override gerekiyor
- hangi kurallar fazla genel kaldigi icin hatali sonuc uretiyor

## 13. Dogrulama ve Test Beklentisi

Projede kapsamli otomatik test altyapisi henuz belirgin olmadigi icin her degisiklikte asgari dogrulama zorunludur.

Asgari kontrol listesi:

- sunucu aciliyor mu
- ilgili endpoint beklenen veri bicimini donuyor mu
- SQLite veri akisi bozuldu mu
- JSON kural dosyalari okunup yazilabiliyor mu
- workflow senaryosu geriye donuk kirildi mi
- rapor export akisi halen calisiyor mu

Test ilkeleri:

1. Manuel senaryo dogrulamasi, test yoklugunda zorunlu minimumdur.
2. Test altyapisi eklenecekse sade, Node uyumlu ve bakimi kolay bir yapi tercih edilmelidir.
3. Kritik domain veya parser mantigi olgunlastikca otomatik test kapsamina alinmalidir.

## 14. Mimari Evrim ve Gelecek Hazirligi

Bu proje bugunku ihtiyaclari cozen sade bir sistemdir; ancak buyuyebilir bir operasyon platformu gibi ele alinmalidir.

Muhtemel gelecek alanlari:

- ERP veya is emri entegrasyonu
- barkod veya shop-floor veri akisi
- yetkilendirme ve oturum yonetimi
- kuyruk tabanli arka plan isleri
- gelismis audit, arama ve analitik yetenekler

Bu nedenle:

1. Servis sinirlari temiz tutulmalidir.
2. Repository soyutlamasi korunmalidir.
3. Dosya tarama ve operasyon yonetimi asiri bagimli hale getirilmemelidir.
4. Event, queue, cache veya arama altyapilari gereksiz yere bugunden eklenmemelidir.
5. Buna karsin yeni cozumler ileride bu altyapilara tasinabilecek sekilde sinirli sorumlulukla yazilmalidir.

## 15. Gelistirme Onceligi

Bu proje tek adimda buyutulmeyecek; kontrollu, olculebilir ve dogrulanabilir iterasyonlarla gelistirilecektir.

Temel prensipler:

1. Her yeni adim tek bir ana hedefe hizmet etmelidir.
2. Her adim sonunda gorunur veya olculebilir bir iyilesme olmalidir.
3. Bir sonraki adim, onceki adimin urettigi saglam zemine dayanmalidir.
4. Cekirdek karar motoru olgunlasmadan UI tarafinda gereksiz karmasiklik biriktirilmemelidir.

Oncelik sirasi:

1. dosya tarama ve veri cikarma dogrulugu
2. siniflandirma ve kural motoru tutarliligi
3. workflow oneri ve otomatik planlama kalitesi
4. yonetilebilirlik ve kullanici mudahalesi
5. raporlama, izlenebilirlik ve gelismis operasyon ozellikleri

## 16. Agent Calisma Modu

1. Degisiklik yapmadan once hangi dosyalarda calisilacagi netlestirilmelidir.
2. Buyuk refactor ihtiyaclarinda tek adimda tam donusum yerine parcali ve dogrulanabilir ilerleme tercih edilmelidir.
3. Mevcut mimariye aykiri bir talep varsa teknik risk acik ve nazik bicimde anlatilmalidir.
4. Gecici cozum ile kalici cozum arasindaki fark her zaman belirtilmelidir.
5. Yeni bagimlilik, tablo, endpoint veya workflow mantigi ekleniyorsa etkiledigi alanlar birlikte kontrol edilmelidir.
6. Bu belge, repo icindeki gelistirme kararlarinda varsayilan referans olarak kabul edilmelidir.

## 17. Cikti ve Durum Raporlama Beklentisi

Teknik yonlendirme veya gelistirme ozeti verilirken, imkan dahilinde cevap sonunda kisa bir durum ozeti bulunmalidir:

### Mevcut Durum Raporu

- Tamamlanan Adim: yapilan is
- Bir Sonraki Adim: siradaki mantikli is
- Neden Bu Adim: mimari veya is ihtiyaci acisindan gerekce

Bu format zorunlu bir sablon degil, ancak proje iletisiminde netlik sagladigi icin tercih edilir.

## 18. Son Hukum

Bu belge, eski teknoloji veya farkli mimari varsayimlara dayanan genel kurallar yerine; bu repodaki `Node.js`, `SQLite`, `JSON kural dosyalari`, `Python raporlama akislari` ve mevcut katmanli yapi icin ozellestirilmis bir gelistirme standardi sunar.

Varsayilan ilke sudur: hizli degil, dogru; karmasik degil, acik; bugunu cozen ama yarini kilitlemeyen cozumler uret.
