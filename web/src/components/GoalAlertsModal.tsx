import React, { useState } from 'react';
import { X, BellRing, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { SeasonDataset } from '../types';
import { getTeamBranding } from '../services/dataset';
import { requestGoalAlertSubscription, getSavedFollowedTeamIds } from '../services/pushNotifications';

interface GoalAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: SeasonDataset;
}

export const GoalAlertsModal: React.FC<GoalAlertsModalProps> = ({ isOpen, onClose, dataset }) => {
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(() => getSavedFollowedTeamIds());
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
    setStatus('idle');
  };

  const handleSave = async () => {
    setStatus('saving');
    const result = await requestGoalAlertSubscription(selectedTeamIds);
    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'Bilinmeyen hata.');
    }
  };

  return (
    <div
      id="goal-alerts-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="sofa-card w-full max-w-lg overflow-hidden border-[var(--border-strong)] shadow-2xl bg-[var(--bg-card)] flex flex-col max-h-[90vh]">
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[var(--text-primary)]">Gol Bildirimleri</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Takip ettiğin takım gol attığında anında bildirim al
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
          <p className="text-[11px] text-[var(--text-muted)]">
            Bildirim gönderebilmek için tarayıcı iznine ihtiyacımız var. Takip ettiğin takımların canlı maçlarında gol
            olduğunda push bildirimi göndeririz — sekme kapalıyken bile.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {dataset.teams.map((team) => {
              const branding = getTeamBranding(team.id);
              const isSelected = selectedTeamIds.includes(team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10'
                      : 'border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: branding.primaryColor }}
                    />
                    <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">{team.name}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {status === 'error' && (
            <div className="p-2.5 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {status === 'success' && (
            <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Bildirimler ayarlandı.</span>
            </div>
          )}
        </div>

        <div className="p-3 sm:px-5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[var(--text-muted)]">{selectedTeamIds.length} takım seçildi</span>
          <button
            onClick={handleSave}
            disabled={status === 'saving' || selectedTeamIds.length === 0}
            className="btn-sofa btn-sofa-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
          >
            {status === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
