/**
 * RapidAPI free-api-live-football-data team name (substring, lowercased) to
 * our local team id. Ported from `scripts/sync_fixtures_results.py`'s
 * `TEAM_NAME_TO_ID` (the only place this mapping has actually been exercised
 * against real API responses) — keep the two in sync if team names change.
 */
export const TEAM_NAME_TO_ID: Record<string, string> = {
  galatasaray: 'galatasaray',
  çorum: 'corum-fk',
  corum: 'corum-fk',
  konyaspor: 'konyaspor',
  rizespor: 'caykur-rizespor',
  'çaykur rizespor': 'caykur-rizespor',
  gaziantep: 'gaziantep-fk',
  alanyaspor: 'alanyaspor',
  'corendon alanyaspor': 'alanyaspor',
  gençlerbirliği: 'genclerbirligi',
  genclerbirligi: 'genclerbirligi',
  fenerbahçe: 'fenerbahce',
  fenerbahce: 'fenerbahce',
  kasımpaşa: 'kasimpasa',
  kasimpasa: 'kasimpasa',
  trabzonspor: 'trabzonspor',
  beşiktaş: 'besiktas',
  besiktas: 'besiktas',
  eyüpspor: 'eyupspor',
  eyupspor: 'eyupspor',
  amed: 'amed-sportif-faaliyetler',
  'amed sportif faaliyetler': 'amed-sportif-faaliyetler',
  erzurumspor: 'erzurumspor-fk',
  başakşehir: 'istanbul-basaksehir',
  basaksehir: 'istanbul-basaksehir',
  'istanbul basaksehir': 'istanbul-basaksehir',
  kocaelispor: 'kocaelispor',
  samsunspor: 'samsunspor',
  göztepe: 'goztepe',
  goztepe: 'goztepe',
};

export function findTeamIdByApiName(apiName: string | undefined): string | undefined {
  const lower = (apiName || '').toLowerCase();
  for (const [needle, teamId] of Object.entries(TEAM_NAME_TO_ID)) {
    if (lower.includes(needle)) return teamId;
  }
  return undefined;
}
