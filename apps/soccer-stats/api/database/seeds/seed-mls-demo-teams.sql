-- =============================================================================
-- MLS Demo Teams Seed Script
-- =============================================================================
-- This script creates two MLS demo teams (Seattle Sounders FC and Inter Miami CF)
-- with full rosters of 14 players each.
--
-- Usage:
--   psql -U postgres -d soccer_stats -f seed-mls-demo-teams.sql
--
-- Or with Docker:
--   docker exec -i soccer-stats-db psql -U postgres -d soccer_stats < seed-mls-demo-teams.sql
--
-- Configuration:
--   Set the OWNER_EMAIL variable below to assign team ownership to a specific user.
--   If the user doesn't exist, teams will be created without an owner.
-- =============================================================================
-- Change this to your user's email to assign ownership, or leave as-is for no owner
BEGIN;
CREATE OR REPLACE FUNCTION upsert_mls_demo_player(
    p_team_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_jersey_number TEXT,
    p_primary_position TEXT
  ) RETURNS VOID LANGUAGE plpgsql AS $helper$
DECLARE v_player_id UUID;
v_team_member_id UUID;
BEGIN
INSERT INTO users (
    id,
    email,
    "firstName",
    "lastName",
    "isActive",
    "createdAt",
    "updatedAt"
  )
VALUES (
    gen_random_uuid(),
    p_email,
    p_first_name,
    p_last_name,
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (email) DO
UPDATE
SET "updatedAt" = NOW()
RETURNING id INTO v_player_id;
INSERT INTO team_members (
    id,
    "teamId",
    "userId",
    "joinedDate",
    "isActive",
    "acceptedAt",
    "createdAt",
    "updatedAt"
  )
VALUES (
    gen_random_uuid(),
    p_team_id,
    v_player_id,
    NOW(),
    true,
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT ("teamId", "userId") DO
UPDATE
SET "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW()
RETURNING id INTO v_team_member_id;
INSERT INTO team_member_roles (
    id,
    "teamMemberId",
    role,
    "roleData",
    "createdAt",
    "updatedAt"
  )
VALUES (
    gen_random_uuid(),
    v_team_member_id,
    'PLAYER',
    jsonb_strip_nulls(
      jsonb_build_object(
        'jerseyNumber',
        p_jersey_number,
        'primaryPosition',
        p_primary_position
      )
    ),
    NOW(),
    NOW()
  ) ON CONFLICT ("teamMemberId", role) DO
UPDATE
SET "roleData" = EXCLUDED."roleData",
  "updatedAt" = NOW();
END;
$helper$;
DO $$
DECLARE v_owner_email TEXT := 'joamos.dev@gmail.com';
v_sounders_id UUID;
v_miami_id UUID;
v_team_member_id UUID;
BEGIN -- ==========================================================================
-- FIND OWNER (optional - teams can exist without owner)
-- ==========================================================================
IF NOT EXISTS (
  SELECT 1
  FROM users
  WHERE email = v_owner_email
) THEN RAISE NOTICE 'Owner email % not found. Teams will be created without ownership.',
v_owner_email;
ELSE RAISE NOTICE 'Found owner: % (clerkId: %)',
v_owner_email,
(
  SELECT "clerkId"
  FROM users
  WHERE email = v_owner_email
);
END IF;
-- ==========================================================================
-- CREATE SEATTLE SOUNDERS FC
-- ==========================================================================
INSERT INTO teams (
    id,
    name,
    "shortName",
    description,
    "homePrimaryColor",
    "homeSecondaryColor",
    "awayPrimaryColor",
    "awaySecondaryColor",
    "logoUrl",
    "isManaged",
    "sourceType",
    "isActive",
    "createdById",
    "createdAt",
    "updatedAt"
  )
VALUES (
    gen_random_uuid(),
    'Seattle Sounders FC',
    'SEA',
    'Major League Soccer team based in Seattle, Washington. Founded in 2007, the Sounders have won multiple MLS Cups and are known for their passionate fanbase.',
    '#5D9741',
    -- Rave Green
    '#236192',
    -- Sounders Blue
    '#FFFFFF',
    -- White
    '#5D9741',
    -- Rave Green accent
    'https://upload.wikimedia.org/wikipedia/en/2/28/Seattle_Sounders_FC.svg',
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM users
        WHERE email = v_owner_email
      ) THEN true
      ELSE false
    END,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM users
        WHERE email = v_owner_email
      ) THEN 'internal'
      ELSE 'external'
    END,
    true,
    (
      SELECT "clerkId"
      FROM users
      WHERE email = v_owner_email
    ),
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING
RETURNING id INTO v_sounders_id;
-- If team already exists, get its ID
IF v_sounders_id IS NULL THEN
SELECT id INTO v_sounders_id
FROM teams
WHERE name = 'Seattle Sounders FC';
RAISE NOTICE 'Seattle Sounders FC already exists (id: %)',
v_sounders_id;
ELSE RAISE NOTICE 'Created Seattle Sounders FC (id: %)',
v_sounders_id;
-- Create owner TeamMember if owner exists
INSERT INTO team_members (
    id,
    "teamId",
    "userId",
    "joinedDate",
    "isActive",
    "acceptedAt",
    "createdAt",
    "updatedAt"
  )
SELECT gen_random_uuid(),
  v_sounders_id,
  id,
  NOW(),
  true,
  NOW(),
  NOW(),
  NOW()
FROM users
WHERE email = v_owner_email ON CONFLICT ("teamId", "userId") DO
UPDATE
SET "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW()
RETURNING id INTO v_team_member_id;
IF v_team_member_id IS NOT NULL THEN
INSERT INTO team_member_roles (
    id,
    "teamMemberId",
    role,
    "roleData",
    "createdAt",
    "updatedAt"
  )
VALUES (
    gen_random_uuid(),
    v_team_member_id,
    'OWNER',
    '{}'::jsonb,
    NOW(),
    NOW()
  ) ON CONFLICT ("teamMemberId", role) DO NOTHING;
v_team_member_id := NULL;
END IF;
END IF;
-- ==========================================================================
-- CREATE INTER MIAMI CF
-- ==========================================================================
INSERT INTO teams (
    id,
    name,
    "shortName",
    description,
    "homePrimaryColor",
    "homeSecondaryColor",
    "awayPrimaryColor",
    "awaySecondaryColor",
    "logoUrl",
    "isManaged",
    "sourceType",
    "isActive",
    "createdById",
    "createdAt",
    "updatedAt"
  )
VALUES (
    gen_random_uuid(),
    'Inter Miami CF',
    'MIA',
    'Major League Soccer team based in Fort Lauderdale, Florida. Co-owned by David Beckham, the club is home to global superstar Lionel Messi.',
    '#F7B5CD',
    -- Rosa (Pink)
    '#000000',
    -- Black
    '#000000',
    -- Black
    '#F7B5CD',
    -- Rosa accent
    'https://upload.wikimedia.org/wikipedia/en/8/8c/Inter_Miami_CF_logo.svg',
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM users
        WHERE email = v_owner_email
      ) THEN true
      ELSE false
    END,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM users
        WHERE email = v_owner_email
      ) THEN 'internal'
      ELSE 'external'
    END,
    true,
    (
      SELECT "clerkId"
      FROM users
      WHERE email = v_owner_email
    ),
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING
RETURNING id INTO v_miami_id;
-- If team already exists, get its ID
IF v_miami_id IS NULL THEN
SELECT id INTO v_miami_id
FROM teams
WHERE name = 'Inter Miami CF';
RAISE NOTICE 'Inter Miami CF already exists (id: %)',
v_miami_id;
ELSE RAISE NOTICE 'Created Inter Miami CF (id: %)',
v_miami_id;
-- Create owner TeamMember if owner exists
INSERT INTO team_members (
    id,
    "teamId",
    "userId",
    "joinedDate",
    "isActive",
    "acceptedAt",
    "createdAt",
    "updatedAt"
  )
SELECT gen_random_uuid(),
  v_miami_id,
  id,
  NOW(),
  true,
  NOW(),
  NOW(),
  NOW()
FROM users
WHERE email = v_owner_email ON CONFLICT ("teamId", "userId") DO
UPDATE
SET "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW()
RETURNING id INTO v_team_member_id;
IF v_team_member_id IS NOT NULL THEN
INSERT INTO team_member_roles (
    id,
    "teamMemberId",
    role,
    "roleData",
    "createdAt",
    "updatedAt"
  )
VALUES (
    gen_random_uuid(),
    v_team_member_id,
    'OWNER',
    '{}'::jsonb,
    NOW(),
    NOW()
  ) ON CONFLICT ("teamMemberId", role) DO NOTHING;
v_team_member_id := NULL;
END IF;
END IF;
-- ==========================================================================
-- SEATTLE SOUNDERS FC PLAYERS (14 players)
-- ==========================================================================
-- Helper: Create player and add to team
-- Goalkeepers
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'stefan.frei@demo.sounders.com',
  'Stefan',
  'Frei',
  '24',
  'Goalkeeper'
);
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'andrew.thomas@demo.sounders.com',
  'Andrew',
  'Thomas',
  '1',
  'Goalkeeper'
);
-- Defenders
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'yeimar.gomez@demo.sounders.com',
  'Yeimar',
  'Gómez',
  '4',
  'Defender'
);
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'nouhou.tolo@demo.sounders.com',
  'Nouhou',
  'Tolo',
  '5',
  'Defender'
);
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'alex.roldan@demo.sounders.com',
  'Alex',
  'Roldan',
  '16',
  'Defender'
);
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'jackson.ragen@demo.sounders.com',
  'Jackson',
  'Ragen',
  '25',
  'Defender'
);
-- Midfielders
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'joao.paulo@demo.sounders.com',
  'João',
  'Paulo',
  '6',
  'Midfielder'
);
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'cristian.roldan@demo.sounders.com',
  'Cristian',
  'Roldan',
  '7',
  'Midfielder'
);
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'albert.rusnak@demo.sounders.com',
  'Albert',
  'Rusnák',
  '11',
  'Midfielder'
);
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'obed.vargas@demo.sounders.com',
  'Obed',
  'Vargas',
  '37',
  'Midfielder'
);
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'josh.atencio@demo.sounders.com',
  'Josh',
  'Atencio',
  '77',
  'Midfielder'
);
-- Forwards
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'raul.ruidiaz@demo.sounders.com',
  'Raúl',
  'Ruidíaz',
  '9',
  'Forward'
);
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'jordan.morris@demo.sounders.com',
  'Jordan',
  'Morris',
  '13',
  'Forward'
);
PERFORM upsert_mls_demo_player(
  v_sounders_id,
  'leo.chu@demo.sounders.com',
  'Leo',
  'Chú',
  '17',
  'Forward'
);
-- ==========================================================================
-- INTER MIAMI CF PLAYERS (14 players)
-- ==========================================================================
-- Goalkeepers
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'drake.callender@demo.miami.com',
  'Drake',
  'Callender',
  '1',
  'Goalkeeper'
);
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'cj.dossantos@demo.miami.com',
  'CJ',
  'Dos Santos',
  '12',
  'Goalkeeper'
);
-- Defenders
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'deandre.yedlin@demo.miami.com',
  'DeAndre',
  'Yedlin',
  '2',
  'Defender'
);
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'tomas.aviles@demo.miami.com',
  'Tomás',
  'Avilés',
  '3',
  'Defender'
);
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'nicolas.freire@demo.miami.com',
  'Nicolás',
  'Freire',
  '4',
  'Defender'
);
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'jordi.alba@demo.miami.com',
  'Jordi',
  'Alba',
  '18',
  'Defender'
);
-- Midfielders
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'sergio.busquets@demo.miami.com',
  'Sergio',
  'Busquets',
  '5',
  'Midfielder'
);
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'david.ruiz@demo.miami.com',
  'David',
  'Ruiz',
  '6',
  'Midfielder'
);
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'diego.gomez@demo.miami.com',
  'Diego',
  'Gómez',
  '8',
  'Midfielder'
);
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'robert.taylor@demo.miami.com',
  'Robert',
  'Taylor',
  '16',
  'Midfielder'
);
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'benjamin.cremaschi@demo.miami.com',
  'Benjamin',
  'Cremaschi',
  '30',
  'Midfielder'
);
-- Forwards
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'luis.suarez@demo.miami.com',
  'Luis',
  'Suárez',
  '9',
  'Forward'
);
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'lionel.messi@demo.miami.com',
  'Lionel',
  'Messi',
  '10',
  'Forward'
);
PERFORM upsert_mls_demo_player(
  v_miami_id,
  'leonardo.campana@demo.miami.com',
  'Leonardo',
  'Campana',
  '11',
  'Forward'
);
RAISE NOTICE '✓ MLS Demo Teams seed complete!';
END $$;
COMMIT;
DROP FUNCTION IF EXISTS upsert_mls_demo_player(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
SELECT t.name AS team,
  COUNT(tmr.id) AS players,
  t."isManaged" AS managed,
  t."createdById" IS NOT NULL AS has_owner
FROM teams t
  LEFT JOIN team_members tm ON tm."teamId" = t.id
  LEFT JOIN team_member_roles tmr ON tmr."teamMemberId" = tm.id
  AND tmr.role = 'PLAYER'
WHERE t.name IN ('Seattle Sounders FC', 'Inter Miami CF')
GROUP BY t.id,
  t.name,
  t."isManaged",
  t."createdById"
ORDER BY t.name;