import React, { useState } from 'react';
import { CommunityChat } from '../components/CommunityChat';
import { MessageSquare, Flame, Trophy, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { SeasonDataset } from '../types';

interface TribunProps {
  dataset: SeasonDataset;
}

type ChatChannel = 'global' | 'captains' | 'nostradamus_chat' | 'transfers';

export const Tribun: React.FC<TribunProps> = () => {
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('global');

  const channels: { id: ChatChannel; label: string; icon: React.ReactNode; subtitle: string; empty: string }[] = [
    {
      id: 'global',
      label: 'Genel Tribün',
      icon: <MessageSquare className="w-4 h-4" />,
      subtitle: 'Tüm Süper Lig fantezi futbolseverleri ile genel sohbet ve kadro değerlendirmeleri.',
      empty: 'Genel tribünde henüz bir mesaj yok. İlk taktiği sen paylaş!',
    },
    {
      id: 'captains',
      label: 'Kaptan Tavsiyeleri',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      subtitle: 'Haftanın kaptanı kim olmalı? Çift puan getirecek yıldızları tartışın.',
      empty: 'Bu hafta için henüz kaptan önerisi yazılmadı. Senin adayın kim?',
    },
    {
      id: 'nostradamus_chat',
      label: 'Nostradamus Tahminleri',
      icon: <Trophy className="w-4 h-4 text-emerald-400" />,
      subtitle: 'Haftanın maç skorları, sürprizler ve Nostradamus tahmin tartışmaları.',
      empty: 'Haftanın maçları hakkında ilk skor tahminini veya analizini bırak!',
    },
    {
      id: 'transfers',
      label: 'Transfer & Sakatlıklar',
      icon: <Users className="w-4 h-4 text-blue-400" />,
      subtitle: 'Yeni transferler, son dakika sakatlıkları ve kadro dışı haberleri.',
      empty: 'Transfer veya sakatlık gelişmesi paylaşmak için yazmaya başla!',
    },
  ];

  const currentChannel = channels.find((c) => c.id === activeChannel) || channels[0];

  return (
    <div className="space-y-4 animate-fade-in max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="card-sofa p-4 sm:p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-brand)]/20 text-[var(--color-brand)] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-[var(--text-primary)] tracking-tight">
              Süper Lig Fantezi Tribünü
            </h1>
            <span className="badge-sofa badge-live text-[10px] font-bold">CANLI SOHBET</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xl">
            Diğer menajerlerle canlı olarak kadro taktiklerini, kaptan seçimlerini ve son dakika maç gelişmelerini tartışın.
          </p>
        </div>

        {/* Quick Rules Badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[11px] text-[var(--text-muted)]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Saygılı, sportmen ve küfürsüz sohbet topluluğu.</span>
        </div>
      </div>

      {/* Channel Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {channels.map((ch) => {
          const isActive = activeChannel === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[var(--color-brand)] text-[#0c1017] shadow-md shadow-[var(--color-brand)]/10 scale-[1.02]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border)]'
              }`}
            >
              {ch.icon}
              <span>{ch.label}</span>
            </button>
          );
        })}
      </div>

      {/* Real-time Community Chat */}
      <CommunityChat
        key={activeChannel}
        topicId={activeChannel}
        title={currentChannel.label}
        subtitle={currentChannel.subtitle}
        emptyNotice={currentChannel.empty}
        className="h-[560px]"
      />
    </div>
  );
};
