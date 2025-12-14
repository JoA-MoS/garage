-- EVENT_TYPE Reference Data
-- This file contains the SQL to populate the EVENT_TYPE table with all supported soccer event types
INSERT INTO event_types (
        id,
        code,
        name,
        description,
        category,
        requires_related_player,
        is_team_event,
        is_positive,
        metadata_schema,
        is_active,
        created_at,
        updated_at
    )
VALUES -- SCORING EVENTS
    (
        '550e8400-e29b-41d4-a716-446655440001',
        'GOAL',
        'Goal',
        'A goal scored by a player',
        'SCORING',
        false,
        true,
        true,
        '{"type": "object", "properties": {"goalType": {"enum": ["shot", "header", "penalty", "own_goal", "free_kick"]}, "bodyPart": {"enum": ["left_foot", "right_foot", "head", "chest", "other"]}, "distance": {"type": "number"}, "angle": {"type": "string"}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002',
        'ASSIST',
        'Assist',
        'An assist provided to a goal scorer',
        'SCORING',
        true,
        true,
        true,
        '{"type": "object", "properties": {"assistType": {"enum": ["pass", "cross", "through_ball", "set_piece", "rebound"]}, "distance": {"type": "number"}}}',
        true,
        NOW(),
        NOW()
    ),
    -- SUBSTITUTION EVENTS
    (
        '550e8400-e29b-41d4-a716-446655440003',
        'SUBSTITUTION_OUT',
        'Substitution Out',
        'Player leaving the field',
        'SUBSTITUTION',
        true,
        true,
        false,
        '{"type": "object", "properties": {"reason": {"enum": ["tactical", "injury", "fatigue", "disciplinary", "other"]}, "notes": {"type": "string"}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440004',
        'SUBSTITUTION_IN',
        'Substitution In',
        'Player entering the field',
        'SUBSTITUTION',
        true,
        true,
        true,
        '{"type": "object", "properties": {"reason": {"enum": ["tactical", "injury", "fatigue", "disciplinary", "other"]}, "notes": {"type": "string"}}}',
        true,
        NOW(),
        NOW()
    ),
    -- DISCIPLINE EVENTS
    (
        '550e8400-e29b-41d4-a716-446655440005',
        'YELLOW_CARD',
        'Yellow Card',
        'Yellow card shown to a player',
        'DISCIPLINE',
        false,
        false,
        false,
        '{"type": "object", "properties": {"reason": {"enum": ["foul", "dissent", "unsporting_behavior", "delaying_game", "simulation", "other"]}, "severity": {"enum": ["minor", "moderate", "severe"]}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440006',
        'RED_CARD',
        'Red Card',
        'Red card shown to a player',
        'DISCIPLINE',
        false,
        false,
        false,
        '{"type": "object", "properties": {"reason": {"enum": ["serious_foul", "violent_conduct", "spitting", "offensive_language", "second_yellow", "other"]}, "directRed": {"type": "boolean"}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440007',
        'FOUL',
        'Foul',
        'Foul committed by a player',
        'DISCIPLINE',
        true,
        false,
        false,
        '{"type": "object", "properties": {"foulType": {"enum": ["minor", "major", "professional", "dangerous"]}, "location": {"enum": ["penalty_area", "goal_area", "midfield", "defensive_third", "attacking_third"]}, "cardGiven": {"type": "boolean"}}}',
        true,
        NOW(),
        NOW()
    ),
    -- DEFENSIVE EVENTS
    (
        '550e8400-e29b-41d4-a716-446655440008',
        'SAVE',
        'Save',
        'Goalkeeper save',
        'DEFENSIVE',
        true,
        true,
        true,
        '{"type": "object", "properties": {"saveType": {"enum": ["catch", "parry", "tip_over", "block", "diving_save"]}, "shotType": {"enum": ["header", "shot", "free_kick", "penalty"]}, "difficulty": {"enum": ["easy", "medium", "hard", "spectacular"]}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440009',
        'TACKLE',
        'Tackle',
        'Successful tackle by a player',
        'DEFENSIVE',
        true,
        true,
        true,
        '{"type": "object", "properties": {"tackleType": {"enum": ["standing", "sliding", "aerial"]}, "success": {"type": "boolean"}, "location": {"type": "string"}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440010',
        'INTERCEPTION',
        'Interception',
        'Ball interception',
        'DEFENSIVE',
        false,
        true,
        true,
        '{"type": "object", "properties": {"location": {"type": "string"}, "passIntercepted": {"type": "boolean"}}}',
        true,
        NOW(),
        NOW()
    ),
    -- SET PIECE EVENTS
    (
        '550e8400-e29b-41d4-a716-446655440011',
        'CORNER',
        'Corner Kick',
        'Corner kick awarded',
        'SET_PIECE',
        false,
        true,
        true,
        '{"type": "object", "properties": {"side": {"enum": ["left", "right"]}, "outcome": {"enum": ["goal", "shot", "cleared", "wasted"]}, "delivery": {"enum": ["short", "long", "driven", "floated"]}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440012',
        'FREE_KICK',
        'Free Kick',
        'Free kick awarded',
        'SET_PIECE',
        false,
        true,
        true,
        '{"type": "object", "properties": {"location": {"type": "string"}, "distance": {"type": "number"}, "outcome": {"enum": ["goal", "shot", "pass", "cleared"]}, "direct": {"type": "boolean"}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440013',
        'PENALTY',
        'Penalty',
        'Penalty awarded',
        'SET_PIECE',
        false,
        true,
        true,
        '{"type": "object", "properties": {"outcome": {"enum": ["goal", "saved", "missed", "hit_post"]}, "placement": {"enum": ["left", "right", "center", "top", "bottom"]}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440014',
        'THROW_IN',
        'Throw In',
        'Throw in awarded',
        'SET_PIECE',
        false,
        true,
        true,
        '{"type": "object", "properties": {"location": {"type": "string"}, "outcome": {"enum": ["retained", "lost", "throw_to_opponent"]}}}',
        true,
        NOW(),
        NOW()
    ),
    -- GAME FLOW EVENTS
    (
        '550e8400-e29b-41d4-a716-446655440015',
        'OFFSIDE',
        'Offside',
        'Offside offense',
        'DISCIPLINE',
        false,
        false,
        false,
        '{"type": "object", "properties": {"severity": {"enum": ["clear", "marginal", "disputed"]}, "location": {"type": "string"}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440016',
        'SHOT_ON_TARGET',
        'Shot on Target',
        'Shot that would result in goal if not saved',
        'OFFENSIVE',
        false,
        true,
        true,
        '{"type": "object", "properties": {"shotType": {"enum": ["header", "left_foot", "right_foot", "volley", "half_volley"]}, "distance": {"type": "number"}, "placement": {"enum": ["top_left", "top_right", "bottom_left", "bottom_right", "center"]}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440017',
        'SHOT_OFF_TARGET',
        'Shot off Target',
        'Shot that misses the goal',
        'OFFENSIVE',
        false,
        true,
        false,
        '{"type": "object", "properties": {"shotType": {"enum": ["header", "left_foot", "right_foot", "volley", "half_volley"]}, "distance": {"type": "number"}, "direction": {"enum": ["wide_left", "wide_right", "over", "under"]}}}',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440018',
        'SHOT_BLOCKED',
        'Shot Blocked',
        'Shot blocked by defender',
        'OFFENSIVE',
        true,
        false,
        false,
        '{"type": "object", "properties": {"shotType": {"enum": ["header", "left_foot", "right_foot", "volley"]}, "blockType": {"enum": ["foot", "body", "head", "arm"]}, "deflection": {"type": "boolean"}}}',
        true,
        NOW(),
        NOW()
    );
-- Add indexes for performance
CREATE INDEX idx_event_types_code ON event_types(code);
CREATE INDEX idx_event_types_category ON event_types(category);
CREATE INDEX idx_event_types_active ON event_types(is_active);
-- View for easy event type lookup
CREATE VIEW v_active_event_types AS
SELECT id,
    code,
    name,
    description,
    category,
    requires_related_player,
    is_team_event,
    is_positive,
    metadata_schema
FROM event_types
WHERE is_active = true
ORDER BY category,
    name;