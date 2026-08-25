import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Scale } from 'lucide-react';

export type LegalTab = 'terms' | 'privacy' | 'kvkk';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(defaultTab);

  if (!isOpen) return null;

  return (
    <div
      id="legal-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="legal-modal-card"
        className="glass-panel w-full max-w-3xl p-4 sm:p-6 space-y-4 relative border border-[var(--border)] shadow-2xl rounded-2xl bg-[var(--bg-surface)] text-[var(--text-primary)] max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Yasal Bilgilendirme ve Gizlilik
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Süper Lig Fantasy Optimizer yasal metinleri ve aydınlatma bildirimleri
              </p>
            </div>
          </div>

          <button
            id="legal-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 border-b border-[var(--border)] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'terms'
                ? 'bg-[var(--color-brand)]/15 text-[var(--color-brand)] border border-[var(--color-brand)]/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Kullanım Koşulları</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'privacy'
                ? 'bg-[var(--color-brand)]/15 text-[var(--color-brand)] border border-[var(--color-brand)]/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Gizlilik Politikası</span>
          </button>

          <button
            onClick={() => setActiveTab('kvkk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'kvkk'
                ? 'bg-[var(--color-brand)]/15 text-[var(--color-brand)] border border-[var(--color-brand)]/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>KVKK Aydınlatma Metni</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto pr-1 space-y-4 text-xs leading-relaxed text-[var(--text-secondary)] flex-1">
          {activeTab === 'terms' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                Son Güncelleme: 25 Ağustos 2026
              </div>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  1. Hizmetin Tanımı ve Bağımsızlık
                </h4>
                <p>
                  <strong>1.1.</strong> Süper Lig Fantasy Optimizer; fantezi futbol meraklıları ve araştırmacılar için geliştirilmiş <strong>bağımsız, açık kaynaklı bir kadro analiz, istatistik ve matematiksel optimizasyon aracıdır</strong>.
                </p>
                <p>
                  <strong>1.2.</strong> Kadro optimizasyon hesaplamaları sunucularımızda değil; tamamen kullanıcının kendi internet tarayıcısı üzerinde WebAssembly (WASM) ve Web Worker teknolojileriyle yerel olarak çalışır.
                </p>
                <p>
                  <strong>1.3.</strong> Uygulama ücretsiz olarak sunulmakta olup herhangi bir bahis, şans oyunu veya finansal getiri vaadi içermez.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  2. Resmî Olmama ve Marka Açıklaması
                </h4>
                <p>
                  <strong>2.1.</strong> Süper Lig Fantasy Optimizer; <strong>Türkiye Futbol Federasyonu (TFF), TFF Dijital Ligler Teknoloji A.Ş., Trendyol Süper Lig veya TFF Fantezi Lig ile hiçbir resmî, ticari, kurumsal, idari veya sponsorluk bağına sahip DEĞİLDİR.</strong>
                </p>
                <p>
                  <strong>2.2.</strong> Uygulama içerisinde geçen lig, kulüp ve oyuncu adları; yalnızca hizmetin konusunu açıklamak ve içeriği tanımlamak amacıyla kullanılmaktadır. Bu kullanım herhangi bir resmî bağlantı, temsilcilik veya onay anlamına gelmez. Uygulamada resmî kurum logoları veya tescilli görsel kimlik unsurları kullanılmamaktadır.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  3. Veri Niteliği ve Doğruluk
                </h4>
                <p>
                  <strong>3.1.</strong> Fikstür, maç sonuçları ve oyuncu istatistikleri kamuya açık spor verileridir. Oyuncu fiyatları ve fantezi lig puanlama parametreleri ise fantezi futbol kuralları ve topluluk girdileri üzerinden modellenmiştir.
                </p>
                <p>
                  <strong>3.2.</strong> Verilerin mutlak doğruluğu veya anlık güncelliği konusunda taahhütte bulunulmamaktadır. Kararlarınız için resmî kaynakları esas almanız önerilir.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  4. Fikrî Mülkiyet ve Açık Kaynak Lisansı
                </h4>
                <p>
                  <strong>4.1.</strong> Uygulamanın özgün kaynak kodları <strong>MIT Lisansı</strong> ile lisanslanmıştır.
                </p>
                <p>
                  <strong>4.2.</strong> Kaynak kodun lisansı; üçüncü taraflara ait marka adlarını, kamuya açık harici veri setlerini veya üçüncü taraf haklarını kapsamaz.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  5. Sorumluluk Sınırı
                </h4>
                <p>
                  <strong>5.1.</strong> Optimizasyon sonuçları, puan projeksiyonları ve maç analizleri <strong>yalnızca istatistiki karar destek önerileridir</strong>.
                </p>
                <p>
                  <strong>5.2.</strong> Kullanıcının fantezi futbol liglerinde elde edeceği puanlar, sıralamalar veya tercihlerinden doğabilecek sonuçlardan Uygulama ve geliştiricileri sorumlu tutulamaz.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  6. Kabul Edilebilir Kullanım
                </h4>
                <p>
                  Kullanıcılar; altyapıya zarar verme, aşırı yük bindirme (DoS/DDoS) veya güvenlik açıklarını kötüye kullanma girişimlerinde bulunamaz.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                Son Güncelleme: 25 Ağustos 2026
              </div>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  1. Temel İlke: İstemci Taraflı (Client-Side) İşleme
                </h4>
                <p>
                  Uygulamamızın temel özelliği olan kadro optimizasyonu ve tahmin hesaplamaları tamamen sizin cihazınızda (tarayıcınızda) çalışır. <strong>Kadro seçimleriniz, kilitlediğiniz oyuncular veya bütçe tercihleriniz sunucularımıza iletilmez ve sunucularımızda saklanmaz.</strong>
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  2. İşlenen Veriler ve Depolama Biçimi
                </h4>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                    <strong className="text-[var(--text-primary)] block mb-1">A. Tarayıcınızda Yerel Olarak Tutulan Veriler (Local Data)</strong>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      <li><strong>Optimize Edilmiş Kadro:</strong> Sayfa yenilendiğinde kadronuzun kaybolmaması için tarayıcınızın IndexedDB alanında tutulur.</li>
                      <li><strong>Tahmin Kuponları (Nostradamus):</strong> Seçimleriniz tarayıcınızın localStorage alanında saklanır.</li>
                      <li><strong>Arayüz Tercihleri:</strong> Tema seçiminiz (dark/light) ve bilgilendirme pencerelerinin durumu.</li>
                    </ul>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                      * Bu veriler cihazınızdan dışarı aktarılmaz. Tarayıcınızın ilgili siteye ait verilerini temizlemeniz veya uygulama verilerini silmeniz hâlinde cihazınızdan kaldırılır.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                    <strong className="text-[var(--text-primary)] block mb-1">B. Teknik Altyapı ve Ölçüm Verileri (Firebase / Google)</strong>
                    <p className="text-[11px] mb-1">
                      Uygulamanın kararlılığını sağlamak ve kullanım eğilimlerini anlamak amacıyla Google Firebase altyapısı üzerinden teknik veriler işlenmektedir:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      <li><strong>Performans Ölçümleri (Firebase Performance):</strong> Sayfa açılış süreleri, ağ yanıt hızları ve optimizasyon motorunun çalışma süresi (optimizer_execution).</li>
                      <li><strong>Kullanım İstatistikleri (Firebase Analytics):</strong> Hangi sayfaların ziyaret edildiği ve temel özelliklerin kullanım sıklığı (mümkün olduğu ölçüde toplulaştırılmış raporlar oluşturmak amacıyla).</li>
                      <li><strong>Altyapı İstek Kayıtları:</strong> Web sitesi barındırma hizmeti (Firebase Hosting) gereği sunucu düzeyinde standart teknik iletişim logları (IP adresi, istek zamanı, kullanıcı aracısı - user agent) altyapı sağlayıcısı tarafından güvenlik ve yönlendirme amaçlarıyla işlenebilir.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  3. Çerezler ve Çevrimiçi Tanımlayıcılar
                </h4>
                <p>
                  Uygulama tarafından reklam veya pazarlama amacıyla kullanıcı davranışlarını hedeflemeye yönelik ayrı bir izleme teknolojisi kullanılmamaktadır. Analitik ve performans hizmetleri kapsamında teknik tanımlayıcılar kullanılabilir.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  4. Altyapı Sağlayıcıları
                </h4>
                <p>
                  Barındırma, performans ve analitik altyapısı için <strong>Google Firebase</strong> (Google Ireland Limited / Google LLC) hizmetleri kullanılmaktadır. Detaylar için Google Gizlilik Politikası incelenebilir.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  5. İletişim
                </h4>
                <p>
                  Gizlilik uygulamalarımızla ilgili her türlü soru için <strong>barissalihbabacan@gmail.com</strong> adresi üzerinden iletişime geçebilirsiniz.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'kvkk' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                Son Güncelleme: 25 Ağustos 2026
              </div>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  1. Veri Sorumlusu
                </h4>
                <p>
                  6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz; veri sorumlusu sıfatıyla <strong>Barış Salih Babacan</strong> (barissalihbabacan@gmail.com) tarafından aşağıda açıklanan çerçevede işlenmektedir.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  2. İşlenen Kişisel Veriler ve Toplanma Yöntemi
                </h4>
                <p>
                  Kişisel verileriniz, web sitesini ziyaretiniz sırasında tarayıcınız ve cihazınız üzerinden otomatik elektronik yöntemlerle toplanmaktadır:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>İşlem Güvenliği ve Altyapı Verileri:</strong> Sunucu iletişim logları (IP adresi, tarayıcı/cihaz bilgisi, erişim tarihi ve saati).</li>
                  <li><strong>Kullanım ve Performans Verileri:</strong> Sayfa etkileşimleri, optimizasyon çalışma süreleri ve teknik teşhis metrikleri.</li>
                </ul>
                <p className="text-[11px] text-[var(--text-muted)]">
                  * Kullanıcı kadro seçimleri ve maç tahminleri sunuculara aktarılmaksızın yalnızca kullanıcının kendi cihazının yerel depolama alanında tutulmaktadır.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  3. İşleme Amaçları ve Hukuki Sebepler
                </h4>
                <ul className="list-disc list-inside space-y-1.5">
                  <li>
                    <strong>Altyapı ve Sunucu Logları:</strong> Sitenin güvenliğinin sağlanması, teknik erişimin temini ve siber saldırıların önlenmesi amacıyla <strong>KVKK m. 5/2-f</strong> (Veri sorumlusunun meşru menfaati) uyarınca işlenir.
                  </li>
                  <li>
                    <strong>Performans Metrikleri:</strong> WASM motorunun çalışma hızının ölçülmesi, hata ve çökmelerin tespiti ve giderilmesi amacıyla <strong>KVKK m. 5/2-f</strong> (Hizmet kalitesinin sürdürülmesi meşru menfaati) uyarınca işlenir.
                  </li>
                  <li>
                    <strong>Kullanım Ölçümleri (Analytics):</strong> Ziyaretçi eğilimlerinin anlaşılması ve kullanıcı deneyiminin geliştirilmesi amacıyla <strong>KVKK m. 5</strong> kapsamında veri sorumlusunun meşru menfaati ve mevzuatın gerektirdiği hallerde ilgili rıza mekanizmaları çerçevesinde işlenir.
                  </li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  4. Kişisel Verilerin Aktarılması
                </h4>
                <p>
                  <strong>Yurt İçi:</strong> Verileriniz kanunen yetkili kamu kurum ve kuruluşları (adli/idari makamlar) dışında yurt içindeki üçüncü şahıslara aktarılmaz.
                </p>
                <p>
                  <strong>Yurt Dışı:</strong> Kullanılan Google/Firebase hizmetlerinin niteliğine bağlı olarak bazı teknik log ve analitik veriler yurt dışındaki güvenli altyapılarda işlenebilir veya yurt dışına aktarılabilir.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  5. KVKK m. 11 Kapsamındaki Haklarınız
                </h4>
                <p>
                  İlgili kişi olarak KVKK’nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını öğrenme, eksik/yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini talep etme ve kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">
                  6. Başvuru
                </h4>
                <p>
                  Taleplerinizi <strong>barissalihbabacan@gmail.com</strong> e-posta adresi üzerinden iletebilirsiniz. Başvurular mevzuata uygun şekilde en geç 30 gün içinde sonuçlandırılır.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[var(--text-muted)]">
            Açık Kaynak Topluluk Projesi
          </span>
          <button
            onClick={onClose}
            className="btn-sofa btn-sofa-primary text-xs px-4 py-1.5"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
};
