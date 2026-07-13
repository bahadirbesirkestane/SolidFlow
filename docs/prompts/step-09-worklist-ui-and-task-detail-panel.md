# Step 09 - Worklist UI and Task Detail Panel

Bu adımda amaç, karmaşık görünümü sadeleştirip gerçek kullanım için iş listesini merkez yapmak.

## Zorunlu Kurallar

1. Mevcut çalışan sistemleri bozma.
2. Büyük refactor yapma.
3. Kullanıcıya görünen metinler Türkçe olacak.
4. Türkçe karakter bozulması yapma.
5. UI sade olacak; gereksiz kart yığını veya karmaşık görselleştirme kullanılmayacak.

## Hedefler

1. İşler liste halinde görünmeli.
2. Satıra tıklanınca iş detay/panel görünmeli.
3. Her işin kullanıcı süreç dağılımı anlaşılır biçimde açılmalı.
4. Edit ve delete ikonları yetki kontrollü çalışmalı.

## Yapılacaklar

1. İş akışı görünümünü kartlardan tablo/liste temelli yapıya taşı.
2. Liste kolonlarını tasarla:
   - iş kodu
   - iş adı
   - proje
   - mevcut adım
   - sorumlu kullanıcı/ekip
   - durum
   - hedef süre
   - geçen süre
   - öncelik
3. Satır tıklanınca sağ panel veya drawer aç:
   - iş adımları
   - departman dağılımı
   - kullanıcı atamaları
   - audit özeti
   - notlar
   - süre kırılımı
4. Satır aksiyonlarına ikon ekle:
   - düzenle
   - sil / iptal et
   - devret
   - detay aç
5. İşi silme yerine mümkünse önce güvenli statü değişimi değerlendir:
   - iptal
   - arşiv
6. Worker ekranında sadece kendisine ait işler ve uygun aksiyonlar göster.
7. Admin/manager ekranında filtre, durum ve kullanıcı bazlı görünüm ekle.
8. Açılan panelde “kimin üzerinde, hangi adımda, ne kadar süredir bekliyor” bilgisi net olsun.

## Kabul Kriterleri

1. İşler liste halinde sade şekilde görünür.
2. Satıra tıklayınca detay paneli açılır.
3. Süreç dağılımı ve kullanıcı atamaları anlaşılır şekilde görünür.
4. İkon aksiyonları yetki kontrolü ile çalışır.

## Test ve Doğrulama

1. Admin ve worker için ayrı ekran smoke testi yap.
2. Satır tıklama ve panel açma davranışını test et.
3. Edit/delete/devret aksiyonlarının görünürlük kurallarını doğrula.

## Teslim Sonu Raporu

İş bitince mutlaka şunları yaz:

1. Değiştirilen dosyalar
2. Oluşturulan dosyalar
3. Test etmek için ne yapmam gerektiği
4. Riskli noktalar
5. Commit mesajı
6. Bir sonraki adım için bilgi
