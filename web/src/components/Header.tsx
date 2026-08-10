import React, { useState } from 'react';
import { NavTab } from '../types';
import { 
  BarChart3, 
  Users, 
  Shield, 
  Calendar, 
  Zap, 
  BookOpen, 
  Sun, 
  Moon,
  Trophy,
  Menu,
  X,
  Info
} from 'lucide-react';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  season: string;
  onOpenNotice?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  season,
  onOpenNotice,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'players', label: 'Oyuncular', icon: <Users className="w-4 h-4" /> },
    { id: 'teams', label: 'Takımlar', icon: <Shield className="w-4 h-4" /> },
    { id: 'fixtures', label: 'Fikstür', icon: <Calendar className="w-4 h-4" /> },
    { id: 'optimizer', label: 'Optimizer', icon: <Zap className="w-4 h-4" /> },
    { id: 'rules', label: 'Kurallar', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const handleNavClick = (tabId: NavTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-[var(--border-color)] mb-6 rounded-none sm:rounded-b-2xl">
      <div className="app-container flex items-center justify-between py-3 gap-4">
        {/* Brand & Logo */}
        <div 
          onClick={() => handleNavClick('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform flex-shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              SÜPER LİG FANTASY
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                OPTIMIZER
              </span>
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] font-mono hidden sm:block">2026/27 Dataset Engine</p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Actions & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Season Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sezon: {season}</span>
          </div>

          {/* Info Modal Button */}
          {onOpenNotice && (
            <button
              onClick={onOpenNotice}
              className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all flex items-center justify-center"
              title="Sezon Öncesi Bilgilendirme"
              aria-label="Bilgilendirme Uyarısı"
            >
              <Info className="w-4 h-4" />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/50 transition-all"
            title={theme === 'dark' ? 'Açık Temaya Geç' : 'Karanlık Temaya Geç'}
            aria-label="Tema değiştir"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-blue-500/50 transition-all flex items-center justify-center"
            aria-label="Menüyü aç/kapat"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5 text-blue-400" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-surface)]/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-fadeIn shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-[var(--text-muted)] font-mono border-t border-[var(--border-color)] mt-3 px-1">
            <span>Süper Lig Fantasy 2026/27</span>
            <span className="text-emerald-400 font-semibold">v0.1.0-web</span>
          </div>
        </div>
      )}
    </header>
  );
};
