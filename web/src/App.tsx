import React, { useState, useEffect, useMemo } from 'react';
import { NavTab, SeasonDataset, Fixture } from './types';
import { loadSeasonDataset, getCurrentActiveRound } from './services/dataset';

import { Header } from './components/Header';
import { MatchTicker } from './components/MatchTicker';
import { Footer } from './components/Footer';
import { SeasonNoticeModal } from './components/SeasonNoticeModal';
import { GoalAlertsModal } from './components/GoalAlertsModal';

import { Dashboard } from './pages/Dashboard';
import { Players } from './pages/Players';
import { Teams } from './pages/Teams';
import { Fixtures } from './pages/Fixtures';
import { Optimizer } from './pages/Optimizer';
import { Rules } from './pages/Rules';
import { Nostradamus } from './pages/Nostradamus';
import { MatchDetail } from './pages/MatchDetail';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeFixture, setActiveFixture] = useState<Fixture | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [dataset, setDataset] = useState<SeasonDataset | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState<boolean>(false);
  const [isGoalAlertsModalOpen, setIsGoalAlertsModalOpen] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(1);

  // Browser Native Unload & Hard Reload Protection (Safari & Chrome compatible)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Sync dataset and check first-time notice on mount
  useEffect(() => {
    try {
      const data = loadSeasonDataset();
      setDataset(data);
      setCurrentRound(getCurrentActiveRound(data.fixtures));

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

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    setActiveFixture(null); // Return to main page view when switching tabs
  };

  const handleCloseNotice = () => {
    localStorage.setItem('sf_seen_season_notice_2026_27', 'true');
    setIsNoticeModalOpen(false);
  };

  const handleOpenNotice = () => {
    setIsNoticeModalOpen(true);
  };

  const handleOpenGoalAlerts = () => {
    setIsGoalAlertsModalOpen(true);
  };

  const teamsMap = useMemo(() => {
    const map = new Map<string, string>();
    if (dataset) {
      dataset.teams.forEach((t) => map.set(t.id, t.name));
    }
    return map;
  }, [dataset]);

  const renderActiveTab = useMemo(() => {
    if (!dataset) return null;

    // If a fixture is currently selected, render dedicated MatchDetail subpage
    if (activeFixture) {
      return (
        <MatchDetail
          fixture={activeFixture}
          dataset={dataset}
          onBack={() => setActiveFixture(null)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            dataset={dataset}
            selectedRound={currentRound}
            onSelectRound={setCurrentRound}
            setActiveTab={handleTabChange}
            onSelectFixture={(f) => setActiveFixture(f)}
          />
        );
      case 'players':
        return <Players dataset={dataset} />;
      case 'teams':
        return <Teams dataset={dataset} />;
      case 'fixtures':
        return (
          <Fixtures
            dataset={dataset}
            onSelectFixture={(f) => setActiveFixture(f)}
          />
        );
      case 'optimizer':
        return <Optimizer dataset={dataset} />;
      case 'rules':
        return <Rules />;
      case 'nostradamus':
        return (
          <Nostradamus
            dataset={dataset}
            onSelectFixture={(f) => setActiveFixture(f)}
          />
        );
      default:
        return (
          <Dashboard
            dataset={dataset}
            selectedRound={currentRound}
            onSelectRound={setCurrentRound}
            setActiveTab={handleTabChange}
            onSelectFixture={(f) => setActiveFixture(f)}
          />
        );
    }
  }, [activeTab, activeFixture, dataset, currentRound]);

  if (loadingError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0c1017] text-white">
        <div className="sofa-card p-8 max-w-md w-full text-center space-y-4 border-rose-500/40">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-rose-400">Dataset Yüklenemedi</h2>
          <p className="text-xs text-slate-300 leading-relaxed">{loadingError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-sofa btn-sofa-primary bg-rose-600 hover:bg-rose-700 mx-auto"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1017] text-white">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <RefreshCw className="w-5 h-5 text-[var(--color-brand)] animate-spin" />
          <span>Süper Lig Maç & Canlı Veri Portalı Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        theme={theme}
        toggleTheme={toggleTheme}
        season={dataset.meta.season}
        currentRound={currentRound}
        onOpenNotice={handleOpenNotice}
        onOpenGoalAlerts={handleOpenGoalAlerts}
      />

      {/* Sofascore Live Match Ticker Strip */}
      <MatchTicker
        fixtures={dataset.fixtures}
        teamsMap={teamsMap}
        selectedRound={currentRound}
        onSelectRound={setCurrentRound}
        onSelectFixture={(f) => setActiveFixture(f)}
      />

      {/* Main Content Area */}
      <main className="app-container flex-grow py-2.5 sm:py-3">
        {renderActiveTab}
      </main>

      {/* Footer */}
      <Footer />

      {/* Season Pre-start Notice Modal */}
      <SeasonNoticeModal
        isOpen={isNoticeModalOpen}
        onClose={handleCloseNotice}
        dataset={dataset}
      />

      {/* Goal Alerts (Push Notification) Modal */}
      <GoalAlertsModal
        isOpen={isGoalAlertsModalOpen}
        onClose={() => setIsGoalAlertsModalOpen(false)}
        dataset={dataset}
      />
    </div>
  );
};
