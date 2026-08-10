import React from 'react';
import { Mail, Github, FileText, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[var(--border-color)] bg-[var(--bg-surface)] py-8 text-sm text-[var(--text-secondary)]">
      <div className="app-container flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: Independence & Project Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
              <span className="text-blue-500">Süper Lig Fantasy Optimizer</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Trendyol Süper Lig Fantasy kadro analizi ve deterministik optimizasyon motoru.
              Veriler manuel olarak yönetilmekte olup bağımsız açık kaynak topluluk projesidir.
            </p>
          </div>

          {/* Column 2: Legal Disclaimer */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Yasal Sorumluluk Reddi</span>
            </div>
            <p className="leading-relaxed text-amber-200/80">
              Süper Lig Fantasy Optimizer bağımsız bir projedir ve TFF (Türkiye Futbol Federasyonu) ile resmi, ticari veya kurumsal bağlantısı bulunmamaktadır. Veri hatası ve içerik talepleri için doğrudan iletişim kurulabilir.
            </p>
          </div>

          {/* Column 3: Contact & Links */}
          <div className="flex flex-col gap-2.5 text-xs md:items-end">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Mail className="w-4 h-4 text-blue-400" />
              <a href="mailto:barissalihbabacan@gmail.com" className="hover:text-blue-400 transition-colors">
                barissalihbabacan@gmail.com
              </a>
            </div>

            <div className="flex items-center gap-4 mt-1">
              <a 
                href="https://github.com/barissalihbabacan/superlig-fantasy-optimizer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Repository</span>
              </a>
              <a 
                href="https://github.com/barissalihbabacan/superlig-fantasy-optimizer/blob/main/LICENSE" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>MIT Lisansı</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border-color)] pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-2">
          <p>© 2026 Süper Lig Fantasy Optimizer. All rights reserved.</p>
          <p>Data is manually maintained and may be incomplete.</p>
        </div>
      </div>
    </footer>
  );
};
