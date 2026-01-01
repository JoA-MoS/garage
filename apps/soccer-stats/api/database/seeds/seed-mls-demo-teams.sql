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

\set OWNER_EMAIL 'joamos.dev@gmail.com'

BEGIN;

DO $$
DECLARE
  v_owner_id UUID;
  v_owner_clerk_id TEXT;
  v_sounders_id UUID;
  v_miami_id UUID;
  v_player_id UUID;
BEGIN
  -- ==========================================================================
  -- FIND OWNER (optional - teams can exist without owner)
  -- ==========================================================================
  SELECT id, "clerkId" INTO v_owner_id, v_owner_clerk_id
  FROM users
  WHERE email = :'OWNER_EMAIL';

  IF v_owner_id IS NULL THEN
    RAISE NOTICE 'Owner email % not found. Teams will be created without ownership.', :'OWNER_EMAIL';
  ELSE
    RAISE NOTICE 'Found owner: % (clerkId: %)', :'OWNER_EMAIL', v_owner_clerk_id;
  END IF;

  -- ==========================================================================
  -- CREATE SEATTLE SOUNDERS FC
  -- ==========================================================================
  INSERT INTO teams (
    id, name, "shortName", description,
    "homePrimaryColor", "homeSecondaryColor", "awayPrimaryColor", "awaySecondaryColor",
    "logoUrl", "isManaged", "sourceType", "isActive", "createdById", "createdAt", "updatedAt"
  )
  VALUES (
    gen_random_uuid(),
    'Seattle Sounders FC',
    'SEA',
    'Major League Soccer team based in Seattle, Washington. Founded in 2007, the Sounders have won multiple MLS Cups and are known for their passionate fanbase.',
    '#5D9741',  -- Rave Green
    '#236192',  -- Sounders Blue
    '#FFFFFF',  -- White
    '#5D9741',  -- Rave Green accent
    'https://upload.wikimedia.org/wikipedia/en/2/28/Seattle_Sounders_FC.svg',
    CASE WHEN v_owner_id IS NOT NULL THEN true ELSE false END,
    CASE WHEN v_owner_id IS NOT NULL THEN 'internal' ELSE 'external' END,
    true,
    v_owner_clerk_id,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_sounders_id;

  -- If team already exists, get its ID
  IF v_sounders_id IS NULL THEN
    SELECT id INTO v_sounders_id FROM teams WHERE name = 'Seattle Sounders FC';
    RAISE NOTICE 'Seattle Sounders FC already exists (id: %)', v_sounders_id;
  ELSE
    RAISE NOTICE 'Created Seattle Sounders FC (id: %)', v_sounders_id;

    -- Create owner TeamMember if owner exists
    IF v_owner_id IS NOT NULL THEN
      INSERT INTO team_members (id, "teamId", "userId", role, "isGuest", "acceptedAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), v_sounders_id, v_owner_id, 'OWNER', false, NOW(), NOW(), NOW())
      ON CONFLICT ("teamId", "userId") DO NOTHING;
    END IF;
  END IF;

  -- ==========================================================================
  -- CREATE INTER MIAMI CF
  -- ==========================================================================
  INSERT INTO teams (
    id, name, "shortName", description,
    "homePrimaryColor", "homeSecondaryColor", "awayPrimaryColor", "awaySecondaryColor",
    "logoUrl", "isManaged", "sourceType", "isActive", "createdById", "createdAt", "updatedAt"
  )
  VALUES (
    gen_random_uuid(),
    'Inter Miami CF',
    'MIA',
    'Major League Soccer team based in Fort Lauderdale, Florida. Co-owned by David Beckham, the club is home to global superstar Lionel Messi.',
    '#F7B5CD',  -- Rosa (Pink)
    '#000000',  -- Black
    '#000000',  -- Black
    '#F7B5CD',  -- Rosa accent
    'https://upload.wikimedia.org/wikipedia/en/8/8c/Inter_Miami_CF_logo.svg',
    CASE WHEN v_owner_id IS NOT NULL THEN true ELSE false END,
    CASE WHEN v_owner_id IS NOT NULL THEN 'internal' ELSE 'external' END,
    true,
    v_owner_clerk_id,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_miami_id;

  -- If team already exists, get its ID
  IF v_miami_id IS NULL THEN
    SELECT id INTO v_miami_id FROM teams WHERE name = 'Inter Miami CF';
    RAISE NOTICE 'Inter Miami CF already exists (id: %)', v_miami_id;
  ELSE
    RAISE NOTICE 'Created Inter Miami CF (id: %)', v_miami_id;

    -- Create owner TeamMember if owner exists
    IF v_owner_id IS NOT NULL THEN
      INSERT INTO team_members (id, "teamId", "userId", role, "isGuest", "acceptedAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), v_miami_id, v_owner_id, 'OWNER', false, NOW(), NOW(), NOW())
      ON CONFLICT ("teamId", "userId") DO NOTHING;
    END IF;
  END IF;

  -- ==========================================================================
  -- SEATTLE SOUNDERS FC PLAYERS (14 players)
  -- ==========================================================================

  -- Helper: Create player and add to team
  -- Goalkeepers
  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'stefan.frei@demo.sounders.com', 'Stefan', 'Frei', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '24', 'Goalkeeper', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'andrew.thomas@demo.sounders.com', 'Andrew', 'Thomas', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '1', 'Goalkeeper', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Defenders
  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'yeimar.gomez@demo.sounders.com', 'Yeimar', 'Gómez', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '4', 'Defender', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'nouhou.tolo@demo.sounders.com', 'Nouhou', 'Tolo', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '5', 'Defender', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'alex.roldan@demo.sounders.com', 'Alex', 'Roldan', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '16', 'Defender', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'jackson.ragen@demo.sounders.com', 'Jackson', 'Ragen', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '25', 'Defender', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Midfielders
  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'joao.paulo@demo.sounders.com', 'João', 'Paulo', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '6', 'Midfielder', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'cristian.roldan@demo.sounders.com', 'Cristian', 'Roldan', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '7', 'Midfielder', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'albert.rusnak@demo.sounders.com', 'Albert', 'Rusnák', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '11', 'Midfielder', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'obed.vargas@demo.sounders.com', 'Obed', 'Vargas', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '37', 'Midfielder', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'josh.atencio@demo.sounders.com', 'Josh', 'Atencio', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '77', 'Midfielder', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Forwards
  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'raul.ruidiaz@demo.sounders.com', 'Raúl', 'Ruidíaz', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '9', 'Forward', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'jordan.morris@demo.sounders.com', 'Jordan', 'Morris', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '13', 'Forward', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'leo.chu@demo.sounders.com', 'Leo', 'Chú', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_sounders_id, v_player_id, '17', 'Forward', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ==========================================================================
  -- INTER MIAMI CF PLAYERS (14 players)
  -- ==========================================================================

  -- Goalkeepers
  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'drake.callender@demo.miami.com', 'Drake', 'Callender', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '1', 'Goalkeeper', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'cj.dossantos@demo.miami.com', 'CJ', 'Dos Santos', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '12', 'Goalkeeper', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Defenders
  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'deandre.yedlin@demo.miami.com', 'DeAndre', 'Yedlin', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '2', 'Defender', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'tomas.aviles@demo.miami.com', 'Tomás', 'Avilés', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '3', 'Defender', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'nicolas.freire@demo.miami.com', 'Nicolás', 'Freire', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '4', 'Defender', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'jordi.alba@demo.miami.com', 'Jordi', 'Alba', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '18', 'Defender', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Midfielders
  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'sergio.busquets@demo.miami.com', 'Sergio', 'Busquets', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '5', 'Midfielder', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'david.ruiz@demo.miami.com', 'David', 'Ruiz', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '6', 'Midfielder', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'diego.gomez@demo.miami.com', 'Diego', 'Gómez', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '8', 'Midfielder', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'robert.taylor@demo.miami.com', 'Robert', 'Taylor', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '16', 'Midfielder', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'benjamin.cremaschi@demo.miami.com', 'Benjamin', 'Cremaschi', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '30', 'Midfielder', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Forwards
  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'luis.suarez@demo.miami.com', 'Luis', 'Suárez', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '9', 'Forward', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'lionel.messi@demo.miami.com', 'Lionel', 'Messi', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '10', 'Forward', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO users (id, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'leonardo.campana@demo.miami.com', 'Leonardo', 'Campana', true, NOW(), NOW())
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
  RETURNING id INTO v_player_id;
  INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_miami_id, v_player_id, '11', 'Forward', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✓ MLS Demo Teams seed complete!';
END $$;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
SELECT
  t.name AS team,
  COUNT(tp.id) AS players,
  t."isManaged" AS managed,
  t."createdById" IS NOT NULL AS has_owner
FROM teams t
LEFT JOIN team_players tp ON tp."teamId" = t.id
WHERE t.name IN ('Seattle Sounders FC', 'Inter Miami CF')
GROUP BY t.id, t.name, t."isManaged", t."createdById"
ORDER BY t.name;
