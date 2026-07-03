# Solid Dosya Okuma - MVP Gereksinimleri

## Amaç

Teknik çizim ve Solid dosyalarının bulunduğu proje klasörünü okuyup, dosya ve klasör isimlerinden hareketle basit bir "iş akışı tablosu" üreten masaüstü/web tabanlı küçük bir uygulama geliştirmek.

Bu ilk sürümde hedef:

- Klasör yapısını taramak
- Dosya adlarını ve uzantılarını okumak
- Dosyaları temel iş süreçlerine ayırmak
- Kullanıcıya sade bir tabloda sonuç göstermek

Bu sürümde Solid dosyalarının içeriği parse edilmeyecek. Yalnızca klasör adı, dosya adı ve uzantı kullanılacak.

## Gözlenen mevcut yapı

Örnek proje klasörü:

- `IN26016_TARTIM KONVOYOR`

Öne çıkan alt klasörler:

- `100_DXF`
- `120_IGES DOSYASI`
- `130_STEP DOSYASI`
- `150_DVG`
- `200_TEKNİK RESİM`
- `300_BAGLANTI PARCALARI`
- `400_AYAK`
- `500_SASİ`
- `600_KONVOYOR`
- `700_SIYIRICI`
- `800_P1000 KESTAMİT`
- `900_HUNİ_YALAK`
- `1100_ELEKTRİK`

`200_TEKNİK RESİM` altında doğrudan iş akışına çevrilebilecek süreç klasörleri var:

- `SATIN ALMA`
- `BUKUM`
- `PROFİL`
- `TORNA_FREZE`
- `MONTAJ`
- `IMALAT`

Bu yapı MVP için yeterli sinyal sağlıyor.

## MVP kapsamı

Uygulama kullanıcıdan bir kök klasör seçecek ve şu adımları uygulayacak:

1. Tüm alt klasörleri ve dosyaları tarar.
2. Dosyaları isim, uzantı ve bulunduğu klasöre göre sınıflandırır.
3. Her dosya/parça için önerilen iş sürecini belirler.
4. Sonucu tabloda gösterir.

## İş kuralları - ilk sürüm

### 1. Süreç eşlemesi klasöre göre

Bir dosya şu klasörlerden birinin altındaysa süreç otomatik atanır:

- `200_TEKNİK RESİM\\SATIN ALMA` -> `Satın Alma`
- `200_TEKNİK RESİM\\BUKUM` -> `Büküm`
- `200_TEKNİK RESİM\\PROFİL` -> `Profil`
- `200_TEKNİK RESİM\\TORNA_FREZE` -> `Torna/Freze`
- `200_TEKNİK RESİM\\MONTAJ` -> `Montaj`
- `200_TEKNİK RESİM\\IMALAT` -> `İmalat`

### 2. Süreç eşlemesi dosya adına göre

Klasörden süreç bulunamazsa dosya adına göre tahmin yapılır:

- Adında `SAC` geçiyorsa -> `İmalat` veya `Büküm`
- Adında `PROFIL` veya `PROFİL` geçiyorsa -> `Profil`
- Adında `MIL` veya `MİL` geçiyorsa -> `Torna/Freze`
- Adında `RULMAN`, `MOTOR`, `LOADCELL`, `ENCODER`, `BANT` geçiyorsa -> `Satın Alma`
- Adında `SLDASM` ile ilişkili montaj dosyası varsa -> `Montaj`

Not:
`SAC` için daha sonra ikinci seviye kural yazılabilir. İlk sürümde kullanıcıya "önerilen süreç" gösterilecek, kesin karar değil.

### 3. Dosya tipi bilgisi

Tabloda dosya tipi ayrıca gösterilecek:

- `SLDPRT` -> Parça
- `SLDASM` -> Montaj
- `SLDDRW` -> Teknik Resim
- `DXF` -> Kesim Dosyası
- `STEP` / `IGS` -> Dışa Aktarım CAD
- `XLSX` -> Liste
- Diğer -> Diğer

### 4. Parça kodu çıkarma

Dosya adı başındaki sayısal bölüm mümkünse parça kodu olarak alınacak.

Örnek:

- `663_SAC.SLDDRW` -> parça kodu `663`
- `1215_SAC.SLDPRT` -> parça kodu `1215`
- `Aynalama921_40X40X2_PROFİL.SLDPRT` -> parça kodu boş bırakılabilir

## Kullanıcıya gösterilecek tablo

İlk sürüm tablosunda şu kolonlar yeterli:

- `Parça Kodu`
- `Dosya Adı`
- `Dosya Tipi`
- `Bulunduğu Klasör`
- `Ana Grup`
- `Önerilen Süreç`
- `Güven Durumu`

`Güven Durumu` örnek değerleri:

- `Kesin` -> süreç klasörden bulundu
- `Tahmini` -> süreç dosya isminden çıkarıldı
- `Belirsiz` -> hiçbir kural eşleşmedi

## Basit UI önerisi

İlk arayüz çok sade olabilir:

1. Üstte `Klasör Seç` butonu
2. Yanında seçilen klasör yolu
3. `Tara` butonu
4. Alt bölümde sonuç tablosu
5. Üstte küçük özet kutuları

Özet kutuları:

- Toplam dosya
- Süreç atanmış dosya
- Belirsiz dosya
- Süreç bazlı adetler

## Teknik öneri - ilk uygulama

MVP için en hızlı ve pratik yol:

- `Frontend`: basit HTML + CSS + JavaScript
- `Backend`: Node.js + Express
- `Dosya tarama`: Node.js `fs` ve `path`

Alternatif:

- Sadece Electron ile tek paket uygulama

Ancak en hızlı test için önce:

- küçük bir Node.js uygulaması
- tarayıcıda açılan basit bir arayüz

önerilir.

## Çıktı örneği

| Parça Kodu | Dosya Adı | Dosya Tipi | Ana Grup | Önerilen Süreç | Güven |
|---|---|---|---|---|---|
| 663 | 663_SAC.SLDDRW | Teknik Resim | 600_KONVOYOR | Büküm | Kesin |
| 650 | 650_BANT.SLDDRW | Teknik Resim | 600_KONVOYOR | Satın Alma | Kesin |
| 643 | 643_MİL.SLDDRW | Teknik Resim | 600_KONVOYOR | Torna/Freze | Kesin |
| 1211 | 1211_MZR6060.SLDPRT | Parça | 1100_ELEKTRİK | Satın Alma | Tahmini |

## İlk sürümde yapılmayacaklar

- SolidWorks dosya içeriği okuma
- Gerçek BOM çıkarma
- Parçalar arası ilişki analizi
- ERP entegrasyonu
- Kullanıcı yetkilendirme
- Veritabanı
- Otomatik sipariş veya iş emri üretme

## Açık noktalar

Devam etmeden önce netleştirilmesi faydalı olacak konular:

- Sonuç sadece ekranda mı gösterilecek, yoksa Excel/CSV olarak da dışa aktarılacak mı?
- Bir dosya birden fazla sürece bağlı olabilir mi?
- `SAC` dosyaları varsayılan olarak `Büküm` mü, `İmalat` mı sayılmalı?
- `SATIN ALMA` klasörü dışındaki satın alma parçaları için ek anahtar kelime listesi gerekli mi?

## Önerilen sonraki adım

Bir sonraki iterasyonda şu işleri yapalım:

1. Node.js tabanlı proje iskeleti kurulsun
2. Klasör tarama servisi yazılsın
3. Süreç eşleme kuralları kodlansın
4. Basit tablo arayüzü eklensin
5. Bu örnek klasör üzerinde ilk çıktı doğrulansın
