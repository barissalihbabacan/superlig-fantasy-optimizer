import React from 'react';
import { Mail, Github, FileText, Scale, ShieldCheck, Coffee } from 'lucide-react';
import { LegalTab } from './LegalModal';

interface FooterProps {
  onOpenLegal?: (tab?: LegalTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  return (
    <footer id="main-footer" className="mt-0 border-t border-[var(--border)] bg-[var(--bg-surface)] py-3 sm:py-3.5 text-xs text-[var(--text-secondary)]">
      <div className="app-container flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div id="footer-brand" className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
          <div className="w-5 h-5 rounded bg-[var(--color-brand)] text-[#0c1017] flex items-center justify-center font-black text-[10px]">
            SL
          </div>
          <span>Süper Lig Fantasy Optimizer</span>
          <span className="font-mono text-[10px] text-[var(--text-muted)] font-normal">
            · 2026/27 Açık Kaynak
          </span>
        </div>

        <div id="footer-links" className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-mono text-[11px]">
          <a
            id="footer-github-link"
            href="https://github.com/barissalihbabacan/superlig-fantasy-optimizer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>

          <a
            id="footer-support-link"
            href="https://buymeacoffee.com/barissalihbabacan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors font-medium"
            title="Bu proje ücretsiz ve açık kaynaklıdır. Geliştirilmesini desteklemek istersen gönüllü olarak bir kahve ısmarlayabilirsin ☕"
            aria-label="Projeyi Destekle (Buy Me a Coffee)"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Destekle ☕</span>
          </a>

          {onOpenLegal && (
            <>
              <button
                id="footer-terms-btn"
                onClick={() => onOpenLegal('terms')}
                className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
              >
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Kullanım Koşulları</span>
              </button>

              <button
                id="footer-privacy-btn"
                onClick={() => onOpenLegal('privacy')}
                className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gizlilik & KVKK</span>
              </button>
            </>
          )}

          <a
            id="footer-license-link"
            href="https://github.com/barissalihbabacan/superlig-fantasy-optimizer/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>MIT</span>
          </a>

          <a
            id="footer-contact-link"
            href="mailto:barissalihbabacan@gmail.com"
            className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>İletişim</span>
          </a>
        </div>

        <div id="footer-disclaimer" className="text-[10px] text-[var(--text-muted)] text-center md:text-right max-w-md leading-relaxed">
          <span>
            Bağımsız bir fantezi futbol analiz ve optimizasyon aracıdır. TFF veya ilgili lig organizatörleriyle herhangi bir resmî bağı veya ortaklığı yoktur. Veriler istatistiksel analiz ve referans amaçlarıyla kullanılmaktadır.
          </span>
        </div>
      </div>
    </footer>
  );
};
