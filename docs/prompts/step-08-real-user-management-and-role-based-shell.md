# Step 08 - Real User Management and Role Based Shell

Bu adımda amaç, gerçek kullanıcı yönetimini kurmak ve admin ile standart kullanıcı deneyimini ayırmaktır.

## Zorunlu Kurallar

1. Mevcut çalışan sistemleri bozma.
2. Büyük refactor yapma.
3. Kullanıcıya görünen metinler Türkçe olacak.
4. Türkçe karakter bozulması yapma.

## Hedefler

1. Kullanıcı oluşturma alanı ana operasyon ekranından çıkarılsın.
2. Ayrı bir kullanıcı yönetim sayfası oluşsun.
3. Admin dashboard görsün, diğer kullanıcılar kendi çalışma alanına yönlensin.
4. Rol ve departman yönetimi gerçek kullanım senaryosuna uygun hale gelsin.

## Yapılacaklar

1. Yeni sayfa aç:
   - `Kullanıcı ve Yetki Yönetimi`
2. Bu sayfaya şu bölümleri ekle:
   - kullanıcı listesi
   - kullanıcı oluşturma formu
   - rol değiştirme
   - departman değiştirme
   - aktif/pasif yapma
3. Gerçek kullanıcı oluşturma akışını backend ile tamamla.
4. Kullanıcı profiline en az şu alanları ekle:
   - ad soyad
   - e-posta
   - rol
   - departman
   - aktiflik
   - son giriş
5. Shell seviyesinde role göre yönlendirme uygula:
   - `admin` -> dashboard veya yönetim ağırlıklı ana ekran
   - `worker` -> kendi iş listesi
   - `manager` -> operasyon ve ekip görünümü
6. Navigation menüsünü role göre filtrele.
7. Kullanıcı oluşturma alanını `Operasyon Merkezi` ekranından kaldır veya sadece özet link bırak.
8. Admin için kullanıcı detay görünümüne şunları hazırla:
   - aktif işler
   - geçmiş işler
   - temel performans özeti
9. Edit ve delete/pasif yap ikonlarını sade ve anlaşılır şekilde ekle.

## Kabul Kriterleri

1. Kullanıcı oluşturma artık ayrı sayfadan yapılır.
2. Admin ve worker aynı ilk sayfaya düşmez.
3. Navigation yetkisiz ekranları göstermez.
4. Kullanıcı listesi rol ve departman bilgisi ile birlikte görünür.

## Test ve Doğrulama

1. Farklı rollerle giriş smoke testi yap.
2. Kullanıcı oluşturma ve pasife alma akışını test et.
3. Yetkisiz kullanıcının yönetim sayfasına erişemediğini doğrula.

## Teslim Sonu Raporu

İş bitince mutlaka şunları yaz:

1. Değiştirilen dosyalar
2. Oluşturulan dosyalar
3. Test etmek için ne yapmam gerektiği
4. Riskli noktalar
5. Commit mesajı
6. Bir sonraki adım için bilgi
