# Frontend Migration Checklist

Bir sayfa legacy shell'den yeni React shell'e tasinmadan tamamlanmis sayilmaz.

## Zorunlu Adimlar

1. Route yeni typed page config icine tasindi.
2. Sayfa state akisi tanimlandi.
3. API adapter veya query hook'lari yazildi.
4. Sayfa primitive bilesenlerle kuruldu.
5. Masaustu ve dar ekran dogrulandi.
6. Empty, loading ve error state'ler eklendi.
7. Legacy route/render baglantisi temizlendi.
8. Kabul notu veya dogrulama sonucu kaydedildi.

## Operasyon Merkezi Icin Ozel Kontrol

1. Sol rail proje listesi sabit hiyerarsi ile gorunuyor.
2. Ust sag yonetim panelleri ayri layout bolgesi olarak calisiyor.
3. `Secili Proje Calisma Alani` tam genislik alt blokta.
4. Acik isler ve audit ana alani ezmiyor.
5. `body` yatay scroll olusturmuyor.

## Step 06 Sonrasi Durum

Tamamlanan yeni shell ekranlari:

1. `Operasyon Merkezi`
2. `Kural Merkezi`
3. `Dashboard`
4. `Kullanici Is Alani`
5. `ERP Merkezi`

Route sahipligi:

1. Ana uygulama yolu `/app` altindadir.
2. Kok route build hazirsa yeni shell'e yonlenir.
3. Yalniz tasinmamis ekranlar `/legacy` altinda tutulur.

Kalan legacy alanlar:

1. `Tarama ve Is Akisi`
2. destek / bilgi / raporlama placeholder ekranlari

Release oncesi beklenti:

1. yeni gelistirme yalniz `apps/frontend/app` icinde devam eder
2. legacy alan yalniz gecici gecis bolgesi olarak ele alinir
