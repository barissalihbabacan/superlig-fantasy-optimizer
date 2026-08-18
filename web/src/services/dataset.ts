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
  Fixture,
} from '../types';

export interface TeamBranding {
  code: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  stadium: string;
  city: string;
}

export const TEAM_BRANDINGS: Record<string, TeamBranding> = {
  'galatasaray': {
    code: 'GS',
    primaryColor: '#fdb912',
    secondaryColor: '#a90432',
    textColor: '#ffffff',
    stadium: 'RAMS Park',
    city: 'İstanbul',
  },
  'fenerbahce': {
    code: 'FB',
    primaryColor: '#002d72',
    secondaryColor: '#fff000',
    textColor: '#ffffff',
    stadium: 'Ülker Stadyumu',
    city: 'İstanbul',
  },
  'besiktas': {
    code: 'BJK',
    primaryColor: '#111111',
    secondaryColor: '#ffffff',
    textColor: '#ffffff',
    stadium: 'Tüpraş Stadyumu',
    city: 'İstanbul',
  },
  'trabzonspor': {
    code: 'TS',
    primaryColor: '#800020',
    secondaryColor: '#60a5fa',
    textColor: '#ffffff',
    stadium: 'Papara Park',
    city: 'Trabzon',
  },
  'corum-fk': {
    code: 'ÇRM',
    primaryColor: '#dc2626',
    secondaryColor: '#111111',
    textColor: '#ffffff',
    stadium: 'Çorum Şehir Stadyumu',
    city: 'Çorum',
  },
  'istanbul-basaksehir': {
    code: 'İBFK',
    primaryColor: '#ea580c',
    secondaryColor: '#1e3a8a',
    textColor: '#ffffff',
    stadium: 'Başakşehir Fatih Terim Stadyumu',
    city: 'İstanbul',
  },
  'kasimpasa': {
    code: 'KAS',
    primaryColor: '#1e3a8a',
    secondaryColor: '#ffffff',
    textColor: '#ffffff',
    stadium: 'Recep Tayyip Erdoğan Stadyumu',
    city: 'İstanbul',
  },
  'samsunspor': {
    code: 'SAM',
    primaryColor: '#dc2626',
    secondaryColor: '#ffffff',
    textColor: '#ffffff',
    stadium: 'Samsun 19 Mayıs Stadyumu',
    city: 'Samsun',
  },
  'goztepe': {
    code: 'GÖZ',
    primaryColor: '#eab308',
    secondaryColor: '#dc2626',
    textColor: '#000000',
    stadium: 'Gürsel Aksel Stadyumu',
    city: 'İzmir',
  },
  'alanyaspor': {
    code: 'ALN',
    primaryColor: '#ea580c',
    secondaryColor: '#16a34a',
    textColor: '#ffffff',
    stadium: 'Gain Park Stadyumu',
    city: 'Antalya',
  },
  'gaziantep-fk': {
    code: 'GFK',
    primaryColor: '#dc2626',
    secondaryColor: '#111111',
    textColor: '#ffffff',
    stadium: 'Kalyon Stadyumu',
    city: 'Gaziantep',
  },
  'konyaspor': {
    code: 'KON',
    primaryColor: '#16a34a',
    secondaryColor: '#ffffff',
    textColor: '#ffffff',
    stadium: 'MEDAŞ Konya Büyükşehir Stadyumu',
    city: 'Konya',
  },
  'caykur-rizespor': {
    code: 'RİZ',
    primaryColor: '#2563eb',
    secondaryColor: '#16a34a',
    textColor: '#ffffff',
    stadium: 'Çaykur Didi Stadyumu',
    city: 'Rize',
  },
  'eyupspor': {
    code: 'EYÜP',
    primaryColor: '#eab308',
    secondaryColor: '#6b21a8',
    textColor: '#000000',
    stadium: 'Eyüp Stadyumu',
    city: 'İstanbul',
  },
  'genclerbirligi': {
    code: 'GB',
    primaryColor: '#dc2626',
    secondaryColor: '#111111',
    textColor: '#ffffff',
    stadium: 'Eryaman Stadyumu',
    city: 'Ankara',
  },
  'kocaelispor': {
    code: 'KOC',
    primaryColor: '#16a34a',
    secondaryColor: '#111111',
    textColor: '#ffffff',
    stadium: 'Kocaeli Stadyumu',
    city: 'Kocaeli',
  },
  'erzurumspor-fk': {
    code: 'ERZ',
    primaryColor: '#2563eb',
    secondaryColor: '#ffffff',
    textColor: '#ffffff',
    stadium: 'Kazım Karabekir Stadyumu',
    city: 'Erzurum',
  },
  'amed-sportif-faaliyetler': {
    code: 'AMD',
    primaryColor: '#16a34a',
    secondaryColor: '#dc2626',
    textColor: '#ffffff',
    stadium: 'Diyarbakır Stadyumu',
    city: 'Diyarbakır',
  },
};

export function getTeamBranding(teamId: string): TeamBranding {
  return TEAM_BRANDINGS[teamId] || {
    code: teamId.slice(0, 3).toUpperCase(),
    primaryColor: '#3b82f6',
    secondaryColor: '#1e293b',
    textColor: '#ffffff',
    stadium: 'Stadyum',
    city: 'Türkiye',
  };
}

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
  const millions = (priceInUnits / 100).toFixed(1);
  return `${millions}M ₺`;
}

export function getPositionBadgeColor(position: string): { bg: string; text: string; border: string } {
  switch (position) {
    case 'Goalkeeper':
      return { bg: 'rgba(234, 179, 8, 0.12)', text: '#eab308', border: 'rgba(234, 179, 8, 0.25)' };
    case 'Defender':
      return { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' };
    case 'Midfielder':
      return { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.25)' };
    case 'Forward':
      return { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.25)' };
    default:
      return { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.25)' };
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

export function formatDateDDMMYYYY(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    if (isoString.includes('T')) {
      const [ymd] = isoString.split('T');
      const parts = ymd.split('-');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoString;
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Automatically determines the current active match round from fixture statuses.
 * Returns the earliest round that contains unfinished ('scheduled' or 'live') matches.
 */
export function getCurrentActiveRound(fixtures: Fixture[]): number {
  if (!fixtures || fixtures.length === 0) return 1;

  const roundMap = new Map<number, { total: number; finished: number }>();
  for (const f of fixtures) {
    const r = f.round || 1;
    const current = roundMap.get(r) || { total: 0, finished: 0 };
    current.total += 1;
    if (f.status === 'finished') {
      current.finished += 1;
    }
    roundMap.set(r, current);
  }

  const sortedRounds = Array.from(roundMap.keys()).sort((a, b) => a - b);
  for (const r of sortedRounds) {
    const stat = roundMap.get(r);
    if (stat && stat.finished < stat.total) {
      return r;
    }
  }

  return sortedRounds[sortedRounds.length - 1] || 1;
}

