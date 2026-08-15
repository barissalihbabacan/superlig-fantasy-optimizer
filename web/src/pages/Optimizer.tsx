import React, { useState } from 'react';
import { SeasonDataset, FormationType } from '../types';
import { Pitch } from '../components/Pitch';
import { runClientOptimizer, OptimizationResult } from '../services/optimizer';
import { formatPrice, getTeamBranding, getShortPosition } from '../services/dataset';
import { useToast } from '../components/Toast';
import {
  Zap,
  Sliders,
  CheckCircle2,
  Shield,
} from 'lucide-react';

interface OptimizerProps {
  dataset: SeasonDataset;
}

export const Optimizer: React.FC<OptimizerProps> = ({ dataset }) => {
  const { showToast } = useToast();
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

  const handleOptimizeClick = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const optRes = runClientOptimizer(
        dataset.players,
        dataset.projections,
        budget,
        formation
      );
      setResult(optRes);
      setIsOptimizing(false);
      showToast(
        '⚡ Kadro Optimize Edildi',
        'optimizer',
        `${optRes.formation} dizilişinde ${formatPrice(optRes.totalPrice)} bütçeyle kadro hazırlandı.`
      );
    }, 250);
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
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          100.0M ₺ bütçe ve takım kısıtları altında matematiksel olarak en yüksek expected points getiren kadroyu belirler.
        </p>
      </div>

      {/* Main 2-Column Grid (Full Fluid Width) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Controls & Squad Breakdown (4 cols) */}
        <div id="optimizer-controls-column" className="lg:col-span-4 w-full flex flex-col justify-between h-full space-y-4">
          <div className="space-y-4">
            {/* Controls Card */}
            <div id="optimizer-settings-card" className="sofa-card p-4 space-y-4">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-[var(--text-secondary)] pb-2 border-b border-[var(--border)]">
                <Sliders className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                <span>Optimizasyon Ayarları</span>
              </div>

              {/* Fixed Official League Budget */}
              <div className="space-y-1 p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-secondary)]">Resmi Kadro Bütçesi</span>
                  <span id="optimizer-budget-display" className="font-mono font-black text-sm text-[var(--color-brand)]">
                    100.0M ₺
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">
                  Süper Lig Fantasy kuralları gereği maksimum bütçe 100.0M ₺ ile sınırlıdır.
                </div>
              </div>

              {/* Formations Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[var(--text-secondary)] block">
                  Diziliş / Formasyon
                </span>
                <div id="optimizer-formation-presets" className="grid grid-cols-3 gap-1.5">
                  {formations.map((fmt) => (
                    <button
                      key={fmt}
                      id={`formation-select-btn-${fmt}`}
                      onClick={() => setFormation(fmt)}
                      className={`py-1.5 px-2 rounded text-xs font-mono font-bold border transition-all ${
                        formation === fmt
                          ? 'bg-[var(--color-brand)] text-black border-[var(--color-brand)]'
                          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optimize Trigger */}
              <button
                id="optimizer-submit-btn"
                onClick={handleOptimizeClick}
                disabled={isOptimizing}
                className="w-full btn-sofa btn-sofa-primary text-xs py-2.5 shadow font-extrabold"
              >
                {isOptimizing ? 'Hesaplanıyor...' : '⚡ Optimize Kadro Oluştur'}
              </button>
            </div>

            {/* Result Metrics Card */}
            {result && (
              <div id="optimizer-result-metrics" className="sofa-card p-4 space-y-3 border-emerald-500/30 bg-emerald-950/10">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kadro Başarıyla Oluşturuldu</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-[var(--bg-card)] border border-[var(--border)]">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">Toplam Maliyet</div>
                    <div id="optimizer-total-cost" className="font-black text-base text-[var(--text-primary)]">
                      {formatPrice(result.totalPrice)}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      Kalan: {formatPrice(budget - result.totalPrice)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--bg-card)] border border-[var(--border)]">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">Tahmini Puan</div>
                    <div id="optimizer-expected-pts" className="font-black text-base text-[var(--color-brand)]">
                      {result.totalPoints.toFixed(1)} pts
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      Formasyon: {result.formation}
                    </div>
                  </div>
                </div>

                {/* Captain Pick Info */}
                {result.captain && (
                  <div id="optimizer-captain-badge" className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center">
                        C
                      </span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {result.captain.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">2x Puan Kaptanı</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Optimizer Rules Reminder (Aligned and Height-Balanced with Pitch Bottom) */}
          <div id="optimizer-rules-box" className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] flex flex-col justify-between flex-1 mt-4">
            <div className="space-y-3">
              <div className="font-extrabold text-xs uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                <Shield className="w-4 h-4 text-[var(--color-brand)]" />
                <span>Resmi Lig Kuralları & Kısıtları</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] mt-1.5 flex-shrink-0" />
                  <span className="text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Kadro Büyüklüğü:</strong> 11 Asıl + 4 Yedek olmak üzere 15 oyuncu seçilir.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] mt-1.5 flex-shrink-0" />
                  <span className="text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Kulüp Limiti:</strong> Aynı kulüpten en fazla 3 futbolcu alınabilir.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] mt-1.5 flex-shrink-0" />
                  <span className="text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Bütçe Tavanı:</strong> Toplam kadro değeri 100.0M ₺ limitini aşamaz.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <span className="text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Kaptan (C):</strong> Kaptan seçilen oyuncunun getireceği puan 2 kat sayılır.</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-between mt-3">
              <span>Puanlama & Kısıt Motoru</span>
              <span className="text-emerald-400 font-bold">Doğrulanmış</span>
            </div>
          </div>
        </div>

        {/* Right Column: Pitch & Lineup Table (8 cols) */}
        <div id="optimizer-pitch-column" className="lg:col-span-8 w-full h-full flex flex-col space-y-4">
          <Pitch
            formation={result?.formation || formation}
            lineup={result?.startingXI}
            bench={result?.bench}
            captainId={result?.captain?.id}
            viceCaptainId={result?.viceCaptain?.id}
          />

          {/* Squad Roster Table if generated */}
          {result && (
            <div id="optimizer-squad-table-container" className="sofa-card overflow-hidden">
              <div className="sofa-card-header">
                <span className="text-xs font-extrabold uppercase text-[var(--text-secondary)]">
                  İlk 11 ve Yedek Kadro Listesi
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  15 Oyuncu
                </span>
              </div>

              <div className="sofa-table-wrapper border-none rounded-none">
                <table id="optimizer-lineup-table" className="sofa-table">
                  <thead>
                    <tr>
                      <th>Mevki</th>
                      <th>Oyuncu</th>
                      <th>Kulüp</th>
                      <th>Fiyat</th>
                      <th className="text-right">Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.startingXI.map((player) => {
                      const brand = getTeamBranding(player.team_id);
                      const isCaptain = player.id === result.captain?.id;
                      const isVice = player.id === result.viceCaptain?.id;

                      return (
                        <tr key={player.id} id={`lineup-row-${player.id}`}>
                          <td>
                            <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)]">
                              {getShortPosition(player.position)}
                            </span>
                          </td>
                          <td className="font-bold text-[var(--text-primary)]">
                            {player.name}
                          </td>
                          <td>
                            <span className="flex items-center gap-1.5 font-medium">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: brand.primaryColor }}
                              />
                              {brand.code}
                            </span>
                          </td>
                          <td className="font-mono text-[var(--color-brand)]">
                            {formatPrice(player.price)}
                          </td>
                          <td className="text-right font-mono font-bold text-xs">
                            {isCaptain ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[10px]">
                                Kaptan (C)
                              </span>
                            ) : isVice ? (
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-black text-[10px]">
                                Y. Kaptan (VC)
                              </span>
                            ) : (
                              <span className="text-[10px] text-[var(--text-muted)]">İlk 11</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
