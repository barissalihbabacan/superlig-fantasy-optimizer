import React from 'react';
import { BookOpen, Shield, Award, Layers, TrendingUp } from 'lucide-react';

export const Rules: React.FC = () => {
  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-400" />
          <span>Süper Lig Fantasy Oyun Kuralları</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Rust optimizer çekirdeği (<code className="font-mono text-purple-400">src/rules.rs</code>) ile %100 birebir uyumlu kurallar
        </p>
      </div>

      {/* Section 1: Squad Rules */}
      <div className="glass-panel p-6 space-y-4 border-l-4 border-l-purple-500">
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <span>1. Kadro Kurma Kısıtları</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2">
            <div className="font-bold text-[var(--text-primary)]">Kadro Yapısı (15 Oyuncu)</div>
            <ul className="space-y-1.5 text-[var(--text-secondary)] list-disc list-inside">
              <li><strong className="text-[var(--text-primary)]">2 Kaleci (GK)</strong></li>
              <li><strong className="text-[var(--text-primary)]">5 Defans (DEF)</strong></li>
              <li><strong className="text-[var(--text-primary)]">5 Orta Saha (MID)</strong></li>
              <li><strong className="text-[var(--text-primary)]">3 Forvet (FWD)</strong></li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2">
            <div className="font-bold text-[var(--text-primary)]">Bütçe & Takım Limitleri</div>
            <ul className="space-y-1.5 text-[var(--text-secondary)] list-disc list-inside">
              <li>Toplu Bütçe Limiti: <strong className="text-amber-400 font-mono">10000</strong> (100.0M ₺)</li>
              <li>Takım Başına Sınır: En fazla <strong className="text-blue-400">3 oyuncu</strong></li>
              <li>Saha Dağılımı: 11 İlk XI + 4 Yedek Oyuncu</li>
              <li>Kaptan (2x Puan) ve İkinci Kaptan (VC)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2: Formations */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <span>2. Desteklenen Formasyonlar (8 Diziliş)</span>
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          İlk 11'de her zaman 1 Kaleci (GK) bulunmalıdır. Kalan 10 oyuncu aşağıdaki formasyonlara göre sahaya yerleştirilebilir:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
          {['3-5-2', '3-4-3', '4-3-3', '4-4-2', '4-5-1', '5-4-1', '5-3-2', '5-2-3'].map((fmt) => (
            <div key={fmt} className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] font-bold text-blue-400">
              {fmt}
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Scoring Rules */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <span>3. Fantasy Puanlama Matrisi (Scoring Engine)</span>
        </h3>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Olay / Kriter</th>
                <th>Açıklama</th>
                <th>Puan Değeri</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              <tr>
                <td className="font-semibold">Oynanan Dakika (&lt;60 dk)</td>
                <td>60 dakikadan az oynama</td>
                <td className="font-mono font-bold text-emerald-400">+1 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Oynanan Dakika (&ge;60 dk)</td>
                <td>60 dakika ve üzeri oynama</td>
                <td className="font-mono font-bold text-emerald-400">+2 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Kaleci Golü</td>
                <td>GK oyuncusunun attığı her gol</td>
                <td className="font-mono font-bold text-emerald-400">+10 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Defans Golü</td>
                <td>DEF oyuncusunun attığı her gol</td>
                <td className="font-mono font-bold text-emerald-400">+6 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Orta Saha Golü</td>
                <td>MID oyuncusunun attığı her gol</td>
                <td className="font-mono font-bold text-emerald-400">+5 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Forvet Golü</td>
                <td>FWD oyuncusunun attığı her gol</td>
                <td className="font-mono font-bold text-emerald-400">+4 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Asist</td>
                <td>Herhangi bir mevkideki oyuncunun asisti</td>
                <td className="font-mono font-bold text-emerald-400">+3 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Gol Yememe (Clean Sheet)</td>
                <td>GK ve DEF oyuncuları (&ge;60 dk oynama şartı)</td>
                <td className="font-mono font-bold text-emerald-400">+4 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Gol Yememe (Clean Sheet - MID)</td>
                <td>MID oyuncuları (&ge;60 dk oynama şartı)</td>
                <td className="font-mono font-bold text-emerald-400">+1 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Kaleci Kurtarışı</td>
                <td>Her 3 kaleci kurtarışı için</td>
                <td className="font-mono font-bold text-emerald-400">+1 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Penaltı Kurtarma</td>
                <td>Kalecinin kurtardığı penaltı</td>
                <td className="font-mono font-bold text-emerald-400">+5 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Penaltı Kaçırma</td>
                <td>Kaçırılan her penaltı</td>
                <td className="font-mono font-bold text-rose-400">-2 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Yenilen Gol (GK/DEF)</td>
                <td>Yenilen her 2 gol için</td>
                <td className="font-mono font-bold text-rose-400">-1 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Sarı Kart</td>
                <td>Alınan sarı kart</td>
                <td className="font-mono font-bold text-rose-400">-1 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Kırmızı Kart</td>
                <td>Alınan kırmızı kart</td>
                <td className="font-mono font-bold text-rose-400">-3 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Kendi Kalesine Gol</td>
                <td>Atılan kendi kalesine gol</td>
                <td className="font-mono font-bold text-rose-400">-2 Puan</td>
              </tr>
              <tr>
                <td className="font-semibold">Maç Bonusu (1, 2, 3)</td>
                <td>Sırasıyla en iyi 1., 2. ve 3. performans</td>
                <td className="font-mono font-bold text-emerald-400">+3, +2, +1 Puan</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Historical Projection Rules */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <span>4. Historical Projection Hesabı</span>
        </h3>
        <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-disc list-inside leading-relaxed">
          <li>Son 5 oynanan lig maçının puanları kullanılır.</li>
          <li>Ağırlık katsayıları: <code className="font-mono text-cyan-400 font-bold">[1, 2, 3, 4, 5]</code> (En yeni maç en yüksek ağırlığı alır).</li>
          <li>0 dakika oynanan maçlar hesaba katılmaz.</li>
          <li>Eşleşen performans yoksa tahmini expected points <strong>0</strong> olur.</li>
        </ul>
      </div>
    </div>
  );
};
