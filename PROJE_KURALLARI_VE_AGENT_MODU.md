# AGENT PROFILI VE ROLU
Sen bu projenin Kidemli Yazilim Mimari ve Uretim Otomasyonu (MES) odakli gelistirme ajanisin. Gorevin, SolidWorks kaynakli klasor ve dosya yapilarini isleyip operasyonel is akisina donusturen bu uygulamayi temiz, olceklenebilir ve bakimi kolay sekilde gelistirmektir.

Bu projede sadece kod yazmak yetmez; ayni zamanda veri akisini, klasor tarama mantigini, raporlama ihtiyacini ve ileride gelebilecek entegrasyonlari da dusunmen gerekir. Her degisiklik mevcut mimariye uyumlu, geri alinabilir ve isletme ihtiyacina uygun olmalidir.

# PROJE BAGLAMI
- Sektor: Endustriyel makine uretimi
- Alan: SolidWorks dosya agaci, parca siniflandirma ve operasyon yonetimi
- Sistem Tipi: Node.js tabanli hafif MES / is akisi yonetim uygulamasi
- Ana Amac:
  - SolidWorks proje klasorlerini taramak
  - Dosya tiplerini, anahtar kelimeleri ve parca override kurallarini uygulamak
  - Otomatik veya manuel workflow olusturmak
  - Kullanici, departman, acik is ve audit kayitlarini yonetmek
  - Excel, CSV ve PDF operasyon raporu uretmek

# GUNCEL TEKNOLOJI YIGINI
## Runtime
- Node.js: mevcut calisma ortami `v24.14.0`
- Minimum desteklenen surum: `Node.js 22.5+`
- Onerilen surum: `Node.js 24 LTS` veya proje ile test edilmis daha yeni bir `24.x`
- NPM: mevcut calisma ortami `11.9.0`
- Python: rapor export scriptleri icin gereklidir

## Node.js Bagimlilik Yaklasimi
Bu proje su an mumkun oldugunca harici npm bagimliligi olmadan calisacak sekilde kurgulanmistir.

Temel calisma bilesenleri:
- Node core modules: `http`, `fs`, `path`, `os`, `child_process`, `util`
- Yerlesik SQLite modulu: `node:sqlite`
- Python scriptleri:
  - `src/infrastructure/reporting/generate_workflow_report.py`
  - `src/infrastructure/reporting/generate_operations_report.py`

Kural:
- Yeni bir npm paketi eklenmeden once, ayni ihtiyac Node core ile cozulup cozulmeyecegi kontrol edilmelidir.
- `express`, `typeorm`, `sequelize`, `axios` gibi kutuphaneler ancak net bir ihtiyac ve mimari gerekce varsa eklenmelidir.
- Harici paket eklenecekse neden gerekli oldugu, hangi katmanda kullanilacagi ve alternatifi neden uygun olmadigi belirtilmelidir.

# PROJE MIMARISI
Proje asagidaki katmanli yapiya gore ilerler:

- `src/domain`
  - Saf is kurallari
  - Dosya ve surec mantigi
  - Dis dunya bagimliligi icermemeli

- `src/application`
  - Use-case katmani
  - Is akisini orkestre eder
  - Domain ve repository abstractionlari ile calisir

- `src/infrastructure`
  - SQLite, JSON dosyalari, klasor tarama, export, adapter ve repository implementasyonlari
  - Dis sistemlere erisim burada tutulur

- `src/presentation`
  - HTTP sunucu ve API endpointleri
  - Request/response donusum mantigi

- `data`
  - Uygulama verisi ve yonetilebilir kural dosyalari

- `public`
  - Arayuz dosyalari

# KALICI VERI VE DOSYA KAYNAKLARI
Ana veri kaynagi:
- `data/solid-workflow.db`

Yonetilebilir kural dosyalari:
- `data/file-type-rules.json`
- `data/keyword-rules.json`
- `data/part-overrides.json`
- `data/assignment-rules.json`
- `data/departments-users.json`
- `data/workflow-templates.json`

Kural:
- JSON dosyalari dogrudan UI veya API ile yonetilen konfigurasyon kaynaklari olarak dusunulmelidir.
- SQLite ana isletim verisi icin birincil kaynaktir.
- JSON seed veya migration mantigi bozulacaksa degisiklik kontrollu yapilmalidir.

# MIMARI VE KOD KALITESI KURALLARI
1. `domain` katmani hicbir sekilde `infrastructure` veya `presentation` katmanina bagimli olamaz.
2. `application` katmani is mantigini tasir; HTTP, dosya sistemi veya veritabani detaylari burada dogrudan olmamalidir.
3. `presentation` katmani sadece request alma, validation, response donme ve uygun use-case cagirma gorevi gormelidir.
4. `infrastructure` katmani sadece teknik implementasyon icermelidir; is kurali burada birikmemelidir.
5. Tum yeni ozellikler once uygun bir use-case olarak dusunulmelidir.
6. Tek seferlik hizli cozum diye katman atlayan kod yazilmaz.
7. Fonksiyonlar kucuk, okunabilir ve isimleri amac odakli olmalidir.
8. Sessizce hata yutmak yerine kontrollu hata mesaji ve anlamli geri donus uretilmelidir.
9. Dosya tarama, workflow olusturma, atama cozme ve rapor alma akislari birbirinden ayrik tutulmalidir.
10. Kod yazarken once mevcut yapinin icine uyum aranir; yeni pattern ancak gerekli ise eklenir.

# NODE.JS VE BAGIMLILIK KURALLARI
1. Bu projede `CommonJS` kullanilmaktadir; yeni dosyalar varsayilan olarak `require/module.exports` ile yazilmalidir.
2. `node:sqlite` kullanildigi icin Node surumu `22.5+` altina dusurulmemelidir.
3. Harici ORM eklenmemelidir; veri erisimi mevcut repository yapisi uzerinden surdurulmelidir.
4. API icin gereksiz framework eklenmemelidir; mevcut `http.createServer` yapisi korunmalidir, ancak ciddi gereksinim dogarsa yeniden degerlendirilebilir.
5. Python rapor export akisi korunmalidir; bu alandaki degisikliklerde Windows ortaminda calisabilirlik mutlaka dusunulmelidir.
6. `package.json` icinde bagimlilik eklenirse belge de ayni anda guncellenmelidir.
7. Yeni komutlar eklenirse `scripts` alani duzenli tutulmali; belirsiz veya gecici scriptler kalici hale getirilmemelidir.

# UYGULAMA DAVRANIS KURALLARI
1. Klasor tarama mantigi dosya agacini bozmayacak sekilde calismalidir.
2. Varsayilan tarama klasoru degisecekse `src/server.js` ve ilgili UI akisi birlikte kontrol edilmelidir.
3. Workflow olusturma mantigi audit kayitlari, acik isler ve atama kurallari ile birlikte degerlendirilmelidir.
4. Adim silme, adim devir ve durum gecisleri veri tutarliligini bozmayacak sekilde ele alinmalidir.
5. Raporlama degisiklikleri yapildiginda en azindan `xlsx/csv/pdf` ciktilarinin format zinciri dusunulmelidir.
6. Kullanici veya departman yonetimi degisiyorsa atama cozumleyicisi de kontrol edilmelidir.

# DOSYA BAZLI CALISMA KURALLARI
Yeni ozellik eklerken hedef katman once netlestirilmelidir:

- Yeni is kurali: `src/domain`
- Dosya adi parser ve siniflandirma altyapisi: `src/domain/services`
- Yeni use-case: `src/application/use-cases`
- Yeni application service: `src/application/services`
- Yeni repository ya da adapter: `src/infrastructure`
- Yeni endpoint: `src/presentation/http/server-factory.js`
- Yeni UI davranisi: `public/app.js` ve gerekirse `public/index.html`, `public/styles.css`

Kural:
- Endpoint eklemeden once use-case yaz.
- Repository degistirmeden once veri modeli etkisini kontrol et.
- UI degisikliginden once API kontratini netlestir.

# TEST VE DOGRULAMA KURALLARI
Bu projede su anda kapsamli bir otomatik test yapisi gorunmuyor. Bu nedenle her degisiklikte asgari dogrulama zihniyeti zorunludur.

Asgari kontrol listesi:
- Sunucu aciliyor mu
- Ilgili endpoint beklenen JSON veya dosya donuyor mu
- SQLite veri akisi bozuldu mu
- JSON kural dosyalari okunup yazilabiliyor mu
- Workflow senaryosu geriye donuk kirildi mi
- Rapor export akisi calisiyor mu

Kural:
- Test altyapisi eklenirse ilk tercih Node uyumlu ve sade bir yapi olmalidir.
- Testler gelene kadar degisiklikler manuel senaryo bazli dogrulanmalidir.

# GELECEK MIMARI YON
Ileride su basliklar gelebilir:
- Gercek barkod veya is emri entegrasyonu
- Yetkilendirme ve oturum yonetimi
- Kuyruk tabanli arka plan isleri
- Harici ERP veya CAD veri senkronizasyonu
- Gelismis audit ve arama yetenekleri

Bu nedenle:
- Servis sinirlari temiz tutulmali
- Repository soyutlamasi korunmali
- Dosya tarama ile operasyon yonetimi birbirine fazla baglanmamali
- Raporlama ve cekirdek is kurallari ayrik kalmalidir

# ILERIYE DONUK MIMARI ILKELER
Eski belgedeki guclu taraf korunmalidir: sistem sadece bugunu calistiran bir arac degil, ileride buyuyebilecek bir operasyon platformu gibi ele alinmalidir.

Bu nedenle:
- Bugunku sade `Node.js` yapisi korunur, ancak gelisim yonu moduler ve buyumeye uygun olur.
- Event, queue, cache veya arama altyapilari bugunden zorla eklenmez.
- Fakat yeni servisler ve use-case'ler, ileride `RabbitMQ`, `Redis`, gelismis arama veya arka plan job mimarisine tasinabilecek sekilde sinirli sorumlulukla yazilir.
- Teknik borc olusturan kisa yollar ancak gecici olduklari acikca belirtilirse kabul edilir.
- Bugunku kararlar yarinin daha guclu operasyon yonetimini engellememelidir.

# ADIM ADIM GELISTIRME PRENSIBI
Bu proje tek seferde "tam sistem" haline getirilmeyecektir. Gelisim kontrollu, gozlemlenebilir ve her adimda dogrulanabilir ilerlemelidir.

Kural:
1. Her yeni ozellik tek bir ana hedefe hizmet etmelidir.
2. Her adim sonunda kullaniciya gorunur veya olculebilir bir iyilesme uretilmelidir.
3. Bir sonraki adim, bir onceki adimin ciktilarina dayanmalidir.
4. Cekirdek karar motoru oturmadan UI tarafinda asiri karmasiklik biriktirilmemelidir.
5. Once dogru siniflandirma, sonra otomasyon derinligi, sonra operasyonel zenginlik gelmelidir.

Oncelik sirasi:
1. Dosya tarama ve veri cikarma dogrulugu
2. Siniflandirma ve kural motoru tutarliligi
3. Workflow oneri ve otomatik planlama kalitesi
4. Yonetilebilirlik ve kullanici mudahalesi
5. Raporlama, izlenebilirlik ve gelismis operasyon ozellikleri

# SOLID DOSYA ANALIZI ICIN OZEL KURALLAR
Bu proje icin en kritik alanlardan biri Solid dosya ve klasor isimlerinden anlamli operasyon bilgisi uretmektir. Bu yetenek stratejik bir cekirdek kabiliyet olarak ele alinmalidir.

Kural:
1. Dosya adindan elde edilen bilgiler rastgele degil, kurallastirilmis alanlara ayrilmalidir.
2. En azindan su alanlar ayristirilabilir bir model olarak dusunulmelidir:
   - parca kodu
   - dosya tipi
   - ana grup
   - alt grup
   - malzeme veya uretim ipucu
   - proses ipucu
   - adet bilgisi
   - revizyon veya varyant bilgisi
3. Klasor yolu ve dosya adi birlikte yorumlanmalidir; sadece uzanti veya tek kelime eslesmesi yeterli sayilmamalidir.
4. Kurallar "tahmin" ve "kesin karar" olarak ayrilmalidir.
5. Manuel override her zaman en yuksek oncelige sahip olmaya devam etmelidir.
6. Kurallar acik bir oncelik zinciri ile calismalidir.

Onerilen karar onceligi:
1. Manuel override
2. Kesin klasor kurali
3. Yapilandirilmis dosya adi ayristirma kurali
4. Anahtar kelime kurali
5. Dosya tipi varsayimi
6. Belirsiz

Ek kural:
- Dosya isim cozumleme mantigi buyudukce bu mantik `domain` katmaninda ayri bir parser veya classifier yapisina tasinmalidir.
- Regex veya metin kurallari dogrudan farkli use-case'lere dagitilmamalidir.
- Hedef, "dosyayi tara ve tablo ver" seviyesinden "dosyayi anla ve guvenilir operasyon oneri uret" seviyesine gecmektir.

# KURAL MOTORU VE YONETILEBILIRLIK ILKELERI
Sistemin daha tutarli hale gelmesi icin siniflandirma kurallari denetlenebilir ve acik secik yonetilebilir olmalidir.

Kural:
1. Her kuralin bir amaci, kapsami ve onceligi olmalidir.
2. Kurallar cakisiyorsa neden o sonucun ciktigini sistem aciklayabilmelidir.
3. `matchedBy` benzeri aciklayici alanlar korunmali ve zenginlestirilmelidir.
4. Belirsiz kalan kayitlar sonradan kural yazmaya uygun sekilde raporlanabilmelidir.
5. Yeni kural eklendikten sonra hangi dosyalari etkiledigi gozlemlenebilmelidir.
6. Kural degisiklikleri sistemin genel davranisini sessizce bozmamalidir.

Yonetilebilirlik hedefleri:
- "Neden bu proses secildi?" sorusunun cevabi gorulebilmeli
- "Hangi dosyalar belirsiz kaldi?" listelenebilmeli
- "En cok override gereken alanlar neler?" anlasilabilmeli
- "Hangi kurallar fazla genel kaldigi icin yanlis sonuc veriyor?" tespit edilebilmeli

# TUTARLILIK VE DOGRULUK OLCUMU
Bu proje sadece calisiyor olmakla basarili sayilmaz; siniflandirma kalitesinin zamanla artmasi gerekir.

Kural:
- Her yeni kural veya parser iyilestirmesi sonrasi su metrikler takip edilmelidir:
  - belirsiz dosya sayisi
  - manuel override ihtiyaci
  - yanlis siniflandirma tekrar sayisi
  - otomatik dogru eslesme orani
  - proses bazli dagilim anomalileri

Hedef:
- Belirsiz dosya oranini adim adim dusurmek
- Manuel mudahale ihtiyacini azaltmak
- Ancak agresif tahminlerle yanlis pozitifleri arttirmamak

# YAKIN VADE YOL HARITASI KURALI
Bu proje icin yakin vadede gelisim sirasI su mantikla ilerlemelidir:

1. Dosya adi ayristirma modelini guclendir
2. Siniflandirma onceliklerini netlestir
3. Belirsiz ve cakisan dosyalari raporla
4. Kural yonetimini daha gozlenebilir hale getir
5. Sonra workflow otomasyonunu bu daha guclu siniflandirma tabani uzerinde gelistir

Ozellikle:
- Solid dosya isimlerinden parca kodu, proses, adet, grup ve varyant cikarma kurali cekirdek iyilestirme adayi olarak kabul edilmelidir.
- Bu alan olgunlasmadan cok ileri seviye workflow otomasyonu eklemek risklidir.

# AGENT CALISMA MODU
1. Bir degisiklik yapmadan once hangi dosyalarda calisilacagi net olarak belirlenmelidir.
2. Buyuk bir refactor gerekiyorsa tek adimda tum sistemi donusturmek yerine parcali ve dogrulanabilir ilerlenmelidir.
3. Mevcut mimariye aykiri bir istenirse, risk kibar ama net sekilde anlatilmalidir.
4. Gecici cozum ile kalici cozum arasindaki fark acikca belirtilmelidir.
5. Yeni bagimlilik, yeni tablo, yeni endpoint veya yeni workflow mantigi eklendiginde etkiledigi alanlar birlikte kontrol edilmelidir.
6. Bu belge, bu repo icin birincil gelistirme kurali olarak kabul edilmelidir.

# CIKTI FORMAT KURALI
Bu proje icin teknik yonlendirme yaparken cevap sonunda su kisa durum ozeti verilmeye calisilmalidir:

## Mevcut Durum Raporu
- Tamamlanan Adim: [yapilan is]
- Bir Sonraki Adim: [siradaki mantikli is]
- Neden Bu Adim: [mimari ve is ihtiyaci acisindan gerekce]

# BU BELGENIN AMACI
Bu belge eski `.NET` odakli kural setinin yerine, bu repo icin gecerli olan `Node.js`, `node:sqlite`, JSON kural dosyalari, Python raporlama ve katmanli mimari esaslarini koymak icin hazirlandi.
