<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="Süper Lig Fantasy Optimizer — bütçe ve formasyon kısıtları altında matematiksel olarak en iyi 15 kişilik kadroyu bulan Rust ve WebAssembly motoru">
</p>

<p align="center">
  <a href="https://superlig-fantasy-optimizer.web.app">Canlı Demo</a>
  ·
  <a href="#kurulum">Kurulum</a>
  ·
  <a href="#kadro-kuralları">Kurallar</a>
  ·
  <a href="LICENSE">MIT Lisans</a>
</p>

<p align="center">
  <a href="https://github.com/barissalihbabacan/superlig-fantasy-optimizer/actions/workflows/ci.yml"><img src="https://github.com/barissalihbabacan/superlig-fantasy-optimizer/actions/workflows/ci.yml/badge.svg" alt="CI durumu"></a>
</p>

Süper Lig Fantasy Optimizer (`sf`), Trendyol Süper Lig Fantasy kadronu **tahmin etmeden** kurmanı sağlar: oyuncuları, fiyatları ve bütçeni verirsin; deterministik bir branch-and-bound arama, o kısıtlar altında **matematiksel olarak en iyi** 15 kişilik kadroyu bulur — greedy bir yaklaşım gibi bütçeyi göz ardı etmez, gerçek optimumu garanti eder.

## Kanıt

Gerçek 2026-27 sezon verisiyle, gerçek bir çalıştırma:

```text
$ sf optimize --budget 10000 --formation 4-3-3

BEST SQUAD

Budget: 10000
Cost: 7650
Remaining: 2350
Formation: 4-3-3

STARTING XI

GOALKEEPER
  Marcos Felipe de Freitas Monteiro  400    2.0 pts

DEFENDER
  Abdurrahim Dursun                 400    0.0 pts
  Ali Badra Diabaté                 400    0.0 pts
  Ali Ülgen                         400    0.0 pts
  Amadou Cissé                      400    0.0 pts

MIDFIELDER
  Leroy Aziz Sané                   850    7.0 pts
  Serdar Gürler                     500    5.0 pts
  İlkay Gündoğan                    550    2.0 pts

FORWARD
  Victor James Osimhen             1200   13.0 pts
  Jesús Andrés Ramírez Díaz         550    7.0 pts
  Abdou Khadre Sy                   400    0.0 pts

BENCH

1. Abdoulaye Serge Marc Dylan Yoro
2. Abdulsamed Damlu
3. Alexandre Matos
4. Amar Gërxhaliu

Captain: Victor James Osimhen
Vice Captain: Jesús Andrés Ramírez Díaz
Expected Points: 49.0
Total Cost: 7650
```

Sezon henüz yeni başladığı için çoğu oyuncunun `expected_points` değeri hâlâ `0` — proje bunu asla uydurmaz; gerçek maç verisi geldikçe projection coverage doğal olarak artar.

## Neden Farklı

Bir sürü fantasy aracı basit bir "en yüksek puanlıyı seç" sıralamasıyla çalışır; bu, bütçe kısıtı altında **yanlış** cevap verir. `sf` yerine tam bir branch-and-bound araması çalıştırır: her adayı bütçe, takım limiti ve formasyon kısıtlarına göre budar, en iyi kombinasyonu kanıtlanabilir şekilde bulur.

<p align="center">
  <img src="./assets/readme/architecture.svg" width="100%" alt="Bir Rust çekirdeği (rules, scoring, optimizer, projection_engine, data) hem sf CLI ikili dosyasını hem de WebAssembly üzerinden web arayüzünü besler">
</p>

Web arayüzü de aynı Rust motorunu doğrudan çağırır — `crates/wasm-bindings` ile derlenip WebAssembly olarak tarayıcıda çalışır. Ayrı bir TypeScript optimizer kopyası yok; kural bir kez yazılır, iki yerden kullanılır.

## Kurulum

```bash
cargo install --path .
sf version
sf optimize --budget 10000 --formation 3-5-2
```

Geliştirme çalıştırması:

```bash
cargo run --bin sf -- optimize --budget 10000 --formation 3-5-2
```

CLI, dataset'i çalışma dizininde, executable yanında veya Cargo manifest dizininde arar; farklı bir konum için `SF_DATA_DIR` ortam değişkeni kullanılabilir.

## Kullanım

```bash
sf rules
sf formation list
sf formation show 3-5-2
sf projection stats
sf projection show PLAYER_ID
sf optimize --budget 10000 --formation 3-5-2
sf validate data/2026-27/players.json
sf score --input performance.json
```

Tam liste için `sf --help`. `--format json` destekleyen komutlar makine tarafından işlenebilir çıktı üretir:

```bash
sf optimize --budget 10000 --formation 3-5-2 --format json
```

## Kadro Kuralları

| Kısıt | Değer |
| --- | --- |
| Kadro büyüklüğü | 15 oyuncu (2 GK, 5 DEF, 5 MID, 3 FWD) |
| Starting XI / Bench | 11 / 4 |
| Takım başına oyuncu | En fazla 3 |
| Bütçe | Fiyat birimi cinsinden (`10000` = 100.0M TL) |
| Kaptan çarpanı | 2x |

Optimizer bu kısıtların hiçbirini çiğnemez; bütçeyi aşan veya pozisyon dağılımını bozan bir kadro asla döndürmez.

## Formasyonlar

`3-5-2` `3-4-3` `4-3-3` `4-4-2` `4-5-1` `5-4-1` `5-3-2` `5-2-3`

Formasyon yalnızca starting XI dağılımını belirler; squad pozisyon dağılımı her zaman 2 GK / 5 DEF / 5 MID / 3 FWD'dir.

## Puanlama ve Projection

Scoring engine ham maç performansından (dakika, gol, asist, clean sheet, kurtarış, penaltı, kart, kendi kalesine gol, bonus) fantasy puanı üretir. Historical projection, oyuncunun son 5 maçının `[1,2,3,4,5]` ağırlıklı ortalamasını alır — en yeni maç en ağır basar, 0 dakikalık performanslar sayılmaz. Eşleşen gerçek performans yoksa expected points `0` kalır; rastgele xG, sakatlık veya takım gücü **uydurulmaz**.

## Dataset ve Veri Kalitesi

Sezon dataset'i `data/2026-27/` altında (`teams.json`, `players.json`, `fixtures.json`, `projections.json`, `matches/`) elle yönetilir — otomatik scraping veya canlı API bağlantısı yoktur; her dosyadaki `source` alanı kaynak bağlamını taşır. Veriler manuel yönetildiği için güncellik, doğruluk veya eksiksizlik garanti edilmez; dataset resmi gerçek zamanlı bir feed değildir ve kararların tek kaynağı olarak kullanılmamalıdır.

## TFF / Bağımsızlık

Süper Lig Fantasy Optimizer, Türkiye Futbol Federasyonu (TFF) ile resmi, ticari veya kurumsal bağlantısı olmayan bağımsız bir projedir; TFF'nin resmi ürünü, servisi veya veri sağlayıcısı değildir. TFF adı yalnızca ilgili ligi tanımlamak amacıyla anılır; TFF logosu veya kurumsal marka kimliği kullanılmaz.

## Yasal Uyarı

Projedeki oyuncu, kadro, fiyat ve puan bilgileri manuel girilmiştir ve resmi hukuki, finansal veya sportif tavsiye niteliği taşımaz. Optimizer çıktıları yalnızca bilgi ve karar desteği amaçlıdır; proje bahis, kumar veya finansal kararlar için garanti ya da kazanç vaadi sunmaz. Kullanıcıların kendi kararlarının sonuçları kendilerine aittir. Proje ticari gelir, ücretli üyelik veya bahis geliri amacı taşımaz. Bu metin hukuki danışmanlık değildir.

## İletişim

Veri hatası, telif iddiası veya başka bir sorun için: `barissalihbabacan@gmail.com`

## Geliştirme

```bash
cargo fmt --check
cargo test
cargo clippy --all-targets --all-features -- -D warnings
```

```text
src/
├── data/                 # JSON modelleri, yükleme ve validation
├── optimizer.rs          # Formation, lineup ve squad optimizer
├── projection_engine.rs  # Historical projection ve fixture context
├── rules.rs              # Scoring ve squad kuralları
├── scoring.rs            # Ham performans -> fantasy puanı
└── main.rs               # sf CLI
crates/wasm-bindings/     # Web için WebAssembly bağlayıcıları
web/                      # React + Vite web arayüzü
data/2026-27/             # Sezon JSON dataset'i
```

Katkı süreci için [CONTRIBUTING.md](CONTRIBUTING.md), güvenlik bildirimleri için [SECURITY.md](SECURITY.md).

## Lisans

[MIT License](LICENSE). Veri dosyalarının kullanım koşulları kaynaklarına göre ayrıca değerlendirilmelidir.
