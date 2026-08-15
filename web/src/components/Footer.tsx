import React from 'react';
import { Mail, Github, FileText } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="main-footer" className="mt-4 border-t border-[var(--border)] bg-[var(--bg-surface)] py-3 sm:py-3.5 text-xs text-[var(--text-secondary)]">
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

        <div id="footer-links" className="flex items-center gap-4 font-mono text-[11px]">
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
            id="footer-license-link"
            href="https://github.com/barissalihbabacan/superlig-fantasy-optimizer/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>MIT Lisansı</span>
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

        <div id="footer-disclaimer" className="text-[10px] text-[var(--text-muted)] text-center md:text-right">
          TFF veya Trendyol ile ticari bağı bulunmayan bağımsız topluluk projesidir.
        </div>
      </div>
    </footer>
  );
};
