# Step 11 - Centralized Rule Management and Routing Governance

Bu adımda amaç, dosya adına göre iş akışı oluşturma için kullanılan tüm kural kaynaklarını tek merkezden yönetmektir.

## Zorunlu Kurallar

1. Mevcut çalışan sistemleri bozma.
2. Büyük refactor yapma.
3. Kullanıcıya görünen metinler Türkçe olacak.
4. Türkçe karakter bozulması yapma.

## Hedefler

1. Dosya tipi, dosya adı, keyword, override ve workflow routing kuralları tek yönetim yüzeyinde birleşsin.
2. Kural önceliği ve çakışma görünürlüğü net olsun.
3. Bir dosyanın neden belirli workflow’a gittiği açıklanabilsin.

## Yapılacaklar

1. Mevcut kural ekranlarını tek merkezli bilgi mimarisine taşı.
2. Kural tiplerini tek sayfada sekmeli veya bölmeli kurgula:
   - dosya tipi
   - dosya adı
   - keyword
   - override
   - workflow routing
3. Her kural için şu alanları görünür kıl:
   - etkin/pasif
   - öncelik
   - eşleşme koşulu
   - hedef süreç / hedef workflow
   - açıklama
4. “Bu dosya nasıl sınıflanır?” önizleme aracı ekle.
5. Çakışan kuralları işaretle.
6. Kural değişikliğinin sonuca etkisini açıklayan özet üret.
7. Kural değişikliği audit kaydı oluştur.

## Kabul Kriterleri

1. Tüm routing kuralları tek merkezden yönetilir.
2. Bir dosyanın hangi kural yüzünden belirli akışa gittiği görülebilir.
3. Çakışan veya riskli kurallar görünür işaretlenir.

## Test ve Doğrulama

1. Mevcut örnek dosya adlarıyla kural önizleme testleri yap.
2. Kural değiştirip tarama sonucunun güncellendiğini doğrula.
3. Audit tarafında kural değişikliği kaydını kontrol et.

## Teslim Sonu Raporu

İş bitince mutlaka şunları yaz:

1. Değiştirilen dosyalar
2. Oluşturulan dosyalar
3. Test etmek için ne yapmam gerektiği
4. Riskli noktalar
5. Commit mesajı
6. Bir sonraki adım için bilgi
