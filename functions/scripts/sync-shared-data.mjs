// Copies the season dataset files the live-goal poller needs (kickoff times,
// team names) from the repo's single source of truth into functions/src/data
// so they can be `import`ed (and get auto-copied into lib/ by tsc's
// resolveJsonModule) — Firebase only uploads the functions/ directory on
// deploy, so a relative import reaching outside it would silently 404 there.
// Runs automatically as npm's "prebuild" step before every `npm run build`.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const sourceDir = join(repoRoot, 'data', '2026-27');
const destDir = join(here, '..', 'src', 'data');

mkdirSync(destDir, { recursive: true });

for (const file of ['fixtures.json', 'teams.json']) {
  copyFileSync(join(sourceDir, file), join(destDir, file));
  console.log(`[sync-shared-data] copied ${file} -> functions/src/data/${file}`);
}
