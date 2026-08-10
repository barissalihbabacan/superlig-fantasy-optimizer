import React from 'react';
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
  Trophy
} from 'lucide-react';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  season: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  season,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'players', label: 'Oyuncular', icon: <Users className="w-4 h-4" /> },
    { id: 'teams', label: 'Takımlar', icon: <Shield className="w-4 h-4" /> },
    { id: 'fixtures', label: 'Fikstür', icon: <Calendar className="w-4 h-4" /> },
    { id: 'optimizer', label: 'Optimizer', icon: <Zap className="w-4 h-4" /> },
    { id: 'rules', label: 'Kurallar', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border-color)] mb-6 rounded-none sm:rounded-b-2xl">
      <div className="app-container flex flex-col md:flex-row items-center justify-between py-3 gap-4">
        {/* Brand & Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              SÜPER LİG FANTASY
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                OPTIMIZER
              </span>
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-mono">2026/27 Dataset Engine</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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

        {/* Right Section: Season & Theme Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sezon: {season}</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/50 transition-all"
            title={theme === 'dark' ? 'Açık Temaya Geç' : 'Karanlık Temaya Geç'}
            aria-label="Tema değiştir"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
