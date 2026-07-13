# Step 10 - Task Actions, History and Admin Observability

Bu adımda amaç, kullanıcıların iş üzerinde gerçek aksiyon alabilmesi ve admin tarafının canlı/geçmiş operasyonu izleyebilmesidir.

## Zorunlu Kurallar

1. Mevcut çalışan sistemleri bozma.
2. Büyük refactor yapma.
3. Kullanıcıya görünen metinler Türkçe olacak.
4. Türkçe karakter bozulması yapma.

## Hedefler

1. Kullanıcı verilen işleri görebilsin.
2. Kullanıcı onayla, devret, not ekle, engel bildir gibi aksiyonları alabilsin.
3. Admin canlı işleri ve geçmiş işleri filtreleyebilsin.
4. Kullanıcı profilinden iş geçmişi ve süre performansı görülebilsin.

## Yapılacaklar

1. İş aksiyonlarını standardize et:
   - onayla
   - devret
   - bloke et
   - tekrar aç
   - not ekle
2. Devretme ve bloke etme için gerekçe alanı zorunlu yap.
3. Kullanıcı çalışma alanına şu sekmeleri ekle:
   - bekleyen işlerim
   - üzerinde çalıştıklarım
   - tamamladıklarım
   - devrettiklerim
4. Admin için şu görünümleri ekle:
   - canlı işler
   - geçmiş işler
   - kullanıcı bazlı iş listesi
   - departman bazlı yoğunluk
5. Kullanıcı profil sayfası veya detay ekranı ekle:
   - tamamladığı işler
   - ortalama tamamlama süresi
   - bloke ettiği işler
   - devrettiği işler
   - tekrar açılan işler
6. Audit görünümünü iş aksiyonları için daha okunur hale getir.
7. Durum değişimlerinin kim tarafından ve hangi nedenle yapıldığını sakla.

## Kabul Kriterleri

1. Kullanıcı kendi işlerini net şekilde görür.
2. Onayla/devret/bloke et akışları backend üzerinden kayıtlı çalışır.
3. Admin canlı ve geçmiş işi ayrı filtrelerle görebilir.
4. Kullanıcı profilinde iş geçmişi görünür.

## Test ve Doğrulama

1. Bir iş üzerinde worker aksiyonlarını dene.
2. Admin görünümünde aynı işin geçmişini doğrula.
3. Audit satırlarının aksiyon ve gerekçe içerdiğini kontrol et.

## Teslim Sonu Raporu

İş bitince mutlaka şunları yaz:

1. Değiştirilen dosyalar
2. Oluşturulan dosyalar
3. Test etmek için ne yapmam gerektiği
4. Riskli noktalar
5. Commit mesajı
6. Bir sonraki adım için bilgi
