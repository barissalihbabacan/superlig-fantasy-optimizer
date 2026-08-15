import React from 'react';
import { BookOpen, Shield, Award, Layers } from 'lucide-react';

export const Rules: React.FC = () => {
  return (
    <div className="space-y-4 animate-fadeIn w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--color-brand)]" />
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Fantasy Oyun & Puanlama Kuralları
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Süper Lig Fantasy puanlama matrisi ve kadro kuralları kütüphanesi.
          </p>
        </div>
      </div>

      {/* Grid: Squad Rules & Formations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Squad constraints */}
        <div className="sofa-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-[var(--text-secondary)] pb-2 border-b border-[var(--border)]">
            <Shield className="w-4 h-4 text-[var(--color-brand)]" />
            <span>1. Kadro Kısıtları</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded bg-[var(--bg-surface)] border border-[var(--border)] space-y-1.5">
              <div className="font-bold text-[var(--text-primary)]">15 Kişilik Kadro Dağılımı:</div>
              <ul className="space-y-1 text-[var(--text-secondary)] font-mono text-[11px] list-disc list-inside">
                <li>2 Kaleci (KL)</li>
                <li>5 Defans (DEF)</li>
                <li>5 Orta Saha (OS)</li>
                <li>3 Forvet (FOR)</li>
              </ul>
            </div>

            <div className="p-3 rounded bg-[var(--bg-surface)] border border-[var(--border)] space-y-1.5">
              <div className="font-bold text-[var(--text-primary)]">Bütçe & Takım Limitleri:</div>
              <ul className="space-y-1 text-[var(--text-secondary)] font-mono text-[11px] list-disc list-inside">
                <li>Maksimum Bütçe: 100.0M ₺ (10000 birim)</li>
                <li>Aynı kulüpten en fazla 4 oyuncu</li>
                <li>Kaptan oyuncu 2x puan kazanır</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Formations */}
        <div className="sofa-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-[var(--text-secondary)] pb-2 border-b border-[var(--border)]">
            <Layers className="w-4 h-4 text-[var(--color-accent)]" />
            <span>2. Desteklenen Formasyonlar</span>
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            1 Kaleci zorunludur. Saha içi 10 oyuncu aşağıdaki 8 formasyondan birine göre dizilir:
          </p>

          <div className="grid grid-cols-4 gap-1.5 text-center font-mono font-bold text-xs">
            {['3-5-2', '3-4-3', '4-3-3', '4-4-2', '4-5-1', '5-4-1', '5-3-2', '5-2-3'].map((fmt) => (
              <div
                key={fmt}
                className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                {fmt}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scoring Matrix Table */}
      <div className="sofa-card overflow-hidden">
        <div className="sofa-card-header">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-extrabold uppercase text-[var(--text-secondary)]">
              3. Resmi Puanlama Matrisi
            </span>
          </div>
        </div>

        <div className="sofa-table-wrapper border-none rounded-none">
          <table className="sofa-table">
            <thead>
              <tr>
                <th>Aksiyon / Performans</th>
                <th>KL</th>
                <th>DEF</th>
                <th>OS</th>
                <th>FOR</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">60+ Dakika Oynamak</td>
                <td className="font-mono text-emerald-400">+2</td>
                <td className="font-mono text-emerald-400">+2</td>
                <td className="font-mono text-emerald-400">+2</td>
                <td className="font-mono text-emerald-400">+2</td>
              </tr>
              <tr>
                <td className="font-bold">1 - 59 Dakika Oynamak</td>
                <td className="font-mono text-emerald-400">+1</td>
                <td className="font-mono text-emerald-400">+1</td>
                <td className="font-mono text-emerald-400">+1</td>
                <td className="font-mono text-emerald-400">+1</td>
              </tr>
              <tr>
                <td className="font-bold">Gol Atmak</td>
                <td className="font-mono text-emerald-400">+6</td>
                <td className="font-mono text-emerald-400">+6</td>
                <td className="font-mono text-emerald-400">+5</td>
                <td className="font-mono text-emerald-400">+4</td>
              </tr>
              <tr>
                <td className="font-bold">Asist Yapmak</td>
                <td className="font-mono text-emerald-400">+3</td>
                <td className="font-mono text-emerald-400">+3</td>
                <td className="font-mono text-emerald-400">+3</td>
                <td className="font-mono text-emerald-400">+3</td>
              </tr>
              <tr>
                <td className="font-bold">Gol Yememek (Clean Sheet, 60+ Dk)</td>
                <td className="font-mono text-emerald-400">+4</td>
                <td className="font-mono text-emerald-400">+4</td>
                <td className="font-mono text-emerald-400">+1</td>
                <td className="font-mono text-[var(--text-muted)]">0</td>
              </tr>
              <tr>
                <td className="font-bold">Her 2 Gol Yiyişte (60+ Dk)</td>
                <td className="font-mono text-rose-400">-1</td>
                <td className="font-mono text-rose-400">-1</td>
                <td className="font-mono text-[var(--text-muted)]">0</td>
                <td className="font-mono text-[var(--text-muted)]">0</td>
              </tr>
              <tr>
                <td className="font-bold">Her 3 Kurtarış</td>
                <td className="font-mono text-emerald-400">+1</td>
                <td className="font-mono text-[var(--text-muted)]">0</td>
                <td className="font-mono text-[var(--text-muted)]">0</td>
                <td className="font-mono text-[var(--text-muted)]">0</td>
              </tr>
              <tr>
                <td className="font-bold">Penaltı Kurtarmak</td>
                <td className="font-mono text-emerald-400">+5</td>
                <td className="font-mono text-[var(--text-muted)]">0</td>
                <td className="font-mono text-[var(--text-muted)]">0</td>
                <td className="font-mono text-[var(--text-muted)]">0</td>
              </tr>
              <tr>
                <td className="font-bold">Penaltı Kaçırmak</td>
                <td className="font-mono text-rose-400">-2</td>
                <td className="font-mono text-rose-400">-2</td>
                <td className="font-mono text-rose-400">-2</td>
                <td className="font-mono text-rose-400">-2</td>
              </tr>
              <tr>
                <td className="font-bold">Sarı Kart</td>
                <td className="font-mono text-rose-400">-1</td>
                <td className="font-mono text-rose-400">-1</td>
                <td className="font-mono text-rose-400">-1</td>
                <td className="font-mono text-rose-400">-1</td>
              </tr>
              <tr>
                <td className="font-bold">Kırmızı Kart</td>
                <td className="font-mono text-rose-400">-3</td>
                <td className="font-mono text-rose-400">-3</td>
                <td className="font-mono text-rose-400">-3</td>
                <td className="font-mono text-rose-400">-3</td>
              </tr>
              <tr>
                <td className="font-bold">Kendi Kalesine Gol</td>
                <td className="font-mono text-rose-400">-2</td>
                <td className="font-mono text-rose-400">-2</td>
                <td className="font-mono text-rose-400">-2</td>
                <td className="font-mono text-rose-400">-2</td>
              </tr>
              <tr>
                <td className="font-bold">Maç Bonusu (1., 2., 3. Sıra)</td>
                <td className="font-mono text-amber-400" colSpan={4}>
                  +3 Puan (1. Sıra), +2 Puan (2. Sıra), +1 Puan (3. Sıra)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
