export type PositionType = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';

export interface SourceMetadata {
  name: string;
  retrieved_at: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface TeamsDataset {
  schema_version: number;
  season: string;
  source: SourceMetadata;
  teams: Team[];
}

export interface Player {
  id: string;
  name: string;
  team_id: string;
  position: PositionType;
  price: number; // e.g. 500 = 5.0M TL
}

export interface PlayersDataset {
  schema_version: number;
  season: string;
  source: SourceMetadata;
  players: Player[];
}

export interface Fixture {
  id: string;
  round: number;
  home_team_id: string;
  away_team_id: string;
  kickoff: string;
  status: string;
  score?: { home: number; away: number };
  highlights_url?: string;
}

export interface FixturesDataset {
  schema_version: number;
  season: string;
  source: SourceMetadata;
  fixtures: Fixture[];
}

export interface ProjectionItem {
  player_id: string;
  expected_points: number;
  confidence?: number;
  upcoming_fixtures?: {
    round: number;
    opponent_team_id: string;
    is_home: boolean;
  }[];
}

export interface ProjectionsDataset {
  schema_version: number;
  season: string;
  source: SourceMetadata;
  projections: ProjectionItem[];
}

export interface SeasonDataset {
  teams: Team[];
  players: Player[];
  fixtures: Fixture[];
  projections: Map<string, ProjectionItem>;
  meta: {
    season: string;
    teamsSource: SourceMetadata;
    playersSource: SourceMetadata;
    fixturesSource: SourceMetadata;
    projectionsSource: SourceMetadata;
  };
}

export type FormationType =
  | 'Auto'
  | '3-5-2'
  | '3-4-3'
  | '4-3-3'
  | '4-4-2'
  | '4-5-1'
  | '5-4-1'
  | '5-3-2'
  | '5-2-3';

export type NavTab = 'dashboard' | 'players' | 'teams' | 'fixtures' | 'optimizer' | 'rules' | 'nostradamus' | 'tribun';
