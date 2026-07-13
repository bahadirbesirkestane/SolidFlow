# Backend, Kimlik ve Operasyon Yol Haritası

Bu belge, mevcut çalışan sistemi bozmadan ve büyük refactor yapmadan projeyi gerçek kullanım senaryosuna taşıyacak uygulama sırasını tanımlar.

## Ana İlkeler

1. Önce backend toparlanır, sonra ekranlar genişletilir.
2. Mevcut çalışan akışlar bozulmaz; yeni davranışlar mümkün olduğunca eklemeli ilerler.
3. Büyük refactor yapılmaz; küçük, geri alınabilir, test edilebilir adımlar uygulanır.
4. Kullanıcıya görünen tüm metinler Türkçe olur.
5. Yetki, kullanıcı, puan ve iş akışı kuralları UI içine gömülmez; backend use-case ve policy katmanlarında tutulur.
6. Admin ve standart kullanıcı deneyimi ayrıştırılır ama aynı veri gerçeğine bakar.

## Hedef Ürün Kurgusu

Sistem şu hale gelmelidir:

1. Kullanıcı giriş yapar ve sadece yetkili olduğu alanları görür.
2. Admin kullanıcı dashboard, kullanıcı yönetimi, canlı işler, geçmiş işler, puanlama ve profil analiz ekranlarına erişir.
3. Standart kullanıcı kendisine atanan işleri, geçmiş işlerini ve bekleyen aksiyonlarını görür.
4. İşler liste halinde yönetilir; satıra tıklanınca adım dağılımı, atamalar, süre ve durum görünür.
5. Kullanıcı işi onaylama, devretme, not ekleme, engel bildirme gibi kontrollü aksiyonlar alabilir.
6. Dosya adına göre iş akışı oluşturma ve routing kuralları tek merkezden yönetilir.
7. Süre, puan ve performans sistemi adil kurgulanır; kullanıcının elinde olmayan gecikmeler ayrı izlenir.

## Önerilen Fazlar

### Faz 1: Backend Sağlamlaştırma ve Yetki Temeli

1. Kimlik ve oturum modeli belirlenir.
2. Rol ve departman modeli genişletilir.
3. Kullanıcı tablosu gerçek kullanım için güncellenir.
4. Admin ve çalışan policy katmanı kurulur.
5. Auth ve authorization endpoint kontratları netleştirilir.
6. Audit kapsamı auth ve yönetim aksiyonlarını da içerecek şekilde genişletilir.

### Faz 2: Gerçek Kullanıcı Yönetimi

1. Varsayılan seed kullanıcıları yerine gerçek kullanıcı yönetim akışı hazırlanır.
2. Kullanıcı oluşturma, güncelleme, pasife alma, rol atama, departman atama desteklenir.
3. Kullanıcı oluşturma alanı ana operasyon ekranından ayrılır.
4. Admin için ayrı kullanıcı yönetim sayfası açılır.
5. Kullanıcı profili, geçmiş işler ve temel performans metrikleri hazırlanır.

### Faz 3: İş Listesi ve Operasyon Akışı

1. İş akışı kart yapısından sade liste yapısına geçirilir.
2. Satıra tıklanınca iş detay paneli açılır.
3. Detay panelinde kullanıcı süreç dağılımı, adımlar, süreler, audit ve mevcut sorumlu görünür.
4. Edit ve delete aksiyonları ikon bazlı ve yetki kontrollü hale getirilir.
5. Devretme, onaylama, bloke etme ve not ekleme aksiyonları iş bazında standartlaştırılır.

### Faz 4: Kural Yönetimi Tek Merkez

1. Dosya adı, anahtar kelime, dosya tipi, override ve workflow routing kuralları tek bir yönetim merkezi altında birleştirilir.
2. Kural önceliği, çakışma görünürlüğü ve test/önizleme ekranı eklenir.
3. Kural değişikliğinin etkileyeceği olası workflow sonucu simüle edilebilir hale getirilir.

### Faz 5: Adil Performans ve Puanlama

1. Her iş adımı için hedef süre, bekleme süresi, aktif çalışma süresi ve bloke süresi ayrıştırılır.
2. Puanlama sadece ham hız üstünden kurulmaz.
3. Kullanıcının elinde olmayan nedenler için “beklemede”, “bağımlılık bekliyor”, “malzeme bekliyor”, “onay bekliyor” gibi durumlar eklenir.
4. Puan formülü kalite, süre, hacim, tekrar iş, devir oranı ve bloke gerekçesi ile dengelenir.
5. Admin panelinde puan kırılımı açıklanabilir şekilde gösterilir.

### Faz 6: Gerçek Kullanım Başlatma

1. Seed ve demo akışlardan üretim benzeri kullanım akışına geçilir.
2. Login zorunlu hale getirilir.
3. Yetkisiz route erişimi engellenir.
4. Operasyon kayıtları, iş geçmişi ve kullanıcı aksiyonları izlenebilir olur.
5. Temel smoke ve kritik backend testleri tamamlanır.

## Eklenmesi Gereken, İlk Listede Olmayan Özellikler

1. İlk admin bootstrap akışı
2. Şifre politikası ve şifre değiştirme ekranı
3. Oturum zaman aşımı ve güvenli çıkış
4. Yetkisiz işlem denemeleri için audit kaydı
5. İş devretme nedeni zorunluluğu
6. İş iptal, bloke ve tekrar açma neden kodları
7. SLA ve hedef süre şablonları
8. Departman bazlı kapasite ve iş yükü görünürlüğü
9. Kullanıcı profilinde günlük/haftalık iş yükü trendi
10. Puan değişim geçmişi
11. Yöneticinin manuel puan düzeltme yetkisi için gerekçe alanı
12. Bildirim veya görev kutusu altyapısı
13. Gerçek kullanım öncesi seed temizliği ve veri geçiş planı
14. Hata mesajlarının tamamen Türkçe ve tutarlı hale getirilmesi

## Profesyonel Sistemlerden Esinlenilmesi Gereken Kurgu Başlıkları

1. RBAC: rol tabanlı erişim kontrolü
2. Assignment policy: işi doğru departman ve doğru kullanıcıya atama
3. SLA pause/resume: dış bağımlılık yüzünden geçen süreyi ayırma
4. Auditability: her kritik aksiyonun sebebi ve zamanı kayıtlı olmalı
5. Explainable scoring: puan neden arttı veya düştü açıklanabilir olmalı
6. Human override: admin gerektiğinde kontrollü istisna yapabilmeli

## Uygulama Sırası Özeti

1. Backend domain ve auth kontratı
2. Login ve session altyapısı
3. Kullanıcı/rol/departman yönetimi
4. Admin ve çalışan sayfa ayrımı
5. İş listesi ve detay paneli
6. Görev aksiyonları
7. Kural merkezi birleşimi
8. Profil, geçmiş iş ve performans ekranları
9. Puanlama motoru
10. Gerçek kullanım ve hardening
