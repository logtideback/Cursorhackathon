#!/usr/bin/env npx tsx
/**
 * Taste development seed runner.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed -- --size=full
 *   npm run seed:small
 *   npm run seed:reset
 *   npm run seed -- --size=medium --reset
 *   npm run seed -- --size=full --remote-placeholders
 */

import { createServiceClient, loadSeedEnv } from './env';
import { resetSeedData } from './reset';
import { runSeed } from './run';
import { SEED_SIZES, type SeedSizeName } from './sizes';

function parseArgs(argv: string[]) {
  const sizeArg = argv.find((arg) => arg.startsWith('--size='))?.split('=')[1] as
    SeedSizeName | undefined;
  const size = sizeArg && sizeArg in SEED_SIZES ? sizeArg : 'full';
  return {
    size,
    reset: argv.includes('--reset') || argv.includes('--reset-only'),
    resetOnly: argv.includes('--reset-only'),
    remotePlaceholders: argv.includes('--remote-placeholders'),
    help: argv.includes('--help') || argv.includes('-h'),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Taste seed

Options:
  --size=small|medium|full   Dataset size (default: full)
  --reset                    Wipe seed users before seeding
  --reset-only               Wipe seed users and exit
  --remote-placeholders      Skip storage uploads; use placehold.co URLs
  --help                     Show this message

Requires:
  SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
`);
    return;
  }

  const env = loadSeedEnv();
  const client = createServiceClient(env);
  const size = SEED_SIZES[args.size];

  if (args.reset || args.resetOnly) {
    await resetSeedData(client);
    if (args.resetOnly) {
      return;
    }
  }

  console.log(`Seeding ${size.name} dataset…`);
  await runSeed({
    client,
    size,
    useRemotePlaceholders: args.remotePlaceholders,
  });
  console.log('Done.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
