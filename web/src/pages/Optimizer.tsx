import React, { useEffect, useState } from 'react';
import { SeasonDataset, FormationType } from '../types';
import { Pitch } from '../components/Pitch';
import { runOptimizer, OptimizationResult } from '../services/optimizer';
import { initOptimizerWasm, cancelOptimization } from '../services/optimizerWasm';
import { formatPrice, getTeamBranding, getShortPosition } from '../services/dataset';
import { saveOptimizedSquad, loadOptimizedSquad, clearOptimizedSquad } from '../services/squadStorage';
import { trackOptimizerRun, trackOptimizerReset } from '../services/analytics';
import { measureOptimizerExecution } from '../services/performance';
import {
  Zap,
  Sliders,
  CheckCircle2,
  Shield,
  XCircle,
  RotateCcw,
} from 'lucide-react';

interface OptimizerProps {
  dataset: SeasonDataset;
}

export const Optimizer: React.FC<OptimizerProps> = ({ dataset }) => {
  const budget = 10000; // Strictly 100.0M TL according to official Süper Lig Fantasy rules
  const [formation, setFormation] = useState<FormationType>('3-5-2');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const formations: FormationType[] = [
    'Auto',
    '3-5-2',
    '3-4-3',
    '4-3-3',
    '4-4-2',
    '4-5-1',
    '5-4-1',
    '5-3-2',
    '5-2-3',
  ];

  // Kullanıcı butona basmadan önce wasm worker'ını ısıt ve IndexedDB'deki kayıtlı kadroyu yükle
  useEffect(() => {
    initOptimizerWasm();
    loadOptimizedSquad().then((saved) => {
      if (saved && saved.result) {
        setResult(saved.result);
        if (saved.formation) {
          setFormation(saved.formation);
        }
      }
    });
  }, []);

  const handleOptimizeClick = async () => {
    setIsOptimizing(true);
    try {
      const optRes = await measureOptimizerExecution(formation, () =>
        runOptimizer(dataset.players, dataset.projections, budget, formation)
      );
      setResult(optRes);
      await saveOptimizedSquad(optRes, formation);
      trackOptimizerRun({
        formation: optRes.formation || formation,
        budget,
        totalPoints: optRes.totalPoints,
        captainName: optRes.captain?.name,
      });
    } catch (error) {
      console.error('Optimizasyon Hatası:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCancelClick = () => {
    cancelOptimization();
    setIsOptimizing(false);
  };

  const handleResetClick = async () => {
    setResult(null);
    await clearOptimizedSquad();
    trackOptimizerReset();
  };

  return (
    <div id="optimizer-page-container" className="w-full space-y-4 animate-fadeIn">
      {/* Top Header */}
      <div id="optimizer-header-bar" className="pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[var(--color-brand)]" />
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Kadro Optimizer'ı
          </h2>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Resmi kurallara uygun (100.0M ₺ bütçe, maksimum 3 oyuncu/takım) en yüksek beklenen puanı (xP) veren ilk 11 ve kaptan seçimini hesaplar.
        </p>
      </div>

      {/* Control Configuration Bar */}
      <div id="optimizer-control-bar" className="sofa-card p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Formation Selector */}
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--color-brand)]" />
              <label htmlFor="formation-select" className="text-xs font-bold uppercase text-[var(--text-muted)] font-mono">
                Diziliş:
              </label>
              <select
                id="formation-select"
                value={formation}
                onChange={(e) => setFormation(e.target.value as FormationType)}
                className="form-select-sofa font-mono text-xs font-bold"
              >
                {formations.map((f) => (
                  <option key={f} value={f}>
                    {f === 'Auto' ? '⚡ Otomatik En İyisi' : f}
                  </option>
                ))}
              </select>
            </div>

            {/* Locked Constraints Badge */}
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bütçe: <strong>100.0M ₺</strong> · Takım Limiti: <strong>Max 3</strong></span>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2">
            {isOptimizing && (
              <button
                id="optimizer-cancel-btn"
                onClick={handleCancelClick}
                className="btn-sofa btn-sofa-secondary bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/60 text-xs px-3 py-2 flex items-center gap-1.5 font-bold"
              >
                <XCircle className="w-4 h-4" />
                <span>İptal Et</span>
              </button>
            )}

            {result && !isOptimizing && (
              <button
                id="optimizer-reset-btn"
                onClick={handleResetClick}
                title="Kayıtlı kadroyu sıfırla"
                className="btn-sofa btn-sofa-secondary text-xs px-3 py-2 flex items-center gap-1.5 font-bold text-[var(--text-secondary)] hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sıfırla</span>
              </button>
            )}

            <button
              id="optimizer-calculate-btn"
              onClick={handleOptimizeClick}
              disabled={isOptimizing}
              className="btn-sofa btn-sofa-primary text-xs px-5 py-2 flex items-center gap-2 font-bold shadow-lg shadow-[var(--color-brand)]/10"
            >
              {isOptimizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Optimizasyon Hesaplanıyor...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>En İyi Kadroyu Oluştur</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Optimization Results Section */}
      {result ? (
        <div id="optimizer-results-section" className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="sofa-card p-3.5">
              <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)]">Toplam Beklenen Puan</div>
              <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400 mt-1">
                {result.totalPoints.toFixed(1)} <span className="text-xs font-normal text-[var(--text-muted)]">xP</span>
              </div>
            </div>

            <div className="sofa-card p-3.5">
              <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)]">Toplam Kadro Maliyeti</div>
              <div className="text-xl sm:text-2xl font-mono font-black text-[var(--text-primary)] mt-1">
                {formatPrice(result.totalPrice)}
              </div>
            </div>

            <div className="sofa-card p-3.5">
              <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)]">Kalan Bütçe</div>
              <div className="text-xl sm:text-2xl font-mono font-black text-[var(--color-brand)] mt-1">
                {formatPrice(budget - result.totalPrice)}
              </div>
            </div>

            <div className="sofa-card p-3.5">
              <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)]">Seçilen Diziliş</div>
              <div className="text-xl sm:text-2xl font-mono font-black text-[var(--text-primary)] mt-1">
                {result.formation}
              </div>
            </div>
          </div>

          {/* Interactive Tactical Pitch Visualization */}
          <Pitch
            formation={result.formation}
            lineup={result.startingXI}
            bench={result.bench}
            captainId={result.captain?.id}
            viceCaptainId={result.viceCaptain?.id}
          />

          {/* Lineup Detail Table */}
          <div className="sofa-card overflow-hidden">
            <div className="p-3.5 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Optimize Edilmiş 11 Kişilik Kadro Listesi</span>
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Kaptan: <strong className="text-[var(--color-brand)]">{result.captain?.name}</strong> (2x xP)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Poz</th>
                    <th className="py-2.5 px-3">Oyuncu</th>
                    <th className="py-2.5 px-3">Takım</th>
                    <th className="py-2.5 px-3 text-right">Fiyat</th>
                    <th className="py-2.5 px-3 text-right">Beklenen Puan (xP)</th>
                    <th className="py-2.5 px-3 text-center">Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono">
                  {result.startingXI.map((player) => {
                    const isCaptain = player.id === result.captain?.id;
                    const isVice = player.id === result.viceCaptain?.id;
                    const teamName = dataset.teams.find((t) => t.id === player.team_id)?.name || player.team_id;
                    const teamBrand = getTeamBranding(player.team_id);
                    const rawXp = dataset.projections.get(player.id)?.expected_points || 0;
                    const effectiveXp = isCaptain ? rawXp * 2 : rawXp;

                    return (
                      <tr
                        key={player.id}
                        className={`hover:bg-[var(--bg-card-hover)] transition-colors ${
                          isCaptain ? 'bg-[var(--color-brand)]/5' : ''
                        }`}
                      >
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-[var(--bg-surface)] border border-[var(--border)]">
                            {getShortPosition(player.position)}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans font-bold text-[var(--text-primary)]">
                          {player.name}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: teamBrand.primaryColor }}
                            />
                            <span className="text-[var(--text-secondary)] font-sans">{teamName}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[var(--text-primary)]">
                          {formatPrice(player.price)}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-emerald-400">
                          {effectiveXp.toFixed(1)} {isCaptain && <span className="text-[10px] text-[var(--color-brand)] font-bold">(2x)</span>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {isCaptain ? (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--color-brand)] text-black font-black text-[10px] shadow-xs">
                              KAPTAN (C)
                            </span>
                          ) : isVice ? (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border)] font-bold text-[10px]">
                              YEDEK (VC)
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)] text-[10px]">İlk 11</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="sofa-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-[var(--text-primary)]">
            Henüz Kadro Hesaplanmadı
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Yukarıdaki <strong>"En İyi Kadroyu Oluştur"</strong> butonuna tıklayarak matematiksel optimizasyon motorunu çalıştırın.
          </p>
        </div>
      )}
    </div>
  );
};
