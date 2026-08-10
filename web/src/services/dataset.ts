import rawTeams from '../../../data/2026-27/teams.json';
import rawPlayers from '../../../data/2026-27/players.json';
import rawFixtures from '../../../data/2026-27/fixtures.json';
import rawProjections from '../../../data/2026-27/projections.json';

import {
  TeamsDataset,
  PlayersDataset,
  FixturesDataset,
  ProjectionsDataset,
  SeasonDataset,
  ProjectionItem,
} from '../types';

export function loadSeasonDataset(): SeasonDataset {
  try {
    const teamsData = rawTeams as unknown as TeamsDataset;
    const playersData = rawPlayers as unknown as PlayersDataset;
    const fixturesData = rawFixtures as unknown as FixturesDataset;
    const projectionsData = rawProjections as unknown as ProjectionsDataset;

    if (!teamsData || !Array.isArray(teamsData.teams)) {
      throw new Error('Takım verisi geçersiz veya okunamadı.');
    }
    if (!playersData || !Array.isArray(playersData.players)) {
      throw new Error('Oyuncu verisi geçersiz veya okunamadı.');
    }
    if (!fixturesData || !Array.isArray(fixturesData.fixtures)) {
      throw new Error('Fikstür verisi geçersiz veya okunamadı.');
    }

    const projectionsMap = new Map<string, ProjectionItem>();
    if (projectionsData && Array.isArray(projectionsData.projections)) {
      for (const proj of projectionsData.projections) {
        if (proj && proj.player_id) {
          projectionsMap.set(proj.player_id, proj);
        }
      }
    }

    return {
      teams: teamsData.teams,
      players: playersData.players,
      fixtures: fixturesData.fixtures,
      projections: projectionsMap,
      meta: {
        season: teamsData.season || '2026-27',
        teamsSource: teamsData.source,
        playersSource: playersData.source,
        fixturesSource: fixturesData.source,
        projectionsSource: projectionsData ? projectionsData.source : { name: 'Unknown', retrieved_at: '' },
      },
    };
  } catch (err) {
    console.error('Dataset yükleme hatası:', err);
    throw err;
  }
}

export function formatPrice(priceInUnits: number): string {
  // 500 unit = 5.0M TL
  const millions = (priceInUnits / 100).toFixed(1);
  return `${millions}M ₺`;
}

export function getPositionBadgeColor(position: string): { bg: string; text: string; border: string } {
  switch (position) {
    case 'Goalkeeper':
      return { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
    case 'Defender':
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    case 'Midfielder':
      return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
    case 'Forward':
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
    default:
      return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
  }
}

export function translatePosition(position: string): string {
  switch (position) {
    case 'Goalkeeper':
      return 'Kaleci';
    case 'Defender':
      return 'Defans';
    case 'Midfielder':
      return 'Orta Saha';
    case 'Forward':
      return 'Forvet';
    default:
      return position;
  }
}

export function getShortPosition(position: string): string {
  switch (position) {
    case 'Goalkeeper':
      return 'KL';
    case 'Defender':
      return 'DEF';
    case 'Midfielder':
      return 'OS';
    case 'Forward':
      return 'FOR';
    default:
      return position;
  }
}
