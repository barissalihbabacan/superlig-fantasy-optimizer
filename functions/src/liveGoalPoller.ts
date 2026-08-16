/**
 * Scheduled goal-alert poller.
 *
 * Quota is far too tight (see rapidApiClient.ts) to poll every match in a
 * round, so this only ever calls RapidAPI when at least one *followed* team
 * (from `pushSubscriptions`) has a fixture inside its live window
 * (kickoff → kickoff+LIVE_WINDOW_MINUTES) right now — everything else exits
 * before spending any request. It reuses `football-get-all-matches-by-league`
 * (the one endpoint this project has verified end-to-end via
 * `scripts/sync_fixtures_results.py`) for score-change detection, and only
 * best-effort-enriches with `football-get-match-events` for the scorer/minute
 * — that endpoint's response shape has never been exercised in this codebase,
 * so its failure never blocks the core score notification.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import logger from 'firebase-functions/logger';
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

import { fetchRapidApi, rapidApiKey, SUPER_LIG_LEAGUE_ID } from './rapidApiClient.js';
import { findTeamIdByApiName } from './teamNameMap.js';
import fixturesDataset from './data/fixtures.json' with { type: 'json' };
import teamsDataset from './data/teams.json' with { type: 'json' };

interface FixtureRecord {
  id: string;
  home_team_id: string;
  away_team_id: string;
  kickoff: string;
}

const LIVE_WINDOW_MINUTES = 130;

function currentlyLiveFixtures(now: Date): FixtureRecord[] {
  const fixtures = (fixturesDataset as { fixtures: FixtureRecord[] }).fixtures;
  const nowMs = now.getTime();
  return fixtures.filter((f) => {
    const kickoffMs = new Date(f.kickoff).getTime();
    if (Number.isNaN(kickoffMs)) return false;
    return nowMs >= kickoffMs && nowMs <= kickoffMs + LIVE_WINDOW_MINUTES * 60_000;
  });
}

function teamName(teamId: string): string {
  const teams = (teamsDataset as { teams: { id: string; name: string }[] }).teams;
  return teams.find((t) => t.id === teamId)?.name ?? teamId;
}

async function subscribedTeamIds(db: Firestore): Promise<Set<string>> {
  const snap = await db.collection('pushSubscriptions').get();
  const ids = new Set<string>();
  snap.forEach((doc) => {
    const followed = (doc.data().followedTeamIds as string[] | undefined) ?? [];
    followed.forEach((id) => ids.add(id));
  });
  return ids;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiMatch = any;

async function notifyGoal(
  db: Firestore,
  fixture: FixtureRecord,
  homeScore: number,
  awayScore: number,
  apiMatch: ApiMatch
): Promise<void> {
  const homeName = teamName(fixture.home_team_id);
  const awayName = teamName(fixture.away_team_id);

  let detail = '';
  const eventId = apiMatch?.id ?? apiMatch?.eventId ?? apiMatch?.matchId;
  if (eventId) {
    try {
      const eventsResult = await fetchRapidApi('football-get-match-events', { matchid: eventId }, { db });
      if (eventsResult.ok) {
        const events: ApiMatch[] = JSON.parse(eventsResult.body)?.response?.events ?? [];
        const lastGoal = [...events]
          .reverse()
          .find((e) => e?.type === 'goal' || e?.eventType === 'Goal' || e?.incidentType === 'goal');
        const scorer = lastGoal?.player?.name ?? lastGoal?.playerName ?? '';
        const minute = lastGoal?.time ?? lastGoal?.minute ?? '';
        if (scorer) detail = ` (${scorer}${minute ? ` ${minute}'` : ''})`;
      }
    } catch (error) {
      logger.warn('liveGoalPoller: match-events enrichment failed, sending generic notification', {
        fixtureId: fixture.id,
        error: String(error),
      });
    }
  }

  const subsSnap = await db
    .collection('pushSubscriptions')
    .where('followedTeamIds', 'array-contains-any', [fixture.home_team_id, fixture.away_team_id])
    .get();
  if (subsSnap.empty) return;

  const tokens = subsSnap.docs.map((d) => d.id);
  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: '⚽ GOL!',
      body: `${homeName} ${homeScore}-${awayScore} ${awayName}${detail}`,
    },
  });

  const staleTokens: string[] = [];
  response.responses.forEach((r, i) => {
    const code = r.error?.code;
    if (
      !r.success &&
      (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered')
    ) {
      staleTokens.push(tokens[i]);
    }
  });
  await Promise.all(staleTokens.map((t) => db.collection('pushSubscriptions').doc(t).delete()));

  logger.info('liveGoalPoller: goal notification sent', {
    fixtureId: fixture.id,
    recipients: tokens.length,
    failures: response.failureCount,
  });
}

export const liveGoalPoller = onSchedule(
  { schedule: 'every 20 minutes', secrets: [rapidApiKey], region: 'us-central1', timeZone: 'Europe/Istanbul' },
  async () => {
    const db = getFirestore();
    const liveFixtures = currentlyLiveFixtures(new Date());
    if (liveFixtures.length === 0) return;

    const followedTeams = await subscribedTeamIds(db);
    if (followedTeams.size === 0) return;

    const relevantFixtures = liveFixtures.filter(
      (f) => followedTeams.has(f.home_team_id) || followedTeams.has(f.away_team_id)
    );
    if (relevantFixtures.length === 0) return;

    const result = await fetchRapidApi('football-get-all-matches-by-league', { leagueid: SUPER_LIG_LEAGUE_ID }, { db });
    if (!result.ok) {
      logger.warn('liveGoalPoller: RapidAPI request skipped or failed', { error: result.error });
      return;
    }

    let apiMatches: ApiMatch[];
    try {
      apiMatches = JSON.parse(result.body)?.response?.matches ?? [];
    } catch (error) {
      logger.error('liveGoalPoller: unexpected RapidAPI response shape', { error: String(error) });
      return;
    }

    for (const fixture of relevantFixtures) {
      const apiMatch = apiMatches.find((m) => {
        const homeId = findTeamIdByApiName(m?.home?.name);
        const awayId = findTeamIdByApiName(m?.away?.name);
        return homeId === fixture.home_team_id && awayId === fixture.away_team_id;
      });
      if (!apiMatch) continue;

      const homeScore = Number(apiMatch.home?.score);
      const awayScore = Number(apiMatch.away?.score);
      if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) continue;

      const stateRef = db.collection('liveMatchState').doc(fixture.id);
      const stateSnap = await stateRef.get();
      const previous = stateSnap.data();
      const isFirstObservation = !previous;
      const scoreChanged = !!previous && (previous.homeScore !== homeScore || previous.awayScore !== awayScore);

      await stateRef.set(
        { homeScore, awayScore, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );

      // Skip the very first observation of a fixture — otherwise whatever
      // score already existed when polling started would fire a false "goal".
      if (isFirstObservation || !scoreChanged) continue;

      await notifyGoal(db, fixture, homeScore, awayScore, apiMatch);
    }
  }
);
