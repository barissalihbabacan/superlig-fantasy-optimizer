import React, { useState } from 'react';
import { SeasonDataset, FormationType } from '../types';
import { Pitch } from '../components/Pitch';
import { Zap, AlertTriangle, Shield, Sliders } from 'lucide-react';

interface OptimizerProps {
  dataset: SeasonDataset;
}

export const Optimizer: React.FC<OptimizerProps> = ({ dataset: _dataset }) => {
  const [budget, setBudget] = useState<number>(10000);
  const [formation, setFormation] = useState<FormationType>('3-5-2');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
    setStatusMessage(null);

    // Simulate clean interface trigger without generating fake optimization results
    setTimeout(() => {
      setIsOptimizing(false);
      setStatusMessage('Web optimizer entegrasyonu hazırlanıyor. (Rust CLI optimizer sunucu/WASM katmanı ilk sürümde read-only olarak çalışmaktadır.)');
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-400" />
          <span>Deterministik Kadro Optimizer'ı</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Bütçe ve formasyon kısıtları altında maksimum expected points kadrosunu belirler
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Controls Panel */}
        <div className="glass-panel p-6 space-y-6 lg:col-span-1 border border-amber-500/20">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Optimizasyon Parametreleri</span>
          </div>

          {/* Budget Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
              <span>Bütçe Kısıtı (10000 = 100M ₺)</span>
              <span className="font-mono text-amber-400 font-bold">{(budget / 100).toFixed(1)}M ₺</span>
            </label>
            <input
              type="number"
              min={5000}
              max={15000}
              step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="form-input font-mono font-bold"
            />
            <p className="text-[10px] text-[var(--text-muted)]">Standard Lig Bütçesi: 10000 (100M TL)</p>
          </div>

          {/* Formation Select */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Formasyon Seçimi</label>
            <select
              value={formation}
              onChange={(e) => setFormation(e.target.value as FormationType)}
              className="form-select font-mono font-semibold"
            >
              {formations.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt === 'Auto' ? 'Auto (En Yüksek Puanlı Formasyon)' : fmt}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleOptimizeClick}
            disabled={isOptimizing}
            className="btn btn-primary w-full py-3 shadow-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
          >
            <Zap className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Hesaplanıyor...' : 'Optimize Et'}</span>
          </button>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Web Optimizer Durumu</span>
              </div>
              <p className="leading-relaxed text-amber-200/90">{statusMessage}</p>
            </div>
          )}

          {/* Constraints Rule Card */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2 text-xs">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Uygulanan Kadro Kuralları</span>
            </div>
            <ul className="space-y-1 text-[var(--text-secondary)] list-disc list-inside text-[11px]">
              <li>15 Oyuncu: 2 GK, 5 DEF, 5 MID, 3 FWD</li>
              <li>11 Kişilik İlk 11 + 4 Kişilik Yedek Kulübesi</li>
              <li>Takım başına en fazla 3 oyuncu sınırı</li>
              <li>Bütçe aşımı yapılamaz (Bütçe &le; {(budget / 100).toFixed(1)}M ₺)</li>
              <li>Captain (2x çarpanı) ve Vice Captain seçimi</li>
            </ul>
          </div>
        </div>

        {/* Squad Pitch Preview Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-2">
                <span>Saha Diziliş Önizlemesi</span>
                <span className="badge bg-blue-500/20 text-blue-400 font-mono">{formation}</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">Optimizer sonuçları aktarıldığında ilk 11 sahada görüntülenecektir.</p>
            </div>
          </div>

          {/* Interactive Pitch Component */}
          <Pitch formation={formation} />
        </div>
      </div>
    </div>
  );
};
