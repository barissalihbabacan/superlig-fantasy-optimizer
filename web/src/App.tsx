import React, { useState, useEffect, useMemo } from 'react';
import { NavTab, SeasonDataset } from './types';
import { loadSeasonDataset } from './services/dataset';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SeasonNoticeModal } from './components/SeasonNoticeModal';

import { Dashboard } from './pages/Dashboard';
import { Players } from './pages/Players';
import { Teams } from './pages/Teams';
import { Fixtures } from './pages/Fixtures';
import { Optimizer } from './pages/Optimizer';
import { Rules } from './pages/Rules';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [dataset, setDataset] = useState<SeasonDataset | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState<boolean>(false);

  // Sync dataset and check first-time notice on mount
  useEffect(() => {
    try {
      const data = loadSeasonDataset();
      setDataset(data);

      const hasSeenNotice = localStorage.getItem('sf_seen_season_notice_2026_27');
      if (!hasSeenNotice) {
        setIsNoticeModalOpen(true);
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Dataset yüklenemedi.';
      setLoadingError(message);
    }
  }, []);

  // Sync theme attribute on <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleCloseNotice = () => {
    localStorage.setItem('sf_seen_season_notice_2026_27', 'true');
    setIsNoticeModalOpen(false);
  };

  const handleOpenNotice = () => {
    setIsNoticeModalOpen(true);
  };

  const renderActiveTab = useMemo(() => {
    if (!dataset) return null;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard dataset={dataset} setActiveTab={setActiveTab} />;
      case 'players':
        return <Players dataset={dataset} />;
      case 'teams':
        return <Teams dataset={dataset} />;
      case 'fixtures':
        return <Fixtures dataset={dataset} />;
      case 'optimizer':
        return <Optimizer dataset={dataset} />;
      case 'rules':
        return <Rules />;
      default:
        return <Dashboard dataset={dataset} setActiveTab={setActiveTab} />;
    }
  }, [activeTab, dataset]);

  if (loadingError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0b0f19] text-white">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-4 border-rose-500/40">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-rose-400">Dataset Yüklenemedi</h2>
          <p className="text-xs text-slate-300 leading-relaxed">{loadingError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary bg-rose-600 hover:bg-rose-700 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Yeniden Deneyin</span>
          </button>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
          <span>Süper Lig Dataset'i Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        season={dataset.meta.season}
        onOpenNotice={handleOpenNotice}
      />

      <main className="app-container flex-grow pb-12">
        {renderActiveTab}
      </main>

      <Footer />

      {/* Season Pre-start Notice Modal */}
      <SeasonNoticeModal
        isOpen={isNoticeModalOpen}
        onClose={handleCloseNotice}
      />
    </div>
  );
};
