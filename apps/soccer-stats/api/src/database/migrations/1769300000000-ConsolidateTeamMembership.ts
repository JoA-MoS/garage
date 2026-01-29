import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Consolidates TeamPlayer and TeamCoach into a unified TeamMember + TeamMemberRole model.
 *
 * Design:
 * - TeamMember: One record per (user, team) - stores membership-level data
 * - TeamMemberRole: One record per role per membership - stores role + polymorphic roleData
 *
 * Key changes:
 * - GUEST_COACH is now a separate role (instead of isGuest flag on COACH)
 * - GUARDIAN replaces PARENT_FAN (for parents/guardians of minors)
 * - FAN is a new role (for supporters with view-only access)
 * - Role-specific data stored in JSONB roleData column
 *
 * Migration steps:
 * 1. Add GUEST_COACH, GUARDIAN, and FAN to the TeamRole enum
 * 2. Create team_member_roles table with roleData JSONB
 * 3. Add membership columns to team_members (joinedDate, leftDate, isActive)
 * 4. Migrate existing team_members roles to team_member_roles (PARENT_FAN -> GUARDIAN)
 * 5. Migrate team_players data
 * 6. Migrate team_coaches data (isGuest=true becomes GUEST_COACH role)
 * 7. Drop legacy columns from team_members
 *
 * ⚠️ IMPORTANT: Transaction Safety
 * PostgreSQL requires enum additions to be committed before they can be used in
 * subsequent queries. This migration commits after Step 1 (enum additions), then
 * starts a new transaction for Steps 2-7. If the migration fails AFTER the enum
 * commit but BEFORE completion:
 *
 * Manual Recovery Steps:
 * 1. Check which step failed by examining the error message
 * 2. If team_member_roles table exists but is incomplete:
 *    - DROP TABLE IF EXISTS team_member_roles;
 * 3. If team_members has partial columns:
 *    - ALTER TABLE team_members DROP COLUMN IF EXISTS joinedDate;
 *    - ALTER TABLE team_members DROP COLUMN IF EXISTS leftDate;
 *    - ALTER TABLE team_members DROP COLUMN IF EXISTS isActive;
 * 4. Re-run the migration
 *
 * Note: The enum values (GUEST_COACH, GUARDIAN, FAN) cannot be easily removed from
 * PostgreSQL and will remain even after rollback. They are harmless if unused.
 */
export class ConsolidateTeamMembership1769300000000
  implements MigrationInterface
{
  name = 'ConsolidateTeamMembership1769300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL requires enum additions to be committed before they can be used.
    // We commit after adding enums, then start a new transaction for the rest.

    // Step 1a: Add GUEST_COACH to the TeamRole enum
    await queryRunner.query(`
      ALTER TYPE "public"."team_members_role_enum"
      ADD VALUE IF NOT EXISTS 'GUEST_COACH'
    `);

    // Step 1b: Add GUARDIAN to the TeamRole enum (for parents/legal guardians of minors)
    await queryRunner.query(`
      ALTER TYPE "public"."team_members_role_enum"
      ADD VALUE IF NOT EXISTS 'GUARDIAN'
    `);

    // Step 1c: Add FAN to the TeamRole enum (for supporters with view-only access)
    await queryRunner.query(`
      ALTER TYPE "public"."team_members_role_enum"
      ADD VALUE IF NOT EXISTS 'FAN'
    `);

    // Commit enum changes so they can be used in subsequent queries
    // ⚠️ After this point, enum values are persisted even if migration fails
    await queryRunner.commitTransaction();
    await queryRunner.startTransaction();

    // Wrap post-commit operations in try-catch for better error reporting
    try {
      // Step 2: Create team_member_roles table with JSONB roleData
      console.log('Step 2: Creating team_member_roles table...');
      await queryRunner.query(`
        CREATE TABLE "team_member_roles" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "teamMemberId" uuid NOT NULL,
          "role" "public"."team_members_role_enum" NOT NULL,
          "roleData" jsonb NOT NULL DEFAULT '{}',
          CONSTRAINT "PK_team_member_roles" PRIMARY KEY ("id"),
          CONSTRAINT "FK_team_member_roles_teamMember" FOREIGN KEY ("teamMemberId")
            REFERENCES "team_members"("id") ON DELETE CASCADE
        )
      `);

      // Create unique index: one role per membership
      await queryRunner.query(`
        CREATE UNIQUE INDEX "idx_team_member_role_unique"
        ON "team_member_roles" ("teamMemberId", "role")
      `);

      // Index for faster lookups by teamMemberId
      await queryRunner.query(`
        CREATE INDEX "idx_team_member_role_team_member"
        ON "team_member_roles" ("teamMemberId")
      `);

      // Validate: table created successfully
      const tableCheck = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'team_member_roles'
        ) as exists
      `);
      if (!tableCheck[0].exists) {
        throw new Error(
          'Validation failed: team_member_roles table was not created',
        );
      }
      console.log('Step 2: ✓ team_member_roles table created');

      // Step 3: Add membership columns to team_members
      console.log('Step 3: Adding membership columns to team_members...');
      await queryRunner.query(`
        ALTER TABLE "team_members"
        ADD COLUMN IF NOT EXISTS "joinedDate" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "leftDate" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true
      `);
      console.log('Step 3: ✓ Membership columns added');

      // Step 4: Migrate existing team_members roles to team_member_roles
      // Handle isGuest=true -> GUEST_COACH, isGuest=false -> keep original role
      // PARENT_FAN -> GUARDIAN: store linkedPlayerId in roleData (guardians have linked players)
      console.log('Step 4: Migrating existing team_members roles...');
      const existingRolesResult = await queryRunner.query(`
        INSERT INTO "team_member_roles" ("teamMemberId", "role", "roleData")
        SELECT
          tm.id,
          CASE
            WHEN tm.role = 'COACH' AND tm."isGuest" = true THEN 'GUEST_COACH'::"public"."team_members_role_enum"
            WHEN tm.role = 'PARENT_FAN' THEN 'GUARDIAN'::"public"."team_members_role_enum"
            ELSE tm.role
          END,
          CASE
            WHEN tm.role = 'PARENT_FAN' AND tm."linkedPlayerId" IS NOT NULL
              THEN jsonb_build_object('linkedPlayerId', tm."linkedPlayerId"::text)
            ELSE '{}'::jsonb
          END
        FROM "team_members" tm
        WHERE tm.role IS NOT NULL
      `);
      console.log(
        `Step 4: ✓ Migrated ${existingRolesResult?.length || 0} existing role(s)`,
      );

      // Step 5: Migrate team_players data
      // First, create TeamMember records for any players not already in team_members
      // Include role='PLAYER' for databases where role column is NOT NULL
      console.log('Step 5: Migrating team_players data...');
      await queryRunner.query(`
        INSERT INTO "team_members" (
          "teamId", "userId", "joinedDate", "leftDate", "isActive", "role"
        )
        SELECT
          tp."teamId",
          tp."userId",
          tp."joinedDate",
          tp."leftDate",
          tp."isActive",
          'PLAYER'::"public"."team_members_role_enum"
        FROM "team_players" tp
        WHERE NOT EXISTS (
          SELECT 1 FROM "team_members" tm
          WHERE tm."teamId" = tp."teamId" AND tm."userId" = tp."userId"
        )
      `);

      // Update existing team_members with player data if they don't have joinedDate set
      await queryRunner.query(`
        UPDATE "team_members" tm
        SET
          "joinedDate" = COALESCE(tm."joinedDate", tp."joinedDate"),
          "leftDate" = COALESCE(tm."leftDate", tp."leftDate"),
          "isActive" = tp."isActive"
        FROM "team_players" tp
        WHERE tm."teamId" = tp."teamId" AND tm."userId" = tp."userId"
      `);

      // Create PLAYER role records with jerseyNumber and primaryPosition in roleData
      const playerRolesResult = await queryRunner.query(`
        INSERT INTO "team_member_roles" ("teamMemberId", "role", "roleData")
        SELECT
          tm.id,
          'PLAYER'::"public"."team_members_role_enum",
          jsonb_strip_nulls(jsonb_build_object(
            'jerseyNumber', tp."jerseyNumber",
            'primaryPosition', tp."primaryPosition"
          ))
        FROM "team_players" tp
        JOIN "team_members" tm ON tm."teamId" = tp."teamId" AND tm."userId" = tp."userId"
        ON CONFLICT ("teamMemberId", "role") DO UPDATE SET
          "roleData" = EXCLUDED."roleData"
      `);
      console.log(
        `Step 5: ✓ Migrated ${playerRolesResult?.length || 0} player role(s)`,
      );

      // Step 6: Migrate team_coaches data
      // First, create TeamMember records for any coaches not already in team_members
      // Handle both schemas: legacy (isGuest column) and production (role column)
      console.log('Step 6: Migrating team_coaches data...');

      // Check if isGuest column exists (legacy schema) or role column (production schema)
      const hasIsGuestColumn = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'team_coaches' AND column_name = 'isGuest'
        ) as exists
      `);

      if (hasIsGuestColumn[0]?.exists) {
        // Legacy schema: use isGuest to determine role
        await queryRunner.query(`
          INSERT INTO "team_members" (
            "teamId", "userId", "joinedDate", "leftDate", "isActive", "role"
          )
          SELECT
            tc."teamId",
            tc."userId",
            tc."startDate",
            tc."endDate",
            tc."isActive",
            CASE WHEN tc."isGuest" = true
              THEN 'GUEST_COACH'::"public"."team_members_role_enum"
              ELSE 'COACH'::"public"."team_members_role_enum"
            END
          FROM "team_coaches" tc
          WHERE NOT EXISTS (
            SELECT 1 FROM "team_members" tm
            WHERE tm."teamId" = tc."teamId" AND tm."userId" = tc."userId"
          )
        `);
      } else {
        // Production schema: team_coaches.role is a varchar containing the coach's title
        // (e.g., "Head Coach"), not a TeamRole enum. All coaches get COACH role;
        // the title is stored in roleData later (Step 6 coach roles creation)
        await queryRunner.query(`
          INSERT INTO "team_members" (
            "teamId", "userId", "joinedDate", "leftDate", "isActive", "role"
          )
          SELECT
            tc."teamId",
            tc."userId",
            tc."startDate",
            tc."endDate",
            tc."isActive",
            'COACH'::"public"."team_members_role_enum"
          FROM "team_coaches" tc
          WHERE NOT EXISTS (
            SELECT 1 FROM "team_members" tm
            WHERE tm."teamId" = tc."teamId" AND tm."userId" = tc."userId"
          )
        `);
      }

      // Update existing team_members with coach data if joinedDate not set
      await queryRunner.query(`
        UPDATE "team_members" tm
        SET
          "joinedDate" = COALESCE(tm."joinedDate", tc."startDate"),
          "leftDate" = COALESCE(tm."leftDate", tc."endDate"),
          "isActive" = CASE WHEN tm."isActive" = false THEN false ELSE tc."isActive" END
        FROM "team_coaches" tc
        WHERE tm."teamId" = tc."teamId" AND tm."userId" = tc."userId"
      `);

      // Create COACH role records (or GUEST_COACH if applicable)
      // Note: We don't have isGuest on team_coaches, so all become regular COACH
      // team_coaches.role is the coach title (e.g., "Head Coach")
      const coachRolesResult = await queryRunner.query(`
        INSERT INTO "team_member_roles" ("teamMemberId", "role", "roleData")
        SELECT
          tm.id,
          'COACH'::"public"."team_members_role_enum",
          jsonb_strip_nulls(jsonb_build_object('title', tc."role"))
        FROM "team_coaches" tc
        JOIN "team_members" tm ON tm."teamId" = tc."teamId" AND tm."userId" = tc."userId"
        ON CONFLICT ("teamMemberId", "role") DO UPDATE SET
          "roleData" = EXCLUDED."roleData"
      `);
      console.log(
        `Step 6: ✓ Migrated ${coachRolesResult?.length || 0} coach role(s)`,
      );

      // Validate: all memberships have at least one role
      const orphanedMembers = await queryRunner.query(`
        SELECT COUNT(*) as count FROM "team_members" tm
        WHERE NOT EXISTS (
          SELECT 1 FROM "team_member_roles" tmr
          WHERE tmr."teamMemberId" = tm.id
        )
      `);
      if (parseInt(orphanedMembers[0].count) > 0) {
        console.warn(
          `Warning: ${orphanedMembers[0].count} team_member(s) have no roles assigned`,
        );
      }

      // Step 7: Drop legacy columns from team_members
      console.log('Step 7: Dropping legacy columns...');
      await queryRunner.query(`
        ALTER TABLE "team_members"
        DROP COLUMN IF EXISTS "role",
        DROP COLUMN IF EXISTS "linkedPlayerId",
        DROP COLUMN IF EXISTS "isGuest"
      `);

      // Drop the constraint that referenced linkedPlayerId
      await queryRunner.query(`
        ALTER TABLE "team_members"
        DROP CONSTRAINT IF EXISTS "FK_team_members_linkedPlayer"
      `);
      console.log('Step 7: ✓ Legacy columns dropped');

      console.log('Migration completed successfully');
    } catch (error) {
      // Log detailed error for debugging
      console.error(
        'Migration failed after enum commit. See manual recovery steps in migration header.',
      );
      console.error('Error details:', error);

      // Re-throw to trigger transaction rollback of post-commit operations
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Re-add columns to team_members
    await queryRunner.query(`
      ALTER TABLE "team_members"
      ADD COLUMN "role" "public"."team_members_role_enum",
      ADD COLUMN "linkedPlayerId" uuid,
      ADD COLUMN "isGuest" boolean DEFAULT false
    `);

    // Step 2: Restore role data from team_member_roles
    // Convert GUEST_COACH back to COACH with isGuest=true
    await queryRunner.query(`
      UPDATE "team_members" tm
      SET
        "role" = CASE
          WHEN tmr."role" = 'GUEST_COACH' THEN 'COACH'::"public"."team_members_role_enum"
          ELSE tmr."role"
        END,
        "linkedPlayerId" = (tmr."roleData"->>'linkedPlayerId')::uuid,
        "isGuest" = (tmr."role" = 'GUEST_COACH')
      FROM "team_member_roles" tmr
      WHERE tmr."teamMemberId" = tm.id
        AND tmr.id = (
          SELECT tmr2.id
          FROM "team_member_roles" tmr2
          WHERE tmr2."teamMemberId" = tm.id
          ORDER BY
            CASE tmr2."role"
              WHEN 'OWNER' THEN 1
              WHEN 'MANAGER' THEN 2
              WHEN 'COACH' THEN 3
              WHEN 'GUEST_COACH' THEN 4
              WHEN 'PLAYER' THEN 5
              WHEN 'GUARDIAN' THEN 6
              WHEN 'FAN' THEN 7
              WHEN 'PARENT_FAN' THEN 6
            END
          LIMIT 1
        )
    `);

    // Step 3: Drop team_member_roles table
    await queryRunner.query(`DROP TABLE IF EXISTS "team_member_roles"`);

    // Step 4: Drop the new membership columns
    await queryRunner.query(`
      ALTER TABLE "team_members"
      DROP COLUMN IF EXISTS "joinedDate",
      DROP COLUMN IF EXISTS "leftDate",
      DROP COLUMN IF EXISTS "isActive"
    `);

    // Note: GUEST_COACH enum value cannot be removed easily in PostgreSQL
    // It will remain but be unused after rollback
  }
}
