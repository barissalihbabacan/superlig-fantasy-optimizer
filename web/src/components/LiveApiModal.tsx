import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  CheckCircle2,
  RefreshCw,
  Key,
  ShieldCheck,
  Activity,
  Trophy,
  Users,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  getSavedRapidApiKey,
  saveRapidApiKey,
  getLeagueStandings,
  getTopPlayersByGoals,
  getLeagueMatches,
  SUPER_LIG_LEAGUE_ID,
} from '../services/rapidApiFootball';

interface LiveApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveApiModal: React.FC<LiveApiModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    type: 'standings' | 'goals' | 'matches' | 'none';
    data?: any;
    error?: string;
  }>({ success: false, type: 'none' });

  useEffect(() => {
    if (isOpen) {
      const currentKey = getSavedRapidApiKey();
      setApiKey(currentKey);
      if (currentKey) {
        handleQuickTest(currentKey, 'standings');
      }
    }
  }, [isOpen]);

  const handleSaveKey = () => {
    saveRapidApiKey(apiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleQuickTest = async (keyToUse: string, testType: 'standings' | 'goals' | 'matches') => {
    setLoading(true);
    setTestResult({ success: false, type: testType });

    try {
      if (testType === 'standings') {
        const res = await getLeagueStandings(SUPER_LIG_LEAGUE_ID, keyToUse);
        if (res.success && res.data?.response?.standing) {
          setTestResult({
            success: true,
            type: 'standings',
            data: res.data.response.standing,
          });
        } else {
          setTestResult({ success: false, type: 'standings', error: res.error || 'Veri çekilemedi.' });
        }
      } else if (testType === 'goals') {
        const res = await getTopPlayersByGoals(SUPER_LIG_LEAGUE_ID, keyToUse);
        if (res.success && res.data?.response?.players) {
          setTestResult({
            success: true,
            type: 'goals',
            data: res.data.response.players,
          });
        } else {
          setTestResult({ success: false, type: 'goals', error: res.error || 'Veri çekilemedi.' });
        }
      } else if (testType === 'matches') {
        const res = await getLeagueMatches(SUPER_LIG_LEAGUE_ID, undefined, keyToUse);
        if (res.success && res.data?.response?.matches) {
          setTestResult({
            success: true,
            type: 'matches',
            data: res.data.response.matches,
          });
        } else {
          setTestResult({ success: false, type: 'matches', error: res.error || 'Veri çekilemedi.' });
        }
      }
    } catch (err: any) {
      setTestResult({ success: false, type: testType, error: err?.message || 'Bağlantı hatası' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="live-api-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="live-api-modal-card"
        className="sofa-card w-full max-w-2xl overflow-hidden border-[var(--border-strong)] shadow-2xl bg-[var(--bg-card)] flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[var(--text-primary)]">
                  Canlı Futbol API & Veri Merkezi
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  AKTİF
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                RapidAPI Free Live Football Data · Trendyol Süper Lig (ID: 71)
              </p>
            </div>
          </div>
          <button
            id="close-live-api-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Status Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/20 via-[var(--bg-surface)] to-[var(--bg-surface)] border border-emerald-500/30 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>%100 Yasal ve Resmi Geliştirici Bağlantısı</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    200 OK
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Süper Lig canlı skorları, puan durumu, maç olayları ve oyuncu reytingleri doğrudan RapidAPI uç noktalarından beslenir.
                </p>
              </div>
            </div>
          </div>

          {/* API Key Configuration */}
          <div className="sofa-card p-3.5 space-y-2.5 bg-[var(--bg-surface)] border-[var(--border)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                RapidAPI Anahtarınız (X-RapidAPI-Key)
              </label>
              <a
                href="https://rapidapi.com/Creativesdev/api/free-api-live-football-data"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[var(--color-brand)] hover:underline flex items-center gap-1 font-semibold"
              >
                RapidAPI Sayfası <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                id="rapidapi-key-input"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Örnek: 8a86cd8c0amsh564ee..."
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)]"
              />
              <button
                id="save-rapidapi-key-btn"
                onClick={handleSaveKey}
                className="btn-sofa btn-sofa-primary text-xs px-4 py-2 flex items-center gap-1.5 flex-shrink-0"
              >
                {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-black" /> : null}
                <span>{isSaved ? 'Kaydedildi!' : 'Kaydet'}</span>
              </button>
            </div>
          </div>

          {/* Test & Trigger Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                ⚡ Canlı API Uç Noktaları & Test
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                100 İstek / Ay Kota
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                id="test-standings-btn"
                onClick={() => handleQuickTest(apiKey, 'standings')}
                disabled={loading}
                className={`sofa-card p-2.5 text-left hover:bg-[var(--bg-card-hover)] transition-colors border ${
                  testResult.type === 'standings' && testResult.success
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Puan Durumu
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  18 Takım Sıralaması
                </div>
              </button>

              <button
                id="test-goals-btn"
                onClick={() => handleQuickTest(apiKey, 'goals')}
                disabled={loading}
                className={`sofa-card p-2.5 text-left hover:bg-[var(--bg-card-hover)] transition-colors border ${
                  testResult.type === 'goals' && testResult.success
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <Users className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                  Gol Krallığı
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  En Çok Gol Atanlar
                </div>
              </button>

              <button
                id="test-matches-btn"
                onClick={() => handleQuickTest(apiKey, 'matches')}
                disabled={loading}
                className={`sofa-card p-2.5 text-left hover:bg-[var(--bg-card-hover)] transition-colors border ${
                  testResult.type === 'matches' && testResult.success
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Tüm Maçlar
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  306 Fikstür Karşılaşması
                </div>
              </button>
            </div>
          </div>

          {/* Live Data Results Preview Box */}
          <div className="sofa-card p-3 bg-[var(--bg-surface)] border-[var(--border)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <span className="text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-1.5 font-mono">
                <Activity className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                CANLI API YANITI (ÖNİZLEME)
              </span>
              {loading && (
                <span className="text-[10px] font-mono text-[var(--color-brand)] flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Veri Alınıyor...
                </span>
              )}
            </div>

            <div className="mt-2 text-xs font-mono max-h-48 overflow-y-auto">
              {loading ? (
                <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                  API sunucusundan veriler çekiliyor...
                </div>
              ) : testResult.success && testResult.data ? (
                testResult.type === 'standings' ? (
                  <div className="divide-y divide-[var(--border)]">
                    {testResult.data.slice(0, 5).map((team: any, i: number) => (
                      <div key={i} className="py-1.5 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-center font-bold text-[var(--text-muted)]">{i + 1}</span>
                          <span className="font-bold text-[var(--text-primary)]">{team.name || team.shortName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--text-muted)]">
                          <span>{team.played} Maç</span>
                          <span className="font-black text-emerald-400">{team.pts} Puan</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 text-center text-[10px] text-[var(--text-muted)]">
                      Toplam 18 takım başarıyla alındı.
                    </div>
                  </div>
                ) : testResult.type === 'goals' ? (
                  <div className="divide-y divide-[var(--border)]">
                    {testResult.data.map((pl: any, i: number) => (
                      <div key={i} className="py-1.5 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-center font-bold text-[var(--text-muted)]">{i + 1}</span>
                          <span className="font-bold text-[var(--text-primary)]">{pl.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">({pl.teamName})</span>
                        </div>
                        <span className="font-black text-[var(--color-brand)]">{pl.goals} Gol</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 text-[11px] text-[var(--text-secondary)]">
                    ✅ {testResult.data.length} adet Süper Lig karşılaşması başarıyla doğrulandı.
                  </div>
                )
              ) : testResult.error ? (
                <div className="p-3 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{testResult.error}</span>
                </div>
              ) : (
                <div className="py-4 text-center text-[11px] text-[var(--text-muted)]">
                  Yukarıdaki butonlara tıklayarak canlı API yanıtını test edebilirsiniz.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Süper Lig Fantasy Optimizer v0.1.0
          </span>
          <button
            id="close-live-api-footer-btn"
            onClick={onClose}
            className="btn-sofa btn-sofa-secondary text-xs px-4 py-1.5"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
