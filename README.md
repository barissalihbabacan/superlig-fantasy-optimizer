# Süper Lig Fantasy Optimizer

Süper Lig Fantasy Optimizer, Türkiye Süper Lig fantezi futbolu oynayan kullanıcıların haftalık kadrolarını oluşturmasına yardımcı olan bağımsız, ücretsiz ve açık kaynaklı bir analiz ve optimizasyon aracıdır. Proje, kararları desteklemek için oyuncu, bütçe, fikstür ve beklenen performans verilerini birlikte değerlendirmeyi amaçlar.

## Projenin amacı

Amaç yalnızca toplam performansı yüksek oyuncuları sıralamak değildir. Oyuncuların;

- fiyatını,
- pozisyonunu,
- fikstürünü,
- beklenen dakika ve ilk 11 olasılığını,
- gol ve asist beklentisini,
- clean sheet olasılığını,
- kart ve diğer negatif puan risklerini,
- maç bonusu potansiyelini

birlikte değerlendirmek hedeflenir.

Temel hedef, “en iyi futbolcuları” seçmek değil; oyun kuralları ve bütçe kısıtları altında beklenen verimliliği en yüksek kadroyu bulmaktır. Son karar her zaman kullanıcıya aittir.

## Temel özellikler

- 15 kişilik kadro optimizasyonu
- 100M TL bütçe sınırı
- Pozisyon kısıtlarına uygun kadro oluşturma
- Takım başına en fazla 3 oyuncu
- İlk 11 optimizasyonu
- Yedek sıralaması önerisi
- Kaptan ve vice kaptan önerisi
- Oyuncu fiyat/puan analizi
- Fikstür analizi
- Beklenen fantasy puanı hesaplama
- Transfer önerileri
- İleride menajer kartı desteği
- İleride Nostradamus desteği

## Fantasy puanlama sistemi

Optimizer, aşağıdaki mevcut oyun kurallarını modellemeyi hedefler:

| Olay | Puan |
| --- | ---: |
| 60 dakika oynamak | +1 |
| 60 dakikadan fazla oynamak | +2 |
| Kaleci golü | +10 |
| Defans golü | +6 |
| Orta saha golü | +5 |
| Forvet golü | +4 |
| Asist | +3 |
| Kaleci/defans clean sheet | +4 |
| Orta saha clean sheet | +1 |
| Her 3 kaleci kurtarışı | +1 |
| Penaltı kurtarışı | +5 |
| Penaltı kaçırma | -2 |
| Kaleci/defansta her 2 yenilen gol | -1 |
| Sarı kart | -1 |
| Kırmızı kart | -3 |
| Kendi kalesine gol | -2 |
| Maç bonusları | 3 / 2 / 1 |
| Kaptan puanı | 2x |

Bu puanlama, oyunun mevcut kurallarına göre modellenmektedir. Oyun kuralları değişirse puanlama motorunun ve ilgili analizlerin güncellenmesi gerekir.

## Kadro kuralları

Standart kadro yapısı şöyledir:

- 2 kaleci
- 5 defans
- 5 orta saha
- 3 forvet
- Toplam 100M bütçe
- Aynı takımdan en fazla 3 oyuncu
- İlk 11'de en az 1 kaleci, 3 defans ve 1 forvet

İlk 11 ve yedekler oluşturulurken oyuncunun oynama ihtimali, pozisyonu ve beklenen katkısı dikkate alınır. Otomatik oyuncu değişikliği, ilk 11'deki bir oyuncu maça çıkmadığında kadro kurallarını bozmadan ve yedek sırasını izleyerek uygun bir yedek oyuncunun devreye girmesi mantığıyla ele alınır. Nihai uygulama, oyunun güncel otomatik değişiklik kurallarıyla uyumlu olmalıdır.

## Yerel-first mimari

Projenin backend gerektirmemesi ve temel olarak tarayıcıda çalışması hedeflenmektedir. Hedeflenen veri akışı şöyledir:

```text
JSON veri dosyaları
        -> tarayıcı
        -> IndexedDB
        -> optimizer
        -> kullanıcı arayüzü
```

İlk açılışta repository içinde bulunan JSON verilerinin tarayıcıdaki IndexedDB alanına aktarılması, sonraki kullanımlarda ise mümkün olduğunca yerel verinin kullanılması planlanmaktadır. Kullanıcı verilerinin sunucuya gönderilmemesi hedeflenir. Bu yaklaşım; gizlilik, çevrimdışı kullanım ve düşük altyapı ihtiyacı açısından önemlidir.

## Veri kaynakları

Kullanılan kamuya açık futbol verilerinin kaynakları açıkça belirtilecektir. Türkiye Futbol Federasyonu'nun kamuya açık verileri kullanılabilir; ancak bu proje TFF'nin resmi ürünü değildir. İleride farklı açık veya lisanslı veri sağlayıcıları da değerlendirilebilir.

Farklı kaynaklardan alınan veriler, proje için tanımlanacak kendi JSON şemamızda normalize edilecektir. Kaynakların kullanım koşulları, atıf gereklilikleri ve yeniden kullanım izinleri ayrıca gözetilecektir.

## TFF ile bağımsızlık bildirimi

> **Bu proje Türkiye Futbol Federasyonu (TFF) tarafından geliştirilmemiştir, desteklenmemektedir, onaylanmamıştır, yayınlanmamıştır ve TFF ile herhangi bir kurumsal bağlantısı bulunmamaktadır.**

Bu proje:

- TFF'nin resmi fantasy uygulaması değildir.
- TFF'nin yerine geçen bir uygulama değildir.
- Yalnızca TFF Fantasy Lig oynayan kullanıcılar için bağımsız bir yardımcı araçtır.

Buradaki “yayınlanmamıştır” ifadesi, projenin TFF tarafından resmi olmayan anlamında kullanılmaktadır. Projenin TFF tarafından yayınlandığı veya dağıtıldığı izlenimi oluşturulamaz. TFF adı, logosu, marka unsurları ve görsel kimliği TFF'ye aittir.

## Ticari amaç ve gelir

Bu proje;

- ücretsiz,
- açık kaynak,
- reklamsız,
- aboneliksiz ve
- ticari amaç taşımayan

bir topluluk projesi olarak tasarlanmaktadır.

İsteğe bağlı kullanıcı bağışları herhangi bir özellik, veri veya avantaj karşılığında değildir. Bağışlar projeyi ücretli bir hizmete dönüştürmez ve kullanıcılar arasında ücret karşılığı ayrıcalık oluşturmaz.

## Topluluk tarafından geliştirme

Süper Lig Fantasy Optimizer tek bir geliştiriciye ait kapalı bir ürün olarak tasarlanmamaktadır. Proje topluluk katkılarına açıktır. Issue, Pull Request, veri düzeltmesi, modelleme ve algoritma katkıları memnuniyetle karşılanır.

## Hukuki bilgilendirme

Bu README veya proje hukuki tavsiye vermez. Kamuya açık veriler kullanılırken ilgili kaynakların kullanım koşullarına uyulacaktır. TFF'nin veya başka bir veri sağlayıcının içerik, marka ya da diğer haklarını ihlal etmek projenin amacı değildir.

## Cease and Desist / Hak talepleri

İçerik, veri, marka veya başka bir unsur üzerinde hak sahibi olduğunu düşünen kişi ya da kurumlar proje sahibiyle iletişime geçebilir:

**[İLETİŞİM ADRESİ BURAYA EKLENECEK]**

Haklı ve doğrulanabilir bir talep geldiğinde ilgili veri veya içerik incelenecek; gerekli görülürse kaldırılabilecek ya da değiştirilebilecektir. İnceleme sürecinde kaynak bilgileri, kullanım koşulları ve talebin dayanağı dikkate alınır.

## Lisans

Kaynak kodu için lisans seçimi ayrıca yapılacaktır.

Kaynak kodu lisansı ile veri dosyalarının lisans ve kullanım koşulları birbirinden ayrı değerlendirilebilir. Veri dosyaları için her kaynağın kendi izinleri ve kısıtları geçerlidir.

## Gizlilik

Projenin yerel-first yaklaşımı kapsamında aşağıdaki ilkeler hedeflenmektedir:

- Hesap gerektirmemesi
- Backend kullanmaması
- Kullanıcı kadrosunun sunucuya gönderilmemesi
- Reklam takip sistemi içermemesi
- Kullanıcı verilerinin satılmaması
- Verilerin mümkün olduğunca tarayıcı içinde tutulması

Tarayıcı depolama alanının temizlenmesi veya cihaz değişikliği gibi durumlarda yerel verilerin kaybolabileceği kullanıcıya açıkça bildirilmelidir.

## Yol haritası

MVP ve sonraki geliştirmeler için öngörülen sıra:

1. Veri modeli
2. JSON veri yapısı
3. IndexedDB entegrasyonu
4. Puanlama motoru
5. Oyuncu projeksiyonu
6. Kadro optimizer'ı
7. İlk 11 optimizer'ı
8. Kaptan ve vice kaptan önerileri
9. Fikstür analizi
10. Transfer önerileri
11. Menajer kartları
12. Nostradamus
13. Risk analizi
14. Topluluk katkıları için süreç ve araçlar

Yol haritası, veri erişimi ve oyunun kurallarındaki değişikliklere göre güncellenebilir.

## Teknik yaklaşım

Teknoloji yığını henüz kesinleştirilmemiştir. Bu nedenle belirli bir framework veya araç kesinleşmiş gibi değerlendirilmemelidir. Projenin hedeflenen teknik yaklaşımı client-side, local-first ve veri odaklı bir mimaridir. Hesaplama mantığının, yerel veri saklamanın ve kullanıcı arayüzünün mümkün olduğunca ayrıştırılabilir olması amaçlanır.

## Katkıda bulunma

Katkıda bulunmak isteyenler şu yolları izleyebilir:

1. Bir issue açarak problemi veya öneriyi paylaşın.
2. Yaklaşım ve etkileri toplulukla tartışın.
3. Bir Pull Request gönderin.
4. Veri hatalarını, eksik kaynakları veya güncellik sorunlarını bildirin.
5. Algoritma ve optimizasyon iyileştirmeleri önerin.

Katkılarda veri kaynağının, kullanılan varsayımların ve değişikliğin beklenen etkisinin açıklanması yararlı olur.

## Veri doğruluğu uyarısı

Optimizer tahmin ve modelleme yapar; hiçbir öneri garanti değildir. Oyuncu dakikaları, sakatlıklar, teknik tercihler, maç içi olaylar ve diğer etkenler sonuçları değiştirebilir. Futbol yüksek varyanslı bir spordur. Öneriler karar desteği olarak görülmeli, kadro seçiminden önce güncel bilgiler kullanıcı tarafından kontrol edilmelidir.

## Proje mottosu

> **Veriyi analiz et. Bütçeyi optimize et. Kadronu kur.**
