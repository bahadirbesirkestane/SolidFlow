# Step 12 - Fair Scoring, Performance and Production Readiness

Bu adımda amaç, kullanıcıyı koruyan adil bir performans sistemi kurmak ve gerçek kullanım öncesi son hazırlığı yapmaktır.

## Zorunlu Kurallar

1. Mevcut çalışan sistemleri bozma.
2. Büyük refactor yapma.
3. Kullanıcıya görünen metinler Türkçe olacak.
4. Türkçe karakter bozulması yapma.
5. Puanlama sistemi cezalandırıcı değil, açıklanabilir ve adil olmalı.

## Hedefler

1. Her iş için süre ve kalite ölçüleri tanımlansın.
2. Kullanıcının elinde olmayan gecikmeler ayrı kategoride izlensin.
3. Admin kullanıcı performansı ve puanı açıklanabilir biçimde görebilsin.
4. Sistem gerçek kullanım başlangıcı için yeterince güvenli hale gelsin.

## Yapılacaklar

1. İş/iş adımı metrik modelini genişlet:
   - hedef süre
   - aktif çalışma süresi
   - bekleme süresi
   - bloke süresi
   - yeniden işleme sayısı
   - devir sayısı
2. Bloke neden kodları tasarla:
   - malzeme bekliyor
   - dış onay bekliyor
   - teknik belirsizlik
   - başka departman bekleniyor
   - sistemsel engel
3. Puanlama motoru tasarla:
   - hız
   - kalite
   - hacim
   - yeniden iş
   - devir oranı
   - bloke edilen dış nedenler
4. Açıklanabilir puan özeti üret:
   - puan neden yükseldi
   - puan neden düştü
5. Admin profil görünümüne ekle:
   - kullanıcı bazlı puan
   - iş bazlı ortalama süre
   - departman kıyasları
   - manuel puan düzeltme geçmişi
6. Kullanıcı profilinde sade görünüm hazırla:
   - toplam tamamlanan iş
   - bu hafta tamamlanan iş
   - ortalama süre
   - kişisel puan özeti
7. Gerçek kullanım hazırlığı için:
   - varsayılan admin akışı
   - login zorunluluğu
   - yetkisiz route engeli
   - hata mesajı tutarlılığı
   - temel smoke checklist

## Kabul Kriterleri

1. Puanlama tek metrikli değil, dengeli ve açıklanabilir çalışır.
2. Kullanıcının elinde olmayan beklemeler puanı doğrudan bozmaz.
3. Admin kullanıcı bazlı performansı detaylı görebilir.
4. Sistem gerçek giriş akışı ile kullanılabilir hale gelir.

## Test ve Doğrulama

1. Farklı süre ve bloke senaryoları için puan hesap testleri yaz.
2. Hızlı ama düşük kaliteli, yavaş ama kaliteli ve dış engel kaynaklı örnekleri test et.
3. Login zorunluluğu ve yetki kısıtlarını yeniden smoke et.

## Teslim Sonu Raporu

İş bitince mutlaka şunları yaz:

1. Değiştirilen dosyalar
2. Oluşturulan dosyalar
3. Test etmek için ne yapmam gerektiği
4. Riskli noktalar
5. Commit mesajı
6. Bir sonraki adım için bilgi
