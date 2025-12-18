# Soccer Stats Tracker - Feature Roadmap

This document outlines planned features, improvements, and cleanup tasks for the Soccer Stats Tracker application.

---

## Table of Contents

1. [Priority 1: Security & Access Control - Team Access Management](#priority-1-security--access-control---team-access-management)
   - [1.1 Foundation - Data Model & Impersonation Support](#11-foundation---data-model--impersonation-support)
   - [1.2 Team Ownership & Transfer](#12-team-ownership--transfer)
   - [1.3 Role-Based Permissions & Guards](#13-role-based-permissions--guards)
   - [1.4 Player Privacy System](#14-player-privacy-system)
   - [1.5 Player-Parent Linking](#15-player-parent-linking)
   - [1.6 Invitation System & Guest Coaches](#16-invitation-system--guest-coaches)
2. [Priority 2: Core Feature Enhancements](#priority-2-core-feature-enhancements)
3. [Priority 3: New Features](#priority-3-new-features)
4. [Priority 4: Code Cleanup](#priority-4-code-cleanup)
5. [Future Considerations](#future-considerations)

---

## Priority 1: Security & Access Control - Team Access Management

### Overview

Multi-role team management system with platform-level admins and team-scoped roles. Supports role assignment, user invitations, and player-parent linking with privacy controls.

### Role Definitions

#### Platform Admin (via Clerk Impersonation)

Instead of a custom Platform Admin role, we use [Clerk's built-in impersonation](https://clerk.com/docs/guides/users/impersonation):

- Admins with Clerk Dashboard access can impersonate any user
- See exactly what users see, debug issues, provide support
- Full audit trail maintained by Clerk
- No custom admin role needed in our database

#### Team Roles

| Role           | Description                  | Key Permissions                                                                                     |
| -------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| **Team Owner** | Team owner (transferable)    | Assign all team roles, full team management, transfer ownership                                     |
| **Manager**    | Team administrator           | Team attributes (name, colors, age group), game scheduling, assign roles, invite parents via player |
| **Coach**      | Team coach                   | Roster/lineup management, positions, substitutions, assign other coaches (including guest)          |
| **Player**     | Team player                  | View own stats; adults (18+) have global privacy setting for last name visibility                   |
| **Parent/Fan** | Player guardian or supporter | View-only access, linked to specific player(s), sees full names for associated team                 |

#### Role Assignment Rules

| Assigner                  | Can Assign                                    |
| ------------------------- | --------------------------------------------- |
| Admin (via impersonation) | Any role on any team (by impersonating owner) |
| Team Owner                | Manager, Coach, Player, Parent/Fan            |
| Manager                   | Coach, Player, Parent/Fan                     |
| Coach                     | Coach (including guest coaches)               |
| Player                    | —                                             |
| Parent/Fan                | —                                             |

#### Privacy Rules

| User Type                   | Last Name Visibility                                     |
| --------------------------- | -------------------------------------------------------- |
| Adult players (18+)         | Global account setting: `PUBLIC` or `TEAM_ONLY`          |
| Minor players (<18)         | Only visible to team-associated users (no public option) |
| Team-associated users       | See full names for players on their team                 |
| Public/non-associated users | First names only                                         |

---

### 1.1 Foundation - Data Model & Impersonation Support

**Status**: IMPLEMENTED
**Priority**: CRITICAL
**Phase**: 1
**Completed**: December 2025

Establish the data model for team access control and integrate Clerk's built-in impersonation.

#### Admin Access via Clerk Impersonation

Instead of building a custom Platform Admin role, we leverage [Clerk's built-in user impersonation](https://clerk.com/docs/guides/users/impersonation):

- **Dashboard access**: Clerk Dashboard → Users → "Impersonate user"
- **Programmatic**: Actor tokens via Clerk Backend API
- **Audit trail**: Clerk automatically logs all impersonation sessions
- **Security**: Controlled via Clerk Dashboard permissions

When impersonating, Clerk adds an `act` claim to the JWT containing the impersonator's info:

```typescript
// JWT payload during impersonation
{
  sub: "user_123",        // Impersonated user (who you're acting as)
  act: {                  // Actor claim - only present during impersonation
    sub: "user_456",      // Impersonator (admin doing the impersonating)
    sid: "sess_456",
    iss: "https://dashboard.clerk.com"
  }
}
```

#### Backend Implementation (Impersonation Detection)

- [x] Update `ClerkService` to extract `act` claim from JWT payload
- [x] Add `ClerkActor` interface for actor data typing
- [x] Update `ClerkAuthGuard` to attach actor info to request context:
  ```typescript
  req.actor = payload.act ?? null;
  req.isImpersonating = !!payload.act;
  ```
- [x] Create `@Actor()` parameter decorator for resolver access
- [ ] Add application-level audit logging when impersonation detected (optional)

#### Frontend Implementation (Impersonation Banner)

- [x] Detect impersonation via `useAuth()` hook's `actor` property
- [x] Display impersonation banner: "Viewing as [User Name] - [Exit]"
- [x] Style banner distinctively (e.g., yellow/orange warning color)
- [x] "Exit" button ends impersonation session

#### Database Changes

- [x] Add `birthDate` field to User entity (for age-based privacy calculation)
- [x] Add `lastNameVisibility` field to User entity (`PUBLIC`, `TEAM_ONLY`, default: `TEAM_ONLY`)
- [x] Create `TeamMember` entity:
  ```typescript
  TeamMember {
    id: ID
    userId: ID
    teamId: ID
    role: TeamRole  // OWNER, MANAGER, COACH, PLAYER, PARENT_FAN
    linkedPlayerId?: ID  // For parent/fan - which player grants access
    isGuest: boolean  // For guest coaches
    invitedBy?: ID
    invitedAt?: DateTime
    acceptedAt?: DateTime
    createdAt: DateTime
    updatedAt: DateTime
  }
  ```
- [x] Create `TeamRole` enum: `OWNER`, `MANAGER`, `COACH`, `PLAYER`, `PARENT_FAN`

#### API Implementation

- [x] Create TeamMember GraphQL type and basic CRUD resolvers
- [x] Create `TeamMembersModule` in NestJS
- [x] Add `teamMembers` query to Team type
- [x] Add `owner` field resolver to Team type

#### Migration Strategy

1. Create new tables/columns with nullable fields
2. Backfill: Set `lastNameVisibility: TEAM_ONLY` as default

#### Future Enhancement (Optional)

If in-app impersonation UI is needed later:

- [ ] Create admin page with user search
- [ ] "Impersonate" button calls Clerk Backend API to generate actor token
- [ ] Redirect to app with impersonation session active

---

### 1.2 Team Ownership & Transfer

**Status**: IMPLEMENTED
**Priority**: CRITICAL
**Phase**: 2
**Completed**: December 2025

Every team must have exactly one owner with transfer capability.

#### Business Rules

- Each team has exactly one owner at any time
- Ownership can be transferred to another team member
- Owner cannot leave team without first transferring ownership
- Deleting a team requires owner role

#### Implementation Tasks

- [x] Add ownership validation to Team entity (exactly one OWNER per team)
- [x] Create `transferTeamOwnership` mutation
- [ ] Add ownership transfer confirmation flow (UI)
- [x] Prevent owner from leaving team without transfer
- [ ] Backfill existing teams: Set creator as owner (or first coach if no creator)

#### API

```graphql
mutation transferTeamOwnership(teamId: ID!, newOwnerId: ID!): Team!
query canTransferOwnership(teamId: ID!): [TeamMember!]!  # Eligible recipients
```

#### UI Tasks

- [ ] Team settings: "Transfer Ownership" section (visible to owner only)
- [ ] New owner selection dropdown (from current team members)
- [ ] Confirmation modal with clear warning about losing ownership
- [ ] Success notification and role update in UI

---

### 1.3 Role-Based Permissions & Guards

**Status**: PARTIAL - Teams Protected, Games/Events Pending
**Priority**: CRITICAL
**Phase**: 2
**Started**: December 2025

Protect all API endpoints with appropriate role checks.

#### Implementation Tasks

- [x] Create `@RequireTeamRole(roles: TeamRole[])` decorator
- [x] Create `TeamAccessGuard` for team-scoped operations
- [x] Implement role inheritance (owner has all manager permissions, etc.)
- [x] TeamMembersService handles permission checking logic
- [ ] Add `currentUserTeamRole` field to Team GraphQL type

#### Permission Matrix

| Operation               | Required Role(s)                      |
| ----------------------- | ------------------------------------- |
| View team (public info) | Any authenticated user                |
| View team roster        | Team member (any role)                |
| Edit team attributes    | Owner, Manager                        |
| Delete team             | Owner only                            |
| Manage roster           | Owner, Manager, Coach                 |
| Record game events      | Owner, Manager, Coach                 |
| View player full names  | Team member (any role)                |
| Invite team members     | Owner, Manager, Coach (role-specific) |

#### Affected Endpoints Status

```
teams.resolver.ts: ✅ PROTECTED
- createTeam                → ✅ Any authenticated user (becomes owner)
- updateTeam                → ✅ Require: Owner, Manager
- removeTeam                → ✅ Require: Owner
- upgradeToManagedTeam      → ✅ Require: Owner, Manager
- addPlayerToTeam           → ✅ Require: Owner, Manager, Coach
- removePlayerFromTeam      → ✅ Require: Owner, Manager, Coach

game-events.resolver.ts: ⏳ PENDING (requires gameEvent→gameTeam→team lookup)
- removeFromLineup          → Require: Owner, Manager, Coach
- updatePlayerPosition      → Require: Owner, Manager, Coach
- deleteGoal                → Require: Owner, Manager, Coach
- deleteSubstitution        → Require: Owner, Manager, Coach
- deletePositionSwap        → Require: Owner, Manager, Coach
- deleteStarterEntry        → Require: Owner, Manager, Coach
- updateGoal                → Require: Owner, Manager, Coach
- deleteEventWithCascade    → Require: Owner, Manager, Coach
- resolveEventConflict      → Require: Owner, Manager, Coach

games.resolver.ts: ⏳ PENDING (games involve 2 teams, needs multi-team logic)
- createGame                → Require: Owner, Manager (of homeTeam)
- updateGame                → Require: Owner, Manager, Coach
- deleteGame                → Require: Owner, Manager
```

---

### 1.4 Player Privacy System

**Status**: Not Implemented
**Priority**: HIGH
**Phase**: 3

Age-based privacy controls for player name visibility.

#### Privacy Rules Implementation

1. **Age Calculation**: Derive from `User.birthDate`
2. **Adult (18+)**: Respects `lastNameVisibility` setting
   - `PUBLIC`: Everyone sees full name
   - `TEAM_ONLY`: Only team-associated users see last name
3. **Minor (<18)**: Last name ONLY visible to team-associated users (enforced, no setting)

#### Implementation Tasks

- [ ] Create `PrivacyService` with `getDisplayName(viewer, player, teamId?)` method
- [ ] Create `isAdult(user)` utility based on birthDate
- [ ] Create `isTeamAssociated(viewer, teamId)` check
- [ ] Add `displayName` field resolver on User GraphQL type (context-aware)
- [ ] Update all player name displays to use privacy-aware display name
- [ ] Add privacy setting to user profile/settings page

#### API

```graphql
type User {
  # Existing fields...
  displayName: String!  # Context-aware: may be "John" or "John Smith"
  lastNameVisibility: LastNameVisibility  # Only visible to self
  isMinor: Boolean!  # Computed from birthDate
}

enum LastNameVisibility {
  PUBLIC
  TEAM_ONLY
}

mutation updatePrivacySettings(lastNameVisibility: LastNameVisibility!): User!
```

#### UI Tasks

- [ ] Profile settings: "Name Privacy" section
- [ ] Toggle for adults: "Show last name publicly" vs "Team members only"
- [ ] Info text explaining how name appears to different viewers
- [ ] Visual indicator on player cards when viewing limited name

---

### 1.5 Player-Parent Linking

**Status**: Not Implemented
**Priority**: HIGH
**Phase**: 4

Parents/fans gain team access by being linked to a player on the team.

#### Core Concept

- Parents/fans don't have direct team membership
- Access is granted through link to a specific player
- One parent can be linked to multiple players (siblings on same/different teams)
- Removing player link revokes parent's team access

#### Implementation Tasks

- [ ] Implement `TeamMember.linkedPlayerId` relationship
- [ ] Create `inviteParent` mutation (manager/coach invites parent for specific player)
- [ ] Create `linkParentToPlayer` mutation (add additional player links)
- [ ] Create `unlinkParentFromPlayer` mutation
- [ ] Add validation: Parent/Fan role requires at least one player link
- [ ] Handle cascade: When player removed from team, notify linked parents

#### API

```graphql
mutation inviteParent(
  teamId: ID!
  playerId: ID!
  email: String!
  relationship: String  # "Parent", "Guardian", "Fan"
): TeamInvitation!

mutation linkParentToPlayer(
  teamMemberId: ID!
  playerId: ID!
): TeamMember!

mutation unlinkParentFromPlayer(
  teamMemberId: ID!
  playerId: ID!
): TeamMember!

type TeamMember {
  # ...existing fields
  linkedPlayers: [User!]!  # Players this parent is linked to
}
```

#### UI Tasks

- [ ] Player detail page: "Invite Parent/Guardian" button
- [ ] Parent invitation form (email, relationship type)
- [ ] Parent dashboard: "My Players" section showing linked players across teams
- [ ] Team roster view: Show parent links under each player
- [ ] Manager view: Manage parent links for any player

---

### 1.6 Invitation System & Guest Coaches

**Status**: Not Implemented
**Priority**: HIGH
**Phase**: 4

Email-based invitation system with magic links for team member onboarding.

#### Invitation Flow

1. Inviter creates invitation (selects role, enters email, optionally links to player)
2. System generates secure token and sends email with magic link
3. Recipient clicks link → redirected to accept page
4. If new user: Create account flow → accept invitation
5. If existing user: Login (if needed) → accept invitation
6. TeamMember record created with appropriate role

#### Data Model

```typescript
TeamInvitation {
  id: ID
  teamId: ID
  email: String
  role: TeamRole
  linkedPlayerId?: ID  // For parent invitations
  invitedBy: ID
  invitedAt: DateTime
  expiresAt: DateTime  // Default: 7 days
  acceptedAt?: DateTime
  status: InvitationStatus  // PENDING, ACCEPTED, EXPIRED, CANCELLED
  token: String  // Secure random token for magic link
}
```

#### Implementation Tasks

- [ ] Create `TeamInvitation` entity
- [ ] Create `InvitationsModule` with service and resolver
- [ ] Implement secure token generation (crypto.randomBytes)
- [ ] Create email templates for invitations
- [ ] Integrate with email service (SendGrid, AWS SES, etc.)
- [ ] Create invitation accept flow (new user vs existing user)
- [ ] Implement invitation expiration handling
- [ ] Add resend and cancel functionality

#### Guest Coach Feature

- [ ] Add `isGuest` flag to TeamMember entity
- [ ] Guest coaches have same permissions as regular coaches
- [ ] Guest status visible in team member list
- [ ] Owner/Manager can promote guest to full coach
- [ ] Optional: Time-limited guest access (expiresAt on TeamMember)

#### API

```graphql
mutation inviteTeamMember(
  teamId: ID!
  email: String!
  role: TeamRole!
  linkedPlayerId: ID  # Required for PARENT_FAN role
  isGuest: Boolean  # For guest coaches
  message: String  # Optional personal message
): TeamInvitation!

mutation resendInvitation(invitationId: ID!): TeamInvitation!
mutation cancelInvitation(invitationId: ID!): Boolean!
mutation acceptInvitation(token: String!): TeamMember!

query pendingInvitations(teamId: ID!): [TeamInvitation!]!
query myInvitations: [TeamInvitation!]!  # Invitations for current user's email
```

#### UI Tasks

- [ ] Team settings: "Invitations" tab
- [ ] "Invite Member" button with role selection form
- [ ] Pending invitations list with status, resend, cancel actions
- [ ] Invitation accept page (handles magic link)
- [ ] New user registration flow from invitation
- [ ] Guest coach badge/indicator in team member list
- [ ] "Promote to Full Coach" action for guests

---

### Implementation Phases

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: Foundation (1.1)                                       │
│ - Data model, TeamMember entity, Impersonation detection        │
│ - Estimated: Foundation for all other features                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: Ownership & Guards (1.2 + 1.3)                         │
│ - Team ownership with transfer                                  │
│ - Role-based permission guards on all endpoints                 │
│ - API is secured after this phase                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3: Privacy (1.4)                                          │
│ - Age-based privacy rules                                       │
│ - Display name logic                                            │
│ - Can be developed in parallel with Phase 4                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 4: Linking & Invitations (1.5 + 1.6)                      │
│ - Player-parent linking                                         │
│ - Email invitation system                                       │
│ - Guest coach support                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

### Testing Requirements

- [ ] Unit tests for all authorization guards and decorators
- [ ] Unit tests for privacy/display name logic
- [ ] Integration tests for role-based access across resolvers
- [ ] Integration tests for invitation flow (create → accept)
- [ ] E2E tests for critical flows:
  - Team creation → ownership assignment
  - Invitation → acceptance → team access
  - Parent invitation → player linking → access verification
  - Ownership transfer flow
- [ ] Edge case tests:
  - Minor turning 18 (privacy rule change)
  - Last owner trying to leave team
  - Expired invitation handling
  - Duplicate invitation to same email

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

**Status**: Superseded
**Priority**: N/A

> **Note**: This feature has been expanded and moved to Priority 1 as part of the comprehensive **Team Access Management** system. See:
>
> - [1.3 Role-Based Permissions & Guards](#13-role-based-permissions--guards) - Role definitions and permission checks
> - [1.5 Player-Parent Linking](#15-player-parent-linking) - Parent/fan access via player links
> - [1.6 Invitation System & Guest Coaches](#16-invitation-system--guest-coaches) - Email invitations and member management UI

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

| Version | Date       | Changes                                                                                                                    |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| 0.1     | 2024-12-14 | Initial roadmap created                                                                                                    |
| 0.2     | 2024-12-15 | Added: Merge duplicate users, Fix team colors, Team member management, Code quality review                                 |
| 0.3     | 2024-12-15 | Added: PlayMetrics ICS game import feature                                                                                 |
| 0.4     | 2024-12-15 | Added: Navigation restructure for multi-team UX                                                                            |
| 0.5     | 2025-12-15 | Expanded: Team Access Management with 6 deliverables (Foundation, Ownership, Guards, Privacy, Parent Linking, Invitations) |
| 0.6     | 2025-12-15 | Simplified: Replace Platform Admin role with Clerk's built-in impersonation feature                                        |
