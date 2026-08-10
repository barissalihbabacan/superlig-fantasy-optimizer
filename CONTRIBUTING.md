# Katkıda Bulunma

Katkılar memnuniyetle karşılanır. Değişiklik göndermeden önce repository’yi
fork edip klonlayın, Rust stable kullanın ve ayrı bir branch oluşturun.

```bash
git clone https://github.com/barissalihbabacan/superlig-fantasy-optimizer.git
cd superlig-fantasy-optimizer
git checkout -b degisiklik-aciklamasi
```

Kod veya dokümantasyon değişikliğinden sonra şu kontroller başarılı olmalıdır:

```bash
cargo fmt --check
cargo test
cargo clippy --all-targets --all-features -- -D warnings
```

Pull Request açarken değişikliğin amacını, kapsamını ve test sonuçlarını
açıklayın. Gereksiz production davranışı değişikliklerinden kaçının.

## Veri katkıları

Veri değişikliklerinde:

- Kaynağı bilinmeyen veri eklemeyin.
- Oyuncu, takım, fiyat veya projection uydurmayın.
- Match performance uydurmayın.
- Gerçek ve mevcut player/team ID’lerini kullanın.
- Oyuncu adlarını kaynakta görüldüğü biçimde koruyun.
- Dataset schema’sını bozmayın.
- Kaynak ve açıklama bilgisini katkıya ekleyin.
- İlgili `sf validate` komutunu çalıştırın.

Veri düzeltmeleri için mümkünse kaynak URL’si veya doğrulanabilir kaynak
bağlamı sağlayın.
