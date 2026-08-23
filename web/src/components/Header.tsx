import React, { useState } from 'react';
import { NavTab } from '../types';
import {
  LayoutDashboard,
  CalendarDays,
  Zap,
  Users,
  Brain,
  BookOpen,
  Sun,
  Moon,
  Info,
  Menu,
  X,
  Trophy,
  BellRing,
} from 'lucide-react';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  season: string;
  currentRound?: number;
  onOpenNotice?: () => void;
  onOpenGoalAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  season,
  currentRound,
  onOpenNotice,
  onOpenGoalAlerts,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Maç Merkezi', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'fixtures', label: 'Fikstür & Skorlar', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'optimizer', label: 'Kadro Optimizer', icon: <Zap className="w-4 h-4" /> },
    { id: 'players', label: 'Oyuncular', icon: <Users className="w-4 h-4" /> },
    { id: 'nostradamus', label: 'Nostradamus', icon: <Brain className="w-4 h-4" /> },
    { id: 'rules', label: 'Kurallar', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const handleNavClick = (tabId: NavTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[var(--bg-surface)] border-b border-[var(--border)]">
      <div className="app-container flex items-center justify-between h-14 gap-3">
        {/* Brand & Logo */}
        <div
          id="brand-logo-btn"
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none group flex-shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand)] text-[#0c1017] flex items-center justify-center font-black text-sm shadow-md">
            <Trophy className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)]">
                SÜPER LİG
              </span>
              <span className="text-[10px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-[var(--color-brand)]/15 text-[var(--color-brand)] font-mono">
                FANTASY
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono leading-tight mt-0.5">
              {season} Sezonu · Canlı Veri Portalı
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav id="desktop-nav" className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all ${
                  isActive
                    ? 'text-[var(--color-brand)] bg-[var(--bg-card)] shadow-sm border border-[var(--border-strong)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section Tools */}
        <div className="flex items-center gap-2">
          {onOpenNotice && (
            <button
              id="notice-modal-trigger-btn"
              onClick={onOpenNotice}
              className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border)] text-amber-400 hover:border-amber-500/40 transition-all flex items-center justify-center text-xs gap-1.5 font-bold"
              title="Sezon Durum Uyarısı"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentRound || 1}. Hafta</span>
            </button>
          )}

          {onOpenGoalAlerts && (
            <button
              id="goal-alerts-modal-trigger-btn"
              onClick={onOpenGoalAlerts}
              className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-amber-400 hover:border-amber-500/40 transition-all"
              title="Gol Bildirimleri"
            >
              <BellRing className="w-4 h-4" />
            </button>
          )}

          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title={theme === 'dark' ? 'Açık Tema' : 'Karanlık Tema'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]"
            aria-label="Menü"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div id="mobile-nav-drawer" className="lg:hidden bg-[var(--bg-surface)] border-t border-[var(--border)] animate-fadeIn">
          <div className="app-container py-3 grid grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile-nav-btn-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 p-2.5 rounded text-xs font-bold transition-all text-left ${
                    isActive
                      ? 'bg-[var(--color-brand)] text-[#0c1017]'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)]'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
