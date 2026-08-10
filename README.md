# Süper Lig Fantasy Optimizer

Süper Lig Fantasy Optimizer (`sf`), Trendyol Süper Lig Fantasy kadrolarını
doğrulamak, fantasy puanlarını hesaplamak, oyuncu projeksiyonlarını incelemek
ve bütçe kısıtları altında deterministik kadro önerileri üretmek için yazılmış
bağımsız bir Rust CLI projesidir.

## Özellikler

- Rust CLI (`sf`)
- Fantasy scoring engine
- Squad validation
- 15 oyunculuk kadro: 2 GK, 5 DEF, 5 MID, 3 FWD
- 11 kişilik starting XI ve 4 kişilik bench
- 8 desteklenen formasyon
- Bütçe kısıtı
- Takım başına en fazla 3 oyuncu
- Captain / vice captain seçimi
- Son maçlara dayalı historical projection altyapısı
- Gelecek fixture context çözümlemesi
- Deterministik optimizer
- JSON veri okuma ve JSON çıktı
- Dataset ve referans bütünlüğü doğrulaması

Mevcut maç kayıtları gerçek 2026-27 oyuncu performanslarını içermediği için
production projection coverage şu anda 0 olabilir. Eşleşen gerçek performans
verisi yoksa expected points değeri 0 kalır; proje eksik veriyi uydurmaz.

## Gereksinimler

- Rust stable
- Cargo

Bağımlılıklar Cargo tarafından `Cargo.toml` üzerinden yönetilir.

## Kurulum

Standart kurulum:

```bash
cargo install --path .
sf version
sf --help
```

Geliştirme çalıştırması:

```bash
cargo run --bin sf -- --help
cargo run --bin sf -- optimize --budget 10000 --formation 3-5-2
```

Release binary oluşturma:

```bash
cargo build --release
./target/release/sf version
```

CLI varsayılan dataset yolunu çalışma dizininde, executable yanında veya
Cargo manifest dizininde arar. Farklı bir dataset konumu için `SF_DATA_DIR`
ortam değişkeni kullanılabilir. `sf data` komutlarında `--path` açık yolu
öncelikli olarak kullanır.

## Dataset

Sezon dataset'i `data/2026-27/` altında bulunur:

- `teams.json`: takım kimlikleri ve adları
- `players.json`: oyuncu kimlikleri, takımları, pozisyonları ve fiyatları
- `fixtures.json`: sezon fikstürü
- `projections.json`: manuel veya türetilmiş projection kayıtları
- `matches/`: ham maç ve oyuncu performansı kayıtları

Dataset dosyaları proje kapsamında manuel olarak yönetilir. Otomatik scraping,
API veya ağ üzerinden veri alma sistemi bulunmamaktadır. JSON dosyalarındaki
`source` metadata alanı, mevcut kayıt için kaynak bağlamını taşıyabilir.

## Veri Kaynakları

Veri kaynakları, mevcut dataset kayıtlarında bulunan metadata ve repository
bağlamı ölçüsünde değerlendirilmelidir. Bu proje tüm verilerin belirli bir
kurum tarafından sağlandığını veya doğrulandığını iddia etmez. Veri katkıları
kaynak bilgisiyle birlikte sunulmalı ve ilgili kullanım koşulları ayrıca
incelenmelidir.

## CLI Kullanımı

```bash
sf version
sf --help
sf rules
sf formation list
sf formation show 3-5-2
sf projection stats
sf projection validate
sf projection show PLAYER_ID
sf projection calculate --dry-run
sf optimize --budget 10000
sf optimize --budget 10000 --formation 3-5-2
sf validate data/2026-27/players.json
sf score --input performance.json
```

Tam komut ve seçenek listesi için `sf --help` çıktısı kullanılmalıdır.

`--format json` destekleyen komutlar makine tarafından işlenebilir JSON çıktı
üretir. Örneğin:

```bash
sf optimize --budget 10000 --formation 3-5-2 --format json
sf projection stats --format json
```

## Optimizer

Optimizer şu girdileri kullanır:

- oyuncular
- fiyatlar
- pozisyonlar
- takım başına oyuncu limiti
- bütçe
- mevcut projection değerleri

Sonuçta şunları üretir:

- 15 oyunculuk squad
- seçilen formasyona uygun starting XI
- kalan 4 oyuncudan oluşan bench
- captain ve vice captain
- toplam maliyet
- expected points

Uygulanan temel kısıtlar:

- 15 oyuncu
- 2 GK, 5 DEF, 5 MID, 3 FWD
- takım başına en fazla 3 oyuncu
- toplam maliyet bütçeyi aşamaz
- starting XI seçilen formasyona uymalıdır
- lineup ve bench oyuncuları birbirinden farklı olmalıdır

Bütçe fiyat birimleriyle ifade edilir; `10000`, 100M TL bütçeye karşılık gelir.

## Formations

Desteklenen formasyonlar:

- 3-5-2
- 3-4-3
- 4-3-3
- 4-4-2
- 4-5-1
- 5-4-1
- 5-3-2
- 5-2-3

Her formasyonda kaleci sayısı 1’dir ve formasyon yalnızca starting XI
dağılımını belirler. Squad pozisyon dağılımı her zaman 2 GK / 5 DEF / 5 MID /
3 FWD olarak kalır.

## Scoring

Scoring engine ham maç performansından fantasy puanı üretir. Mevcut kurallar
arasında dakika, pozisyona göre gol, asist, clean sheet, kurtarış, penaltı,
kart, kendi kalesine gol, yenilen gol ve maç bonusu puanları bulunur. Captain
çarpanı scoring kurallarında 2x olarak uygulanır.

## Projection

Historical projection sistemi:

- Son 5 oynanan maçı kullanır.
- Ağırlıklar `[1, 2, 3, 4, 5]` şeklindedir.
- En yeni maç en yüksek ağırlığı alır.
- Dakikası 0 olan performanslar hesaba katılmaz.
- Oyuncunun eşleşen performansı yoksa expected points `0` olur.
- Gelecek en fazla 3 fixture metadata olarak gösterilir.
- Difficulty güvenilir veri yoksa `Unknown` kalır.
- Rastgele xG, sakatlık, home advantage veya takım gücü üretilmez.

Fixture context home/away ve rakip bilgisi sağlayabilir; güvenilir, kalibre
edilmiş bir difficulty modeli yoksa historical weighted average değiştirilmez.
Sezon başlamadan veya gerçek performans verisi eşleşmeden projection coverage
0 olabilir.

## Data Quality

Veriler manuel olarak yönetildiği için güncellik, doğruluk, eksiksizlik veya
belirli bir amaca uygunluk garanti edilmez. Dataset resmi gerçek zamanlı bir
feed değildir. Kullanıcılar verileri ve optimizer çıktılarını kendi
kararlarının tek veya kesin kaynağı olarak kullanmamalıdır.

## TFF / Bağımsızlık

Süper Lig Fantasy Optimizer, Türkiye Futbol Federasyonu (TFF) ile resmi,
ticari veya kurumsal bağlantısı olmayan bağımsız bir projedir. TFF’nin resmi
ürünü, servisi, uygulaması veya veri sağlayıcısı değildir.

TFF adı, yalnızca ilgili futbol organizasyonunu, ligi veya veri bağlamını
açıklamak amacıyla referans olarak anılmaktadır. TFF tarafından geliştirilmiş,
onaylanmış, desteklenmiş veya işletilmiş izlenimi oluşturulmamalıdır. TFF
logosu veya kurumsal marka kimliği kullanılmamalıdır.

## Yasal Uyarı ve Sorumluluk Reddi

Projede yer alan oyuncu bilgileri, takım kadroları, oyuncu değerleri veya
fiyatları, puan durumları ve benzeri bilgiler proje kapsamında manuel olarak
girilmiş ve kaydedilmiştir. Bu bilgiler resmi hukuki, finansal, sportif veya
profesyonel tavsiye niteliğinde değildir.

Optimizer çıktıları yalnızca bilgi ve karar desteği amacı taşır. Proje;
bahis, kumar, finansal yatırım veya benzeri yüksek riskli kararlar için
garanti, kesin tahmin veya kazanç vaadi sunmaz. Kullanıcıların proje
çıktılarından hareketle aldığı kararların sonuçları kendilerine aittir. Bu
açıklama, yürürlükteki emredici hukuk kuralları kapsamındaki hak ve
yükümlülükleri ortadan kaldırmaz.

Proje mevcut kullanım modeli kapsamında ticari gelir, ücretli üyelik, satış,
bahis geliri, reklam geliri veya benzeri bir ticari kazanç elde etme amacı
taşımamaktadır.

Bu metin hukuki danışmanlık değildir.

## İletişim ve Sorun Bildirme

Veri hatası, telif veya fikri mülkiyet iddiası, içerik kaldırma talebi ya da
projeyle ilgili başka bir sorun için aşağıdaki e-posta adresinden iletişim
kurulabilir:

`barissalihbabacan@gmail.com`

Telefon numarası paylaşılmamaktadır.

## Lisans

Bu proje [MIT License](LICENSE) kapsamında lisanslanmıştır. Veri dosyalarının
kullanım koşulları, kaynaklarına göre ayrıca değerlendirilmelidir.

## Development

Değişikliklerden önce ve sonra şu kontroller çalıştırılmalıdır:

```bash
cargo fmt --check
cargo test
cargo clippy --all-targets --all-features -- -D warnings
```

## Project Structure

```text
src/
├── data/               # JSON modelleri, yükleme ve validation
├── error.rs            # Veri ve domain hataları
├── models.rs           # Puanlama ve kadro domain modelleri
├── optimizer.rs        # Formation, lineup ve squad optimizer
├── projection_engine.rs # Historical projection ve fixture context
├── rules.rs            # Scoring ve squad kuralları
├── scoring.rs          # Ham performans -> fantasy puanı
└── main.rs             # sf CLI
data/2026-27/           # Sezon JSON dataset'i
tests/                  # CLI, data, scoring ve projection testleri
```

## Roadmap

Aşağıdaki konular, mevcut veri ve doğrulama kapsamı genişlediğinde ele
alınabilecek planlı çalışmalardır; şu anda tamamlanmış özellik olarak
sunulmaz:

- Gerçek ve schema ile eşleşen maç performanslarının eklenmesi
- Projection coverage’ın sezon verisi geldikçe artırılması
- Fixture context için doğrulanabilir difficulty modelinin geliştirilmesi

## Katkıda Bulunma

Katkı süreci için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasına bakın.

## Güvenlik

Güvenlik bildirimleri için [SECURITY.md](SECURITY.md) dosyasındaki iletişim
adresini kullanın.
