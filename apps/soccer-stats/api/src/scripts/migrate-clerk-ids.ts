/**
 * One-time migration script to populate clerkId for existing users.
 *
 * This script:
 * 1. Connects to the database
 * 2. Fetches all users without a clerkId
 * 3. Looks up each user in Clerk by email
 * 4. Updates the clerkId field
 *
 * Usage:
 *   # Development (uses local .env)
 *   npx ts-node apps/soccer-stats/api/src/scripts/migrate-clerk-ids.ts
 *
 *   # Production (set env vars first)
 *   DB_HOST=xxx CLERK_SECRET_KEY=xxx npx ts-node apps/soccer-stats/api/src/scripts/migrate-clerk-ids.ts
 *
 *   # Dry run (no changes, just report)
 *   DRY_RUN=true npx ts-node apps/soccer-stats/api/src/scripts/migrate-clerk-ids.ts
 */

import { createClerkClient } from '@clerk/backend';
import { Client } from 'pg';

// Load .env file if present (for local development)

try {
  require('dotenv').config();
} catch {
  /* dotenv not installed - using env vars */
}

interface User {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  clerkId: string | null;
}

interface MigrationResult {
  userId: string;
  email: string;
  clerkId: string | null;
  status: 'migrated' | 'not_found' | 'already_set' | 'no_email' | 'error';
  error?: string;
}

async function main() {
  const isDryRun = process.env.DRY_RUN === 'true';

  console.log('='.repeat(60));
  console.log('Clerk ID Migration Script');
  console.log('='.repeat(60));
  if (isDryRun) {
    console.log('DRY RUN MODE - No changes will be made\n');
  }

  // Validate required environment variables
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.error('ERROR: CLERK_SECRET_KEY environment variable is required');
    process.exit(1);
  }

  // Initialize Clerk client
  const clerk = createClerkClient({ secretKey: clerkSecretKey });

  // Connect to PostgreSQL
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'soccer_stats',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Fetch all users
    const result = await client.query<User>(
      'SELECT id, email, "firstName", "lastName", "clerkId" FROM users ORDER BY email'
    );
    const users = result.rows;

    console.log(`Found ${users.length} users in database\n`);

    const results: MigrationResult[] = [];

    for (const user of users) {
      // Skip users without email
      if (!user.email) {
        results.push({
          userId: user.id,
          email: '(no email)',
          clerkId: null,
          status: 'no_email',
        });
        continue;
      }

      // Skip users who already have clerkId set
      if (user.clerkId) {
        results.push({
          userId: user.id,
          email: user.email,
          clerkId: user.clerkId,
          status: 'already_set',
        });
        continue;
      }

      try {
        // Look up user in Clerk by email
        const clerkUsers = await clerk.users.getUserList({
          emailAddress: [user.email],
        });

        if (clerkUsers.data.length === 0) {
          results.push({
            userId: user.id,
            email: user.email,
            clerkId: null,
            status: 'not_found',
          });
          continue;
        }

        const clerkUser = clerkUsers.data[0];

        if (!isDryRun) {
          // Update the user's clerkId
          await client.query('UPDATE users SET "clerkId" = $1 WHERE id = $2', [
            clerkUser.id,
            user.id,
          ]);
        }

        results.push({
          userId: user.id,
          email: user.email,
          clerkId: clerkUser.id,
          status: 'migrated',
        });
      } catch (error) {
        results.push({
          userId: user.id,
          email: user.email,
          clerkId: null,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Print results summary
    console.log('\n' + '='.repeat(60));
    console.log('Migration Results');
    console.log('='.repeat(60));

    const migrated = results.filter((r) => r.status === 'migrated');
    const notFound = results.filter((r) => r.status === 'not_found');
    const alreadySet = results.filter((r) => r.status === 'already_set');
    const noEmail = results.filter((r) => r.status === 'no_email');
    const errors = results.filter((r) => r.status === 'error');

    console.log(`\nSummary:`);
    console.log(`  Migrated:    ${migrated.length}`);
    console.log(`  Already set: ${alreadySet.length}`);
    console.log(`  Not in Clerk: ${notFound.length}`);
    console.log(`  No email:    ${noEmail.length}`);
    console.log(`  Errors:      ${errors.length}`);

    if (migrated.length > 0) {
      console.log(`\n${isDryRun ? 'Would migrate' : 'Migrated'}:`);
      for (const r of migrated) {
        console.log(`  ${r.email} -> ${r.clerkId}`);
      }
    }

    if (notFound.length > 0) {
      console.log(`\nNot found in Clerk (may need manual review):`);
      for (const r of notFound) {
        console.log(`  ${r.email}`);
      }
    }

    if (errors.length > 0) {
      console.log(`\nErrors:`);
      for (const r of errors) {
        console.log(`  ${r.email}: ${r.error}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    if (isDryRun) {
      console.log('DRY RUN COMPLETE - No changes were made');
      console.log('Run without DRY_RUN=true to apply changes');
    } else {
      console.log('Migration complete!');
    }
    console.log('='.repeat(60));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
