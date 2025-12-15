# Soccer Stats Tracker - Feature Roadmap

This document outlines planned features, improvements, and cleanup tasks for the Soccer Stats Tracker application.

---

## Table of Contents

1. [Priority 1: Security & Access Control](#priority-1-security--access-control)
2. [Priority 2: Core Feature Enhancements](#priority-2-core-feature-enhancements)
3. [Priority 3: New Features](#priority-3-new-features)
4. [Priority 4: Code Cleanup](#priority-4-code-cleanup)
5. [Future Considerations](#future-considerations)

---

## Priority 1: Security & Access Control

### 1.1 Role-Based Access Control (RBAC)

**Status**: Not Implemented
**Priority**: CRITICAL

Implement comprehensive role-based access control so users can only see and interact with teams they're authorized to access.

#### User Roles

| Role           | Description                  | Permissions                                                                             |
| -------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| **Owner**      | Team owner/creator           | Full control: edit team, manage roster, manage coaches, delete team, transfer ownership |
| **Manager**    | Team manager                 | Manage roster, manage games, view all stats, record events                              |
| **Coach**      | Team coach                   | Record game events, view stats, manage lineups during games                             |
| **Player**     | Team player                  | View own stats, view team schedule, limited lineup visibility                           |
| **Parent/Fan** | Player guardian or supporter | View-only: games, public stats, schedule                                                |

#### Implementation Tasks

- [ ] Add `role` field to User entity (ADMIN, USER)
- [ ] Create `TeamMember` entity to track user-team relationships with roles
- [ ] Add `ownerId` field to Team entity
- [ ] Create `@RequireRole()` decorator for resolver methods
- [ ] Create `@RequireTeamAccess()` guard for team-specific operations
- [ ] Implement team membership validation in all team/game mutations
- [ ] Add ownership transfer functionality

#### Affected Endpoints (Currently Public - Need Auth)

```
game-events.resolver.ts:
- removeFromLineup          // TODO: Add proper auth
- updatePlayerPosition      // TODO: Add proper auth
- deleteGoal                // TODO: Add proper auth
- deleteSubstitution        // TODO: Add proper auth
- deletePositionSwap        // TODO: Add proper auth
- deleteStarterEntry        // TODO: Add proper auth
- updateGoal                // TODO: Add proper auth
- deleteEventWithCascade    // TODO: Add proper auth
- resolveEventConflict      // TODO: Add proper auth
```

---

## Priority 2: Core Feature Enhancements

### 2.1 Team Stats Filtering

**Status**: Not Implemented
**Priority**: HIGH

Add functionality to filter game events and statistics by time range or season.

#### Features

- [ ] Create `Season` entity with start/end dates
- [ ] Add season assignment to games
- [ ] Implement date range filters for:
  - Player statistics queries
  - Game listings
  - Event history
- [ ] Add season dropdown selector to stats pages
- [ ] Add custom date range picker component
- [ ] Implement aggregated season statistics

#### API Changes

```graphql
input StatsFilterInput {
  seasonId: ID
  startDate: DateTime
  endDate: DateTime
  gameIds: [ID!]
}

type Query {
  playerStats(input: PlayerStatsInput!, filter: StatsFilterInput): PlayerFullStats
  teamStats(teamId: ID!, filter: StatsFilterInput): TeamStats
  gamesByDateRange(teamId: ID!, startDate: DateTime!, endDate: DateTime!): [Game!]!
}
```

### 2.2 Complete User Management UI

**Status**: Incomplete
**Priority**: MEDIUM

The users page has placeholder handlers that need implementation.

#### Tasks

- [ ] Implement `handleEditUser` - Navigate to user edit modal/page
- [ ] Implement `handleViewUser` - Navigate to user detail page
- [ ] Implement `handleToggleUserActive` - User activation/deactivation mutation
- [ ] Add confirmation dialogs for destructive actions
- [ ] Add bulk user operations (invite multiple, deactivate multiple)

### 2.3 Merge Duplicate Users

**Status**: Not Implemented
**Priority**: HIGH

Users may be created multiple times (e.g., via different sign-up flows, manual entry vs Clerk auth). Need ability to merge duplicates.

#### Tasks

- [ ] Create UI to search and identify potential duplicate users
- [ ] Implement duplicate detection algorithm (by name, email, phone)
- [ ] Create merge wizard showing both user records side-by-side
- [ ] Allow selection of which fields to keep from each record
- [ ] Implement `mergeUsers` mutation that:
  - Transfers all team memberships to target user
  - Transfers all game events to target user
  - Updates all foreign key references
  - Soft-deletes the source user
- [ ] Add audit log entry for merge operations
- [ ] Add undo/rollback capability within time window

### 2.4 Fix Team Color Functionality

**Status**: Broken
**Priority**: HIGH

Team colors are not being saved or displayed correctly.

#### Tasks

- [ ] Debug why team colors are not persisting on save
- [ ] Verify color picker component is sending correct values
- [ ] Check backend UpdateTeamInput accepts color fields
- [ ] Ensure colors display on team cards and team detail pages
- [ ] Add color preview in team management form
- [ ] Consider adding preset color palettes for common team colors

### 2.5 Team Member Management

**Status**: Not Implemented
**Priority**: HIGH

Enable team owners to invite and manage various team member roles.

#### Supported Roles

| Role            | Description                 | Invite Method                     |
| --------------- | --------------------------- | --------------------------------- |
| **Coach**       | Assistant coaches           | Email invite or add existing user |
| **Manager**     | Team administrators         | Email invite or add existing user |
| **Admin**       | Full access helpers         | Email invite or add existing user |
| **Scorekeeper** | Can record game events only | Email invite or add existing user |
| **Fan/Parent**  | View-only access            | Share link or email invite        |
| **Player**      | Team roster member          | Add existing user or create new   |

#### Tasks

- [ ] Create "Team Members" tab in team settings
- [ ] Add "Invite Member" button with role selection
- [ ] Implement email invitation system with magic links
- [ ] Add "Add Existing User" search to find users already in system
- [ ] Create pending invitations list with resend/cancel options
- [ ] Add role management UI (change role, remove from team)
- [ ] Implement role-specific permission checks throughout app
- [ ] Add team member list view with role badges
- [ ] Create "Leave Team" functionality for members

### 2.6 Complete Team Overview Page

**Status**: Incomplete
**Priority**: MEDIUM

Team overview statistics are incomplete with stub implementations.

#### Tasks

- [ ] Implement `mapServiceTeamToUITeam` conversion function
- [ ] Calculate actual player count from roster
- [ ] Add team statistics summary (games played, wins, losses, goals)
- [ ] Add recent games widget
- [ ] Add upcoming games widget

---

## Priority 3: New Features

### 3.1 Disciplinary Event Tracking

**Status**: Not Implemented
**Priority**: MEDIUM

Track yellow cards, red cards, and other disciplinary events.

#### Implementation

- [ ] Create EventTypes: `YELLOW_CARD`, `RED_CARD`, `FOUL`, `WARNING`
- [ ] Add UI for recording disciplinary events during games
- [ ] Update `getPlayerStats()` to aggregate disciplinary events
- [ ] Add discipline summary to player profile
- [ ] Create discipline report view for team managers
- [ ] Add suspension tracking (auto-suspend after X cards)

### 3.2 Goalkeeper Statistics

**Status**: Partially Implemented (fields exist but unused)
**Priority**: MEDIUM

The `PlayerFullStats` type has `saves` field but it's never populated.

#### Implementation

- [ ] Create EventType: `SAVE`, `SHOT_FACED`, `CLEAN_SHEET`
- [ ] Add save recording UI during games
- [ ] Update statistics calculation to include goalkeeper stats
- [ ] Add goalkeeper-specific stats view

### 3.3 Game Review System

**Status**: Not Implemented
**Priority**: MEDIUM

Add data quality assurance through game review workflow.

#### Features

- [ ] Add `reviewStatus` field to Game (PENDING, IN_REVIEW, APPROVED, REJECTED)
- [ ] Add `reviewedBy` and `reviewedAt` fields
- [ ] Auto-flag games with conflicts for review
- [ ] Create review workflow UI for coaches/managers
- [ ] Add event correction suggestions
- [ ] Implement review history/audit trail

### 3.4 Advanced Team Statistics

**Status**: Not Implemented
**Priority**: LOW

Expand beyond individual player stats to team-level analytics.

#### Features

- [ ] Goals scored/conceded per game
- [ ] Win/loss/draw record
- [ ] Home vs away performance
- [ ] Goals by game period (1st half vs 2nd half)
- [ ] Substitution patterns analysis
- [ ] Player combination effectiveness

### 3.5 Notifications System

**Status**: Not Implemented
**Priority**: LOW

Real-time and push notifications for important events.

#### Features

- [ ] Game reminders (upcoming games)
- [ ] Live game updates for fans/parents not at the game
- [ ] Roster changes notifications
- [ ] Season/schedule updates
- [ ] Achievement notifications (first goal, milestone games)

### 3.6 Export & Reporting

**Status**: Not Implemented
**Priority**: LOW

Export data for external use or compliance.

#### Features

- [ ] Export game statistics to PDF
- [ ] Export season summary reports
- [ ] Export player statistics to CSV
- [ ] Generate printable lineup sheets
- [ ] Integration with league reporting systems

### 3.7 PlayMetrics Game Import (ICS)

**Status**: Not Implemented
**Priority**: HIGH

Import game schedules from PlayMetrics using their ICS calendar feed. This allows coaches to sync their league schedule without manual entry.

#### How It Works

PlayMetrics provides an ICS (iCalendar) feed URL for team schedules. The feed contains:

- Game date/time
- Opponent team name
- Location/field information
- Game type (league, tournament, friendly)

#### Implementation Tasks

**Backend:**

- [ ] Create `IcsImportService` to parse ICS feeds
- [ ] Use `ical.js` or `node-ical` library for parsing
- [ ] Extract game events from VEVENT components
- [ ] Map ICS fields to Game entity:
  - `DTSTART` → `scheduledStart`
  - `DTEND` → calculate duration / `scheduledEnd`
  - `SUMMARY` → parse for opponent name
  - `LOCATION` → `location` field
  - `UID` → `externalReference` (for sync/dedup)
  - `DESCRIPTION` → additional metadata
- [ ] Create `importGamesFromIcs` mutation
- [ ] Handle opponent team creation (findOrCreateUnmanagedTeam)
- [ ] Implement duplicate detection using `externalReference`
- [ ] Support incremental sync (update existing, add new)

**Frontend:**

- [ ] Add "Import Games" button to team games page
- [ ] Create ICS import modal/wizard:
  1. Enter PlayMetrics ICS URL
  2. Preview parsed games before import
  3. Select which games to import
  4. Show import progress/results
- [ ] Add "Sync Schedule" button for re-importing
- [ ] Show sync status indicator (last synced date)
- [ ] Handle import conflicts (game already exists)

**Data Model:**

- [ ] Add `externalReference` field to Game entity (for ICS UID)
- [ ] Add `externalSource` field to Game entity ('PLAYMETRICS', 'MANUAL', etc.)
- [ ] Add `lastSyncedAt` field to track sync history
- [ ] Consider `TeamCalendarSync` entity for storing ICS URLs per team

#### ICS Feed Example

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PlayMetrics//Calendar//EN
BEGIN:VEVENT
UID:game-12345@playmetrics.com
DTSTART:20250315T100000
DTEND:20250315T120000
SUMMARY:vs Blue Thunder FC (League Game)
LOCATION:Memorial Park Field 3
DESCRIPTION:Spring 2025 League - Week 5
END:VEVENT
END:VCALENDAR
```

#### Future Enhancements

- [ ] Automatic background sync (daily/weekly)
- [ ] Push notification when new games are added
- [ ] Support for other ICS sources (Google Calendar, TeamSnap)
- [ ] Two-way sync (export our games to ICS)
- [ ] Import practice schedules

---

## Priority 4: Code Cleanup

### 4.1 Remove Deprecated Code

#### Legacy Mutations (users.resolver.ts)

The following mutations are legacy wrappers and should be deprecated in favor of generic user mutations:

```typescript
// DEPRECATED - Use createUser with userType instead
createPlayer();
createCoach();
updatePlayer();
updateCoach();
```

**Action**: Add deprecation warnings, then remove after migration period

#### Legacy Game Status (game.entity.ts)

```typescript
IN_PROGRESS = 'IN_PROGRESS', // Legacy - treated as FIRST_HALF
```

**Action**: Migrate any existing data using `IN_PROGRESS` to `FIRST_HALF`, then remove enum value

#### Disabled Service (players-api.service.disabled.ts)

**Action**: Remove file entirely - GraphQL service is the replacement

### 4.2 Fix Lint Warnings

Current lint output shows numerous warnings that should be addressed:

- [ ] Remove unused imports (`@typescript-eslint/no-unused-vars`)
- [ ] Replace non-null assertions with proper null checks (`@typescript-eslint/no-non-null-assertion`)
- [ ] Add proper types to replace `any` (`@typescript-eslint/no-explicit-any`)
- [ ] Fix emoji accessibility issues (`jsx-a11y/accessible-emoji`)
- [ ] Fix useEffect dependency arrays (`react-hooks/exhaustive-deps`)

### 4.3 Navigation Restructure for Multi-Team

**Status**: Not Started
**Priority**: HIGH

The current top navigation was designed for single-team use and doesn't make sense for multi-user/multi-team scenarios.

#### Current Navigation (Problems)

| Item      | Problem                                                 |
| --------- | ------------------------------------------------------- |
| Dashboard | OK - could show cross-team summary                      |
| New Game  | Should be per-team, not global                          |
| History   | Unclear - what history? Game history is per-team        |
| Players   | Per-team concept, not global                            |
| Users     | Admin concept, shouldn't be top-level for regular users |
| Teams     | OK - list of user's teams                               |
| Analytics | Unclear difference from History                         |
| Settings  | OK - user settings                                      |

#### Proposed Navigation

**For Regular Users:**

```
Dashboard | Teams | Settings
```

**Team-Scoped Pages (accessed via Teams → Team):**

```
Team: [Team Name]
├── Overview (dashboard for this team)
├── Games (schedule + history combined)
│   ├── Upcoming
│   └── Past (was "History")
├── Roster (was "Players")
├── Stats (was "Analytics" - team & player stats)
└── Settings (team settings, members, import)
```

**For Admins Only:**

```
Admin dropdown or /admin route:
├── All Users
├── All Teams
└── System Settings
```

#### Implementation Tasks

- [ ] Remove top-level nav items: History, Players, Users, Analytics, New Game
- [ ] Update Dashboard to show:
  - Recent games across all user's teams
  - Quick actions (start game for each team)
  - Upcoming games summary
- [ ] Consolidate team-level navigation:
  - Merge "History" into Games page with tabs (Upcoming/Past)
  - Rename "Players" to "Roster" (clearer intent)
  - Rename "Analytics" to "Stats" (clearer intent)
- [ ] Move "New Game" to team context (Games page or team header)
- [ ] Add admin-only routes behind role check
- [ ] Update mobile navigation for simplified structure
- [ ] Add breadcrumbs for team context awareness

#### Routes After Restructure

```
/                           → Dashboard (all teams summary)
/teams                      → Teams list
/teams/:id                  → Team overview
/teams/:id/games            → Games (upcoming + past tabs)
/teams/:id/games/new        → New game (was /game/new)
/teams/:id/games/:gameId    → Game detail/tracking
/teams/:id/roster           → Team roster (was /players)
/teams/:id/stats            → Team & player stats (was /analytics)
/teams/:id/settings         → Team settings
/settings                   → User settings
/admin/users                → Admin: all users (role-protected)
/admin/teams                → Admin: all teams (role-protected)
```

### 4.5 Code Quality Review - Design Patterns & Tailwind

**Status**: Not Started
**Priority**: HIGH

Comprehensive code review to ensure consistency with established patterns and Tailwind CSS usage.

#### Design Pattern Review

- [ ] Verify Smart/Presentation component separation is consistent
- [ ] Review service layer patterns (GraphQL services vs direct Apollo calls)
- [ ] Check for proper error handling patterns across components
- [ ] Ensure loading states are handled consistently
- [ ] Review state management patterns (local vs context vs Apollo cache)
- [ ] Verify proper TypeScript usage (no unnecessary `any` types)
- [ ] Check for proper null/undefined handling

#### Tailwind CSS Audit

- [ ] Identify any inline styles that should be Tailwind classes
- [ ] Identify any CSS modules/files that could be converted to Tailwind
- [ ] Check for hardcoded color values that should use Tailwind palette
- [ ] Verify responsive design patterns are consistent (`sm:`, `md:`, `lg:`)
- [ ] Ensure mobile-first approach is followed throughout
- [ ] Check for duplicate/redundant utility combinations
- [ ] Verify accessibility classes are applied (focus states, ARIA)
- [ ] Document any cases where Tailwind cannot be used (with justification)

#### Files to Review

```
apps/soccer-stats/ui/src/app/
├── components/
│   ├── presentation/   # Should be pure UI, Tailwind only
│   └── smart/          # Business logic, minimal styling
├── pages/              # Page-level components
└── styles/             # Should be minimal if using Tailwind properly
```

### 4.6 Implement Soft Deletes

**Status**: Not Implemented
**Priority**: MEDIUM

Add audit trail for data modifications.

#### Implementation

- [ ] Add `deletedAt` field to GameEvent entity
- [ ] Add `deletedBy` field to track who deleted
- [ ] Modify queries to exclude soft-deleted records by default
- [ ] Add admin views to see deleted records
- [ ] Implement restore functionality

### 4.7 Add Input Validation

**Status**: Incomplete
**Priority**: HIGH

Current validation is minimal.

#### Tasks

- [ ] Validate game minute/second against game duration
- [ ] Validate player belongs to team before recording events
- [ ] Validate substitution limits per game format
- [ ] Validate position strings against allowed positions enum
- [ ] Add request rate limiting

---

## Future Considerations

### Multi-Organization Support

- Support for leagues, clubs, and associations
- Organization-level admins and permissions
- Cross-organization game scheduling

### Mobile App

- Native mobile app for coaches (React Native)
- Offline-first event recording
- Sync when connection available

### AI/ML Features

- Automated event detection from video
- Performance prediction
- Optimal lineup suggestions based on historical data

### Integration APIs

- League management system integration
- Parent communication app integration (TeamSnap, SportsEngine)
- Video platform integration (Hudl, Veo)

---

## Implementation Notes

### Database Migration Strategy

For RBAC implementation:

1. Create new tables/columns with nullable fields
2. Backfill existing data with default values
3. Update application code
4. Make fields required
5. Remove deprecated code

### Testing Requirements

- [ ] Unit tests for all new authorization guards
- [ ] Integration tests for role-based access
- [ ] E2E tests for critical user flows
- [ ] Load testing for subscription performance

### Documentation Needs

- [ ] API documentation for new endpoints
- [ ] User guide for role management
- [ ] Admin guide for system configuration

---

## Version History

| Version | Date       | Changes                                                                                    |
| ------- | ---------- | ------------------------------------------------------------------------------------------ |
| 0.1     | 2024-12-14 | Initial roadmap created                                                                    |
| 0.2     | 2024-12-15 | Added: Merge duplicate users, Fix team colors, Team member management, Code quality review |
| 0.3     | 2024-12-15 | Added: PlayMetrics ICS game import feature                                                 |
| 0.4     | 2024-12-15 | Added: Navigation restructure for multi-team UX                                            |
