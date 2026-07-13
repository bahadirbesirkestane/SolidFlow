# ADR-0001 Frontend Reset

## Durum

Kabul edildi.

## Baglam

Mevcut frontend `window`, global template registry, string tabanli HTML uretimi ve daginik `innerHTML` render akisi ile calisiyor.
Bu yapi:

- buyuk ekranlarda bile layout kirilmalari uretiyor
- state, event ve markup baglarini dagitiyor
- test ve refactor maliyetini yukseltiriyor
- ayni sayfada birden fazla render kaynagi olusturuyor

## Karar

Yeni frontend omurgasi `React + Vite + TypeScript + TanStack Query` ile kurulacak.

Kurallar:

- yeni ekranlar legacy shell'e eklenmeyecek
- yeni route ve navigation typed config ile yonetilecek
- UI primitive seti ortak bir design system altinda tanimlanacak
- `Operasyon Merkezi` ilk migration hedefi olacak

## Sonuclar

Olumlu:

- component tabanli ve testlenebilir yapi
- typed route ve veri akisi
- daha guvenilir responsive davranis
- sayfa bazli temiz migration

Maliyet:

- kisa vadede legacy ile yeni shell birlikte yasar
- yeni build ve toolchain kurulur
- migration tamamlana kadar iki arayuz katmani izlenir

## Uygulama Notu

Step 05 ve Step 06 sonrasinda:

- ana uygulama rota sahipligi `/app` altindadir
- legacy ekranlar yalniz `/legacy` altinda gecici olarak korunur
- kok route yeni shell'e yonlenir ve tasinmis ekranlar legacy registry'de sahiplik almaz
