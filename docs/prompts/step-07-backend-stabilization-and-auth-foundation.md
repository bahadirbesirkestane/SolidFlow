# Step 07 - Backend Stabilization and Auth Foundation

Bu adımda amaç, yeni özelliklerin güvenle inşa edilebilmesi için backend omurgasını toparlamak ve authentication/authorization temelini kurmaktır.

## Zorunlu Kurallar

1. Mevcut çalışan sistemleri bozma.
2. Büyük refactor yapma.
3. Kullanıcıya görünen metinler Türkçe olacak.
4. Türkçe karakter bozulması yapma.
5. UI değişikliği gerekiyorsa sadece bu adımın backend ihtiyacı kadar minimal ilerle.

## Hedefler

1. Kullanıcı, rol, departman ve oturum modeli netleşsin.
2. Auth için veri modeli ve API kontratı oluşsun.
3. Yetki kontrolü presentation katmanında dağınık değil, policy/use-case tabanlı kurulsun.
4. Mevcut kullanıcı ve workflow akışları kırılmadan yeni auth altyapısına hazırlanmış olsun.

## Yapılacaklar

1. Mevcut backend endpointlerini auth ihtiyacına göre envanterle.
2. Kullanıcı domain modelini şu alanlarla gözden geçir:
   - `id`
   - `fullName`
   - `email`
   - `username` veya giriş kimliği
   - `role`
   - `departmentId`
   - `isActive`
   - `passwordHash`
   - `lastLoginAt`
3. Rol modelini en az şu şekilde tanımla:
   - `admin`
   - `manager`
   - `worker`
4. Yetki matrisi dokümante et:
   - hangi rol hangi endpointi görebilir
   - hangi rol hangi aksiyonu yapabilir
5. Session yaklaşımını seç:
   - cookie tabanlı session veya token tabanlı session
   - seçimin nedenini kısa notla kaydet
6. Auth endpointlerini tasarla ve uygula:
   - `POST /api/auth/login`
   - `POST /api/auth/logout`
   - `GET /api/auth/me`
7. Auth response shape’lerini yeni standartta düzenle:
   - `data`
   - `meta`
   - `error`
8. Şifre doğrulama, kullanıcı aktiflik kontrolü ve temel brute-force koruması ekle.
9. Route bazlı yetki koruması için backend policy katmanı oluştur.
10. Audit kayıtlarına login, logout, başarısız giriş ve kullanıcı yönetimi aksiyonlarını ekle.
11. Seed tarafında ilk admin kullanıcı bootstrap mekanizması kur.

## Kabul Kriterleri

1. Login olmayan kullanıcı korumalı endpointlere erişemez.
2. Admin olmayan kullanıcı admin endpointlerine erişemez.
3. `GET /api/auth/me` giriş yapan kullanıcının rol ve departman bilgisini döner.
4. Mevcut workflow, kural ve proje endpointleri auth eklenince bozulmaz.

## Test ve Doğrulama

1. Backend auth use-case testleri yaz.
2. Yetkisiz erişim testleri yaz.
3. Başarılı ve başarısız login senaryolarını test et.
4. Mevcut backend testleri tekrar çalıştır.

## Teslim Sonu Raporu

İş bitince mutlaka şunları yaz:

1. Değiştirilen dosyalar
2. Oluşturulan dosyalar
3. Test etmek için ne yapmam gerektiği
4. Riskli noktalar
5. Commit mesajı
6. Bir sonraki adım için bilgi
