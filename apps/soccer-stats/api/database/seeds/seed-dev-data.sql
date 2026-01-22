-- Seed Development Data for Soccer Stats
-- Run with: docker cp seed-dev-data.sql soccer-stats-db:/tmp/ && docker exec soccer-stats-db psql -U postgres -d soccer_stats -f /tmp/seed-dev-data.sql

-- User ID for joamos.dev@gmail.com (update if different)
-- Check with: SELECT id FROM users WHERE email = 'joamos.dev@gmail.com';

BEGIN;

-- ============================================
-- TEAMS
-- ============================================

-- Create managed team (your team)
-- Note: createdById must be the Clerk user ID for myTeams query to work
INSERT INTO teams (id, name, "sourceType", "createdById", "createdAt", "updatedAt")
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Thunder FC', 'internal',
   (SELECT "clerkId" FROM users WHERE email = 'joamos.dev@gmail.com'), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "createdById" = EXCLUDED."createdById";

-- Create opponent teams (external/unmanaged)
INSERT INTO teams (id, name, "sourceType", "createdAt", "updatedAt")
VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Lightning United', 'external', NOW(), NOW()),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Storm City', 'external', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ============================================
-- TEAM MEMBERSHIP (Link user to team)
-- ============================================

-- Add joamos.dev@gmail.com as manager of Thunder FC
INSERT INTO team_members (id, "teamId", "userId", role, "acceptedAt", "createdAt", "updatedAt")
SELECT 'd4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', id, 'MANAGER', NOW(), NOW(), NOW()
FROM users WHERE email = 'joamos.dev@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEAM CONFIGURATION
-- ============================================

INSERT INTO team_configurations (id, "teamId", "defaultFormation", "statsTrackingLevel", "createdAt", "updatedAt")
VALUES ('e5f6a7b8-c9d0-1234-efab-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2-3-1', 'FULL', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PLAYERS (Create users first, then link to team)
-- ============================================

-- Create player users
INSERT INTO users (id, email, "firstName", "lastName", "createdAt", "updatedAt")
VALUES
  ('11000001-0000-0000-0000-000000000001', 'player1@example.com', 'Alex', 'Johnson', NOW(), NOW()),
  ('11000001-0000-0000-0000-000000000002', 'player2@example.com', 'Sam', 'Williams', NOW(), NOW()),
  ('11000001-0000-0000-0000-000000000003', 'player3@example.com', 'Jordan', 'Brown', NOW(), NOW()),
  ('11000001-0000-0000-0000-000000000004', 'player4@example.com', 'Casey', 'Davis', NOW(), NOW()),
  ('11000001-0000-0000-0000-000000000005', 'player5@example.com', 'Riley', 'Miller', NOW(), NOW()),
  ('11000001-0000-0000-0000-000000000006', 'player6@example.com', 'Morgan', 'Wilson', NOW(), NOW()),
  ('11000001-0000-0000-0000-000000000007', 'player7@example.com', 'Taylor', 'Moore', NOW(), NOW()),
  ('11000001-0000-0000-0000-000000000008', 'player8@example.com', 'Jamie', 'Taylor', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName";

-- Link players to Thunder FC
INSERT INTO team_players (id, "teamId", "userId", "jerseyNumber", "primaryPosition", "createdAt", "updatedAt")
VALUES
  ('22000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11000001-0000-0000-0000-000000000001', '1', 'GK', NOW(), NOW()),
  ('22000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11000001-0000-0000-0000-000000000002', '7', 'LW', NOW(), NOW()),
  ('22000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11000001-0000-0000-0000-000000000003', '10', 'CM', NOW(), NOW()),
  ('22000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11000001-0000-0000-0000-000000000004', '4', 'CB', NOW(), NOW()),
  ('22000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11000001-0000-0000-0000-000000000005', '9', 'ST', NOW(), NOW()),
  ('22000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11000001-0000-0000-0000-000000000006', '11', 'RW', NOW(), NOW()),
  ('22000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11000001-0000-0000-0000-000000000007', '5', 'CDM', NOW(), NOW()),
  ('22000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11000001-0000-0000-0000-000000000008', '3', 'LB', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET "jerseyNumber" = EXCLUDED."jerseyNumber", "primaryPosition" = EXCLUDED."primaryPosition";

-- ============================================
-- GAME 1: Completed (Thunder FC 3-0 Lightning United, 7 days ago)
-- ============================================

INSERT INTO games (id, "gameFormatId", status, "scheduledStart", "statsTrackingLevel", "createdAt", "updatedAt")
VALUES ('33000001-0000-0000-0000-000000000001',
        (SELECT id FROM game_formats WHERE name = '5v5'),
        'COMPLETED', NOW() - INTERVAL '7 days', 'FULL', NOW() - INTERVAL '7 days', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_teams (id, "gameId", "teamId", "teamType", "createdAt", "updatedAt")
VALUES
  ('44000001-0000-0000-0000-000000000001', '33000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'home', NOW(), NOW()),
  ('44000001-0000-0000-0000-000000000002', '33000001-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'away', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Game 1 timing events
INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "recordedByUserId", "gameMinute", "gameSecond", metadata, "createdAt", "updatedAt")
VALUES
  ('55000001-0000-0000-0000-000000000001', '33000001-0000-0000-0000-000000000001', '44000001-0000-0000-0000-000000000001', (SELECT id FROM event_types WHERE name = 'GAME_START'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 0, 0, NULL, NOW() - INTERVAL '7 days', NOW()),
  ('55000001-0000-0000-0000-000000000002', '33000001-0000-0000-0000-000000000001', '44000001-0000-0000-0000-000000000001', (SELECT id FROM event_types WHERE name = 'PERIOD_START'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 0, 0, '{"period": "1"}', NOW() - INTERVAL '7 days', NOW()),
  ('55000001-0000-0000-0000-000000000003', '33000001-0000-0000-0000-000000000001', '44000001-0000-0000-0000-000000000001', (SELECT id FROM event_types WHERE name = 'PERIOD_END'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 25, 0, '{"period": "1"}', NOW() - INTERVAL '7 days' + INTERVAL '25 minutes', NOW()),
  ('55000001-0000-0000-0000-000000000004', '33000001-0000-0000-0000-000000000001', '44000001-0000-0000-0000-000000000001', (SELECT id FROM event_types WHERE name = 'PERIOD_START'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 25, 0, '{"period": "2"}', NOW() - INTERVAL '7 days' + INTERVAL '30 minutes', NOW()),
  ('55000001-0000-0000-0000-000000000005', '33000001-0000-0000-0000-000000000001', '44000001-0000-0000-0000-000000000001', (SELECT id FROM event_types WHERE name = 'PERIOD_END'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 50, 0, '{"period": "2"}', NOW() - INTERVAL '7 days' + INTERVAL '55 minutes', NOW()),
  ('55000001-0000-0000-0000-000000000006', '33000001-0000-0000-0000-000000000001', '44000001-0000-0000-0000-000000000001', (SELECT id FROM event_types WHERE name = 'GAME_END'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 50, 0, NULL, NOW() - INTERVAL '7 days' + INTERVAL '55 minutes', NOW())
ON CONFLICT (id) DO NOTHING;

-- Game 1 goals (Thunder FC scores 3)
INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "playerId", "recordedByUserId", "gameMinute", "gameSecond", "createdAt", "updatedAt")
VALUES
  ('55000001-0000-0000-0000-000000000010', '33000001-0000-0000-0000-000000000001', '44000001-0000-0000-0000-000000000001', (SELECT id FROM event_types WHERE name = 'GOAL'), '11000001-0000-0000-0000-000000000005', (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 12, 30, NOW() - INTERVAL '7 days' + INTERVAL '12 minutes', NOW()),
  ('55000001-0000-0000-0000-000000000011', '33000001-0000-0000-0000-000000000001', '44000001-0000-0000-0000-000000000001', (SELECT id FROM event_types WHERE name = 'GOAL'), '11000001-0000-0000-0000-000000000003', (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 28, 15, NOW() - INTERVAL '7 days' + INTERVAL '33 minutes', NOW()),
  ('55000001-0000-0000-0000-000000000012', '33000001-0000-0000-0000-000000000001', '44000001-0000-0000-0000-000000000001', (SELECT id FROM event_types WHERE name = 'GOAL'), '11000001-0000-0000-0000-000000000005', (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 42, 0, NOW() - INTERVAL '7 days' + INTERVAL '47 minutes', NOW())
ON CONFLICT (id) DO NOTHING;

-- Game 1 assists
INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "playerId", "recordedByUserId", "parentEventId", "gameMinute", "gameSecond", "createdAt", "updatedAt")
VALUES
  ('55000001-0000-0000-0000-000000000020', '33000001-0000-0000-0000-000000000001', '44000001-0000-0000-0000-000000000001', (SELECT id FROM event_types WHERE name = 'ASSIST'), '11000001-0000-0000-0000-000000000002', (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), '55000001-0000-0000-0000-000000000010', 12, 30, NOW() - INTERVAL '7 days' + INTERVAL '12 minutes', NOW()),
  ('55000001-0000-0000-0000-000000000021', '33000001-0000-0000-0000-000000000001', '44000001-0000-0000-0000-000000000001', (SELECT id FROM event_types WHERE name = 'ASSIST'), '11000001-0000-0000-0000-000000000006', (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), '55000001-0000-0000-0000-000000000012', 42, 0, NOW() - INTERVAL '7 days' + INTERVAL '47 minutes', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- GAME 2: In Progress at Halftime (Thunder FC 1-0 Storm City)
-- ============================================

INSERT INTO games (id, "gameFormatId", status, "scheduledStart", "statsTrackingLevel", "createdAt", "updatedAt")
VALUES ('33000001-0000-0000-0000-000000000002',
        (SELECT id FROM game_formats WHERE name = '5v5'),
        'HALFTIME', NOW() - INTERVAL '30 minutes', 'FULL', NOW() - INTERVAL '1 hour', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_teams (id, "gameId", "teamId", "teamType", "createdAt", "updatedAt")
VALUES
  ('44000001-0000-0000-0000-000000000003', '33000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'home', NOW(), NOW()),
  ('44000001-0000-0000-0000-000000000004', '33000001-0000-0000-0000-000000000002', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'away', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Game 2 timing events (first half completed)
INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "recordedByUserId", "gameMinute", "gameSecond", metadata, "createdAt", "updatedAt")
VALUES
  ('55000002-0000-0000-0000-000000000001', '33000001-0000-0000-0000-000000000002', '44000001-0000-0000-0000-000000000003', (SELECT id FROM event_types WHERE name = 'GAME_START'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 0, 0, NULL, NOW() - INTERVAL '30 minutes', NOW()),
  ('55000002-0000-0000-0000-000000000002', '33000001-0000-0000-0000-000000000002', '44000001-0000-0000-0000-000000000003', (SELECT id FROM event_types WHERE name = 'PERIOD_START'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 0, 0, '{"period": "1"}', NOW() - INTERVAL '30 minutes', NOW()),
  ('55000002-0000-0000-0000-000000000003', '33000001-0000-0000-0000-000000000002', '44000001-0000-0000-0000-000000000003', (SELECT id FROM event_types WHERE name = 'PERIOD_END'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 25, 0, '{"period": "1"}', NOW() - INTERVAL '5 minutes', NOW())
ON CONFLICT (id) DO NOTHING;

-- Game 2 first half goal
INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "playerId", "recordedByUserId", "gameMinute", "gameSecond", "createdAt", "updatedAt")
VALUES
  ('55000002-0000-0000-0000-000000000010', '33000001-0000-0000-0000-000000000002', '44000001-0000-0000-0000-000000000003', (SELECT id FROM event_types WHERE name = 'GOAL'), '11000001-0000-0000-0000-000000000003', (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 18, 45, NOW() - INTERVAL '11 minutes', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- GAME 3: Scheduled (Thunder FC vs Lightning United in 3 days)
-- ============================================

INSERT INTO games (id, "gameFormatId", status, "scheduledStart", "statsTrackingLevel", "createdAt", "updatedAt")
VALUES ('33000001-0000-0000-0000-000000000003',
        (SELECT id FROM game_formats WHERE name = '7v7'),
        'SCHEDULED', NOW() + INTERVAL '3 days', 'FULL', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_teams (id, "gameId", "teamId", "teamType", "createdAt", "updatedAt")
VALUES
  ('44000001-0000-0000-0000-000000000005', '33000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'home', NOW(), NOW()),
  ('44000001-0000-0000-0000-000000000006', '33000001-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'away', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- GAME 4: Completed (Storm City 1-1 Thunder FC, 14 days ago - draw)
-- ============================================

INSERT INTO games (id, "gameFormatId", status, "scheduledStart", "statsTrackingLevel", "createdAt", "updatedAt")
VALUES ('33000001-0000-0000-0000-000000000004',
        (SELECT id FROM game_formats WHERE name = '5v5'),
        'COMPLETED', NOW() - INTERVAL '14 days', 'FULL', NOW() - INTERVAL '14 days', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_teams (id, "gameId", "teamId", "teamType", "createdAt", "updatedAt")
VALUES
  ('44000001-0000-0000-0000-000000000007', '33000001-0000-0000-0000-000000000004', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'home', NOW(), NOW()),
  ('44000001-0000-0000-0000-000000000008', '33000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'away', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Game 4 timing events
INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "recordedByUserId", "gameMinute", "gameSecond", metadata, "createdAt", "updatedAt")
VALUES
  ('55000004-0000-0000-0000-000000000001', '33000001-0000-0000-0000-000000000004', '44000001-0000-0000-0000-000000000008', (SELECT id FROM event_types WHERE name = 'GAME_START'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 0, 0, NULL, NOW() - INTERVAL '14 days', NOW()),
  ('55000004-0000-0000-0000-000000000002', '33000001-0000-0000-0000-000000000004', '44000001-0000-0000-0000-000000000008', (SELECT id FROM event_types WHERE name = 'PERIOD_START'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 0, 0, '{"period": "1"}', NOW() - INTERVAL '14 days', NOW()),
  ('55000004-0000-0000-0000-000000000003', '33000001-0000-0000-0000-000000000004', '44000001-0000-0000-0000-000000000008', (SELECT id FROM event_types WHERE name = 'PERIOD_END'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 25, 0, '{"period": "1"}', NOW() - INTERVAL '14 days' + INTERVAL '25 minutes', NOW()),
  ('55000004-0000-0000-0000-000000000004', '33000001-0000-0000-0000-000000000004', '44000001-0000-0000-0000-000000000008', (SELECT id FROM event_types WHERE name = 'PERIOD_START'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 25, 0, '{"period": "2"}', NOW() - INTERVAL '14 days' + INTERVAL '30 minutes', NOW()),
  ('55000004-0000-0000-0000-000000000005', '33000001-0000-0000-0000-000000000004', '44000001-0000-0000-0000-000000000008', (SELECT id FROM event_types WHERE name = 'PERIOD_END'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 50, 0, '{"period": "2"}', NOW() - INTERVAL '14 days' + INTERVAL '55 minutes', NOW()),
  ('55000004-0000-0000-0000-000000000006', '33000001-0000-0000-0000-000000000004', '44000001-0000-0000-0000-000000000008', (SELECT id FROM event_types WHERE name = 'GAME_END'), (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 50, 0, NULL, NOW() - INTERVAL '14 days' + INTERVAL '55 minutes', NOW())
ON CONFLICT (id) DO NOTHING;

-- Game 4 goal (Thunder FC scores 1)
INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "playerId", "recordedByUserId", "gameMinute", "gameSecond", "createdAt", "updatedAt")
VALUES
  ('55000004-0000-0000-0000-000000000010', '33000001-0000-0000-0000-000000000004', '44000001-0000-0000-0000-000000000008', (SELECT id FROM event_types WHERE name = 'GOAL'), '11000001-0000-0000-0000-000000000002', (SELECT id FROM users WHERE email = 'joamos.dev@gmail.com'), 35, 0, NOW() - INTERVAL '14 days' + INTERVAL '40 minutes', NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Seed completed!' as status;
SELECT 'Teams: ' || COUNT(*) FROM teams WHERE id IN ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'c3d4e5f6-a7b8-9012-cdef-123456789012');
SELECT 'Players: ' || COUNT(*) FROM team_players WHERE "teamId" = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
SELECT 'Games: ' || COUNT(*) FROM games WHERE id::text LIKE '33000001%';
SELECT 'Events: ' || COUNT(*) FROM game_events WHERE "gameId"::text LIKE '33000001%';
