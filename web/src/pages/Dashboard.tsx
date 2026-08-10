import React from 'react';
import { SeasonDataset, NavTab } from '../types';
import { formatPrice } from '../services/dataset';
import { 
  Shield, 
  Users, 
  Calendar, 
  Layers, 
  TrendingUp, 
  AlertCircle, 
  Info,
  ArrowRight,
  Zap,
  BookOpen
} from 'lucide-react';

interface DashboardProps {
  dataset: SeasonDataset;
  setActiveTab: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ dataset, setActiveTab }) => {
  const totalTeams = dataset.teams.length;
  const totalPlayers = dataset.players.length;
  const totalFixtures = dataset.fixtures.length;
  const supportedFormationsCount = 8; // 3-5-2, 3-4-3, 4-3-3, 4-4-2, 4-5-1, 5-4-1, 5-3-2, 5-2-3

  // Compute projection coverage dynamically
  const projectionCount = dataset.projections.size;
  const projectionCoverageText = `${projectionCount} / ${totalPlayers}`;

  // Calculate position counts
  const gkCount = dataset.players.filter((p) => p.position === 'Goalkeeper').length;
  const defCount = dataset.players.filter((p) => p.position === 'Defender').length;
  const midCount = dataset.players.filter((p) => p.position === 'Midfielder').length;
  const fwdCount = dataset.players.filter((p) => p.position === 'Forward').length;

  // Calculate average player price
  const avgPrice = totalPlayers > 0
    ? dataset.players.reduce((acc, p) => acc + p.price, 0) / totalPlayers
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-blue-900/40 via-slate-900/60 to-emerald-900/40 border border-blue-500/20">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Süper Lig Fantasy 2026/27 Sezonu</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Deterministik Kadro & Performans Analiz Dashboard'u
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Süper Lig oyuncu verilerini, takımları ve 34 haftalık lig fikstürünü inceleyin. Deterministik kurallar ve historical projection altyapısı ile kadronuzu hazırlayın.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={() => setActiveTab('players')}
              className="btn btn-primary"
            >
              <Users className="w-4 h-4" />
              <span>Oyuncuları İncele</span>
            </button>
            <button 
              onClick={() => setActiveTab('optimizer')}
              className="btn btn-secondary"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Optimizer Paneli</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid (Computed dynamically from JSON) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Stat 1: Teams */}
        <div 
          onClick={() => setActiveTab('teams')}
          className="glass-panel p-5 cursor-pointer hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Takım</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)]">{totalTeams}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Süper Lig Kulübü</div>
        </div>

        {/* Stat 2: Players */}
        <div 
          onClick={() => setActiveTab('players')}
          className="glass-panel p-5 cursor-pointer hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Oyuncu</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)]">{totalPlayers}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Kayıtlı Kadro Oyuncusu</div>
        </div>

        {/* Stat 3: Fixtures */}
        <div 
          onClick={() => setActiveTab('fixtures')}
          className="glass-panel p-5 cursor-pointer hover:border-cyan-500/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fikstür</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)]">{totalFixtures}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">34 Hafta Sezon Maçı</div>
        </div>

        {/* Stat 4: Formations */}
        <div 
          onClick={() => setActiveTab('rules')}
          className="glass-panel p-5 cursor-pointer hover:border-purple-500/50 transition-all group"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Formasyon</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)]">{supportedFormationsCount}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Desteklenen Diziliş</div>
        </div>

        {/* Stat 5: Projection Coverage */}
        <div className="glass-panel p-5 col-span-2 lg:col-span-1 border-amber-500/30">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Projection</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)]">{projectionCoverageText}</div>
          <div className="text-xs text-amber-400 mt-1 font-medium">Coverage Kapsamı</div>
        </div>
      </div>

      {/* Projection Explanation & Data Notice Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Projection Banner */}
        <div className="glass-panel p-5 border-l-4 border-l-blue-500 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-[var(--text-primary)] text-sm">Projection Veri Durumu</div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {projectionCount === 0 
                ? "Sezon henüz başlamadı veya eşleşen maç performansı bulunmuyor. Eşleşen gerçek maç verisi yoksa oyuncu tahmini 0 kalır; proje eksik veriyi uydurmaz."
                : `${projectionCount} oyuncu için historical projection verisi mevcut.`}
            </p>
          </div>
        </div>

        {/* Dataset Info Banner */}
        <div className="glass-panel p-5 border-l-4 border-l-amber-500 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-[var(--text-primary)] text-sm">Veri Kaynağı Hakkında</div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Data is manually maintained and may be incomplete. Veriler repository kapsamında manuel yönetilir ve resmi canlı yayın verisi değildir.
            </p>
          </div>
        </div>
      </div>

      {/* Position Breakdown Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Kadro Pozisyon Dağılımı</span>
          </h3>
          <span className="text-xs text-[var(--text-muted)]">Ortalama Fiyat: {formatPrice(avgPrice)}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* GK */}
          <div className="glass-panel p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">GK</span>
              <span className="text-xs text-[var(--text-muted)]">Kaleci</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{gkCount}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{(gkCount / totalPlayers * 100).toFixed(1)}% kadro payı</div>
            </div>
          </div>

          {/* DEF */}
          <div className="glass-panel p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">DEF</span>
              <span className="text-xs text-[var(--text-muted)]">Defans</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{defCount}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{(defCount / totalPlayers * 100).toFixed(1)}% kadro payı</div>
            </div>
          </div>

          {/* MID */}
          <div className="glass-panel p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">MID</span>
              <span className="text-xs text-[var(--text-muted)]">Orta Saha</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{midCount}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{(midCount / totalPlayers * 100).toFixed(1)}% kadro payı</div>
            </div>
          </div>

          {/* FWD */}
          <div className="glass-panel p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">FWD</span>
              <span className="text-xs text-[var(--text-muted)]">Forvet</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{fwdCount}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{(fwdCount / totalPlayers * 100).toFixed(1)}% kadro payı</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div 
          onClick={() => setActiveTab('players')}
          className="glass-panel p-5 cursor-pointer hover:border-blue-500/40 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <div className="font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">
              Oyuncu Arama & Filtreleme
            </div>
            <p className="text-xs text-[var(--text-muted)]">443 oyuncu arasında fiyat, pozisyon ve takıma göre arayın.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:translate-x-1 group-hover:text-blue-400 transition-all flex-shrink-0" />
        </div>

        <div 
          onClick={() => setActiveTab('fixtures')}
          className="glass-panel p-5 cursor-pointer hover:border-cyan-500/40 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <div className="font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors">
              Haftalık Lig Fikstürü
            </div>
            <p className="text-xs text-[var(--text-muted)]">1. haftadan 34. haftaya kadar maç programını görün.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:translate-x-1 group-hover:text-cyan-400 transition-all flex-shrink-0" />
        </div>

        <div 
          onClick={() => setActiveTab('rules')}
          className="glass-panel p-5 cursor-pointer hover:border-purple-500/40 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <div className="font-bold text-[var(--text-primary)] group-hover:text-purple-400 transition-colors">
              Fantasy Oyun Kuralları
            </div>
            <p className="text-xs text-[var(--text-muted)]">Puanlama matrisi, formasyonlar ve kadro kısıtları.</p>
          </div>
          <BookOpen className="w-5 h-5 text-[var(--text-muted)] group-hover:translate-x-1 group-hover:text-purple-400 transition-all flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};
