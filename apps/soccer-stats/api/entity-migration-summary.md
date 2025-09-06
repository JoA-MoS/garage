# Entity Migration Summary

This document outlines the changes made to migrate from the original entity structure to the new event-based, many-to-many relationship design.

## 🎯 Migration Overview

### Key Changes:

1. **Many-to-Many Relationships**: Teams ↔ Games and Teams ↔ Players
2. **Event-Based System**: Unified `GameEvent` entity replaces `Goal` and `Substitution`
3. **Junction Tables**: Added `GameTeam` and `TeamPlayer` entities
4. **Event Types**: Added `EventType` reference table for extensible event management

## 📊 New Entity Structure

### Core Entities

- ✅ **Game** - Updated (removed team names, added gameTeams/gameEvents relationships)
- ✅ **Team** - Updated (removed game relationship, added many-to-many relationships)
- ✅ **Player** - Updated (removed team relationship, added many-to-many relationships)

### Junction Tables

- ✅ **GameTeam** - NEW (links Games ↔ Teams, stores home/away, formation)
- ✅ **TeamPlayer** - NEW (links Teams ↔ Players, stores jersey, depth rank)

### Event System

- ✅ **EventType** - NEW (reference table for event definitions)
- ✅ **GameEvent** - NEW (unified event system replaces Goal/Substitution)

### Updated Entities

- ✅ **GameParticipation** - Updated (added gameTeamId relationship)

## 🔄 Entity Changes Detail

### Game Entity Changes

**Removed:**

- `homeTeamName: string`
- `awayTeamName: string`
- `teams: Team[]` (OneToMany)
- `goals: Goal[]` (OneToMany)
- `substitutions: Substitution[]` (OneToMany)

**Added:**

- `gameTeams: GameTeam[]` (OneToMany)
- `gameEvents: GameEvent[]` (OneToMany)

### Team Entity Changes

**Removed:**

- `formation?: string` (moved to GameTeam)
- `isHome: boolean` (moved to GameTeam)
- `game: Game` (ManyToOne)
- `gameId: string`
- `players: Player[]` (OneToMany)

**Added:**

- `logo?: string`
- `colors?: string`
- `gameTeams: GameTeam[]` (OneToMany)
- `teamPlayers: TeamPlayer[]` (OneToMany)

### Player Entity Changes

**Removed:**

- `jersey: number` (moved to TeamPlayer)
- `depthRank: number` (moved to TeamPlayer)
- `isOnField: boolean` (moved to GameParticipation)
- `isActive: boolean` (moved to TeamPlayer)
- `team: Team` (ManyToOne)
- `teamId: string`
- `goalsScored: Goal[]` (OneToMany)
- `assists: Goal[]` (OneToMany)

**Added:**

- `teamPlayers: TeamPlayer[]` (OneToMany)

### GameParticipation Entity Changes

**Added:**

- `isOnField: boolean` (moved from Player)
- `gameTeam: GameTeam` (ManyToOne)
- `gameTeamId: string`

## 🆕 New Entities Detail

### GameTeam (Junction Table)

```typescript
{
  id: string (UUID)
  isHome: boolean          // From Team entity
  formation?: string       // From Team entity
  gameId: string
  teamId: string
  game: Game              // ManyToOne
  team: Team              // ManyToOne
  gameEvents: GameEvent[] // OneToMany
  gameParticipations: GameParticipation[] // OneToMany
}
```

### TeamPlayer (Junction Table)

```typescript
{
  id: string (UUID)
  jersey: number          // From Player entity
  depthRank: number       // From Player entity
  isActive: boolean       // From Player entity
  joinedAt: Date
  leftAt?: Date
  teamId: string
  playerId: string
  team: Team              // ManyToOne
  player: Player          // ManyToOne
}
```

### EventType (Reference Table)

```typescript
{
  id: string (UUID)
  code: string (unique)   // 'GOAL', 'YELLOW_CARD', etc.
  name: string           // 'Goal', 'Yellow Card', etc.
  description?: string
  category: EventCategory // SCORING, DISCIPLINE, etc.
  requiresRelatedPlayer: boolean
  isTeamEvent: boolean
  isPositive: boolean
  metadataSchema?: object // JSON schema for validation
  isActive: boolean
  gameEvents: GameEvent[] // OneToMany
}
```

### GameEvent (Unified Event System)

```typescript
{
  id: string (UUID)
  minute: number
  timestamp: number       // Game time in seconds
  realTime: Date         // Actual timestamp
  notes?: string
  metadata?: object      // Event-specific data
  eventTypeId: string
  gameId: string
  gameTeamId: string
  playerId: string
  relatedPlayerId?: string // For assists, substitutions, fouls
  eventType: EventType    // ManyToOne
  game: Game             // ManyToOne
  gameTeam: GameTeam     // ManyToOne
  player: Player         // ManyToOne
  relatedPlayer?: Player // ManyToOne
}
```

## 🚀 Benefits of New Design

### 1. **Real-World Flexibility**

- Teams can play multiple games across seasons
- Players can transfer between teams
- Complete history of player-team relationships

### 2. **Event System Advantages**

- Single table for all game events
- Easy to add new event types (VAR, injuries, etc.)
- Unified timeline and analytics
- Consistent event structure

### 3. **Better Data Integrity**

- Foreign key constraints ensure valid relationships
- Event types prevent invalid event data
- Junction tables eliminate data redundancy

### 4. **Improved Performance**

- Single event table for timeline queries
- Reduced JOIN complexity for event data
- Better indexing strategies

### 5. **Enhanced Analytics**

- Cross-team player performance tracking
- Historical team composition analysis
- Event pattern recognition
- Real-time game feeds

## 📋 Migration Checklist

### Database Migration Required:

- [ ] Create new tables: `event_types`, `game_teams`, `team_players`, `game_events`
- [ ] Migrate existing data from `goals` and `substitutions` to `game_events`
- [ ] Update `game_participations` to include `game_team_id`
- [ ] Remove columns from `games`: `home_team_name`, `away_team_name`
- [ ] Remove columns from `teams`: `formation`, `is_home`, `game_id`
- [ ] Remove columns from `players`: `jersey`, `depth_rank`, `is_on_field`, `is_active`, `team_id`
- [ ] Populate `event_types` with seed data
- [ ] Create appropriate indexes

### Application Updates Required:

- [ ] Update GraphQL resolvers for new relationships
- [ ] Update services to use event-based queries
- [ ] Update mutations to create GameEvent records
- [ ] Update UI components for new data structure
- [ ] Add event type management interfaces

### Testing Required:

- [ ] Unit tests for new entities
- [ ] Integration tests for new relationships
- [ ] Migration script testing
- [ ] GraphQL schema validation
- [ ] Performance testing for event queries

## 🔗 Related Files

- `event-types-seed-data.sql` - Contains initial event type data
- `ER-Diagram-Events.md` - Updated entity relationship diagram
- Entity files in `/src/entities/` - All updated TypeORM entities
