# Soccer Stats Tracker - Feature Roadmap

This document outlines planned features, improvements, and cleanup tasks for the Soccer Stats Tracker application.

---

## Table of Contents

0. [MVP Prioritization](#mvp-prioritization)
   - [MVP Tiers Overview](#mvp-tiers-overview)
   - [MVP Quick Reference](#mvp-quick-reference)
   - [MVP Sprints](#mvp-sprints)
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
5. [Priority 5: UX Enhancements & New Features (GitHub Issues Backlog)](#priority-5-ux-enhancements--new-features-github-issues-backlog)
   - [#179: Primary Team Always on Left](#issue-179-primary-team-always-on-left-during-game-tracking)
   - [#180: Feature Toggles for Stats Tracking](#issue-180-feature-toggles-for-stats-tracking-per-team)
   - [#181: Media Uploads for Game Events](#issue-181-media-uploads-for-game-events)
   - [#182: Game Summary Page](#issue-182-game-summary-page)
   - [#183: Team Association View for Users](#issue-183-team-association-view-for-users)
   - [#184: One-Time Game Invite Links](#issue-184-one-time-game-invite-links)
   - [#185: Bug - Full Page Refresh After Goal](#issue-185-bug---full-page-refresh-after-scoring-goal-vercelrailway)
   - [#186: Per-Game Stats Configuration](#issue-186-per-game-stats-configuration-with-team-defaults)
   - [#187: Sticky Score Header](#issue-187-sticky-score-header-when-scrolling)
   - [#188: Player Photos and Field Quick View](#issue-188-player-photos-and-field-quick-view)
6. [Future Considerations](#future-considerations)

---

## MVP Prioritization

> **Target Users:** Coach (primary) + select parents from the team
> **Security Stance:** Trusted users only (small group)
> **Last Updated:** December 2025

### MVP Tiers Overview

| Tier          | Name         | Description                                              |
| ------------- | ------------ | -------------------------------------------------------- |
| 🔴 **Tier 1** | Must Have    | Core functionality - app isn't usable without these      |
| 🟡 **Tier 2** | Should Have  | Significantly improves UX for parents viewing games      |
| 🟢 **Tier 3** | Nice to Have | Polish items that can wait until after initial launch    |
| ⚪ **Tier 4** | Post-MVP     | Explicitly deferred - not needed for trusted user launch |

### MVP Quick Reference

#### 🔴 Tier 1: Must Have

| Item                         | Source                                               | Status     | Notes                                  |
| ---------------------------- | ---------------------------------------------------- | ---------- | -------------------------------------- |
| Game tracking flow           | Core                                                 | ✅ Done    | Create → record goals → end game works |
| Team roster management       | Core                                                 | ✅ Done    | Add/remove players functional          |
| Real stats display           | 2.6                                                  | ⚠️ Partial | Some stats hardcoded as 0 - needs fix  |
| Team association for parents | [#183](https://github.com/JoA-MoS/garage/issues/183) | ⚠️ Partial | Parents need to see their team's games |
| Multi-team dashboard         | [#183](https://github.com/JoA-MoS/garage/issues/183) | ⚠️ Partial | Aggregate games across user's teams    |

#### 🟡 Tier 2: Should Have

| Item                           | Source                                               | Status          | Effort |
| ------------------------------ | ---------------------------------------------------- | --------------- | ------ |
| Per-team stats config UI       | [#186](https://github.com/JoA-MoS/garage/issues/186) | ⚠️ Backend done | Small  |
| Primary team on left           | [#179](https://github.com/JoA-MoS/garage/issues/179) | ❌ Not started  | Small  |
| Sticky score header            | [#187](https://github.com/JoA-MoS/garage/issues/187) | ❌ Not started  | Medium |
| Game summary view (simplified) | [#182](https://github.com/JoA-MoS/garage/issues/182) | ❌ Not started  | Medium |

#### 🟢 Tier 3: Nice to Have

| Item                               | Source                                               | Status                 | Effort  |
| ---------------------------------- | ---------------------------------------------------- | ---------------------- | ------- |
| Team colors displaying properly    | 2.4                                                  | ✅ Done                | -       |
| Feature toggles UI                 | [#180](https://github.com/JoA-MoS/garage/issues/180) | ⚠️ Backend done        | Small   |
| Investigate production refresh bug | [#185](https://github.com/JoA-MoS/garage/issues/185) | ⚠️ Needs investigation | Unknown |

#### ⚪ Tier 4: Post-MVP (Deferred)

| Item                     | Source                                               | Reason for Deferral               |
| ------------------------ | ---------------------------------------------------- | --------------------------------- |
| Player privacy system    | 1.4                                                  | Trusted users - not needed yet    |
| Invitation system        | 1.6                                                  | Manual team member creation works |
| Games/Events auth guards | 1.3                                                  | Trusted users - can add later     |
| Media uploads            | [#181](https://github.com/JoA-MoS/garage/issues/181) | Nice but not essential            |
| Player photos            | [#188](https://github.com/JoA-MoS/garage/issues/188) | Nice but not essential            |
| Game invites             | [#184](https://github.com/JoA-MoS/garage/issues/184) | Can share link directly for now   |
| ICS import               | 3.7                                                  | Manual game creation works        |
| Export/reporting         | 3.6                                                  | Can screenshot for now            |
| Goalkeeper saves         | 3.2                                                  | Not tracking this yet             |
| Game review system       | 3.3                                                  | Overkill for small group          |
| Season/date filtering    | 2.1                                                  | First season, no history yet      |
| Navigation restructure   | 4.3                                                  | Current nav works for MVP         |
| Merge duplicate users    | 2.3                                                  | Small user base, manual fix ok    |

### MVP Sprints

#### Sprint 1: Parent Experience (Tier 1 Gaps)

Focus: Enable parents to view their team's games with real statistics.

- [ ] **Fix hardcoded stats** - Ensure player stats show actual calculated values
- [ ] **Team association view** - Parents see games for teams they're members of ([#183](https://github.com/JoA-MoS/garage/issues/183))
- [ ] **Multi-team dashboard** - Aggregate upcoming/recent games across all user's teams

#### Sprint 2: Game Day UX (Tier 2)

Focus: Improve the game tracking experience for the coach.

- [ ] **Primary team on left** - User's team always displays on left side ([#179](https://github.com/JoA-MoS/garage/issues/179))
- [ ] **Per-team stats config UI** - Connect UI to existing backend config ([#186](https://github.com/JoA-MoS/garage/issues/186))
- [ ] **Sticky score header** - Score/clock visible while scrolling ([#187](https://github.com/JoA-MoS/garage/issues/187))

#### Sprint 3: Post-Game Experience (Tier 2)

Focus: Better experience after games end.

- [ ] **Game summary page** - Simplified post-game summary with stats ([#182](https://github.com/JoA-MoS/garage/issues/182))

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

## Priority 5: UX Enhancements & New Features (GitHub Issues Backlog)

This section contains feature requests formatted as GitHub issues for future implementation.

---

### Issue [#179](https://github.com/JoA-MoS/garage/issues/179): Primary Team Always on Left During Game Tracking

**Labels:** `enhancement`, `ux`, `game-tracking`
**Priority:** Medium | **MVP Tier:** 🟡 Tier 2 (Should Have)
**Affects:** Game Page UI

#### Description

During active game tracking, the team associated with the logged-in user (their "primary" team) should always be displayed on the left side of the screen, regardless of home/away designation.

#### Current Behavior

Teams are displayed based on home/away assignment, which may put the user's team on either side.

#### Expected Behavior

- Detect which team the current user is associated with (via `TeamMember` relationship)
- Always render that team's score, lineup, and controls on the left
- Opponent team renders on the right
- Visual indicator showing which team is "home" vs "away" should still be present

#### Acceptance Criteria

- [ ] User's associated team is always displayed on left side of game page
- [ ] Home/Away indicator still visible (badge or label)
- [ ] Works correctly when user is associated with both teams (edge case - use home team)
- [ ] Maintains consistency throughout the game session

#### Technical Notes

- Query `TeamMember` for current user to determine primary team
- May need to swap team ordering in `GameTeam` rendering logic
- Consider caching this determination to avoid re-queries

#### Related

- Relies on TeamMember entity (implemented in 1.1)

---

### Issue [#180](https://github.com/JoA-MoS/garage/issues/180): Feature Toggles for Stats Tracking Per Team

**Labels:** `enhancement`, `feature-flags`, `team-configuration`
**Priority:** High | **MVP Tier:** 🟢 Tier 3 (Nice to Have)
**Affects:** Team Settings, Game Tracking

#### Description

Allow teams to toggle specific tracking features on/off. These act as feature flags that control which stats mechanisms are available during game tracking.

#### Proposed Features to Toggle

| Feature              | Description                      | Default |
| -------------------- | -------------------------------- | ------- |
| `trackSubstitutions` | Record player substitutions      | ON      |
| `trackPossession`    | Track team possession time       | OFF     |
| `trackShots`         | Track shots on goal / off target | OFF     |
| `trackCorners`       | Track corner kicks               | OFF     |
| `trackFouls`         | Track fouls committed            | OFF     |
| `trackOffsides`      | Track offside calls              | OFF     |
| `trackSaves`         | Track goalkeeper saves           | OFF     |

#### Implementation

**Extend `TeamConfiguration` entity:**

```typescript
// Add to team-configuration.entity.ts
@Column({ default: true })
trackSubstitutions: boolean;

@Column({ default: false })
trackPossession: boolean;

@Column({ default: false })
trackShots: boolean;

@Column({ default: false })
trackCorners: boolean;

@Column({ default: false })
trackFouls: boolean;

@Column({ default: false })
trackOffsides: boolean;

@Column({ default: false })
trackSaves: boolean;
```

#### Acceptance Criteria

- [ ] Team settings page has toggles for each tracking feature
- [ ] Game tracking UI only shows controls for enabled features
- [ ] Changes take effect immediately for new games
- [ ] In-progress games use configuration from when game started
- [ ] Default values are sensible for youth soccer

#### Related

- Extends existing `TeamConfiguration` entity
- Related to #108 (per-game stats config)

---

### Issue [#181](https://github.com/JoA-MoS/garage/issues/181): Media Uploads for Game Events

**Labels:** `enhancement`, `media`, `new-feature`
**Priority:** Medium | **MVP Tier:** ⚪ Tier 4 (Post-MVP)
**Affects:** Game Events, Storage

#### Description

Allow users to upload photos and videos to match events (goals, saves, etc.) and to games generally for moments that don't correspond to tracked events.

#### Use Cases

1. **Event-specific:** Parent uploads video of their child's goal
2. **General match:** Coach uploads team photo before kickoff
3. **Highlight reel:** Multiple clips attached to different events

#### Implementation

**New Entity: `GameMedia`**

```typescript
GameMedia {
  id: ID
  gameId: ID
  gameEventId?: ID  // Optional - if attached to specific event
  uploadedById: ID
  mediaType: 'IMAGE' | 'VIDEO'
  url: string       // Cloud storage URL
  thumbnailUrl?: string
  caption?: string
  uploadedAt: DateTime
  durationSeconds?: number  // For videos
  metadata: JSON    // EXIF, dimensions, etc.
}
```

#### Acceptance Criteria

- [ ] Users can upload photos/videos to a game
- [ ] Users can attach media to specific game events
- [ ] Media displays in game timeline alongside events
- [ ] Thumbnail previews for videos
- [ ] Maximum file size enforced (configurable)
- [ ] Supported formats: JPG, PNG, MP4, MOV
- [ ] Media can be deleted by uploader or team manager

#### Technical Considerations

- Cloud storage integration (S3, Cloudinary, or similar)
- Video transcoding for web playback
- Thumbnail generation for videos
- Consider CDN for media delivery
- Mobile upload optimization (compression, chunked upload)

#### Related

- Related to #104 (Game Summary Page with highlights)

---

### Issue [#182](https://github.com/JoA-MoS/garage/issues/182): Game Summary Page

**Labels:** `enhancement`, `new-feature`, `post-game`
**Priority:** Medium | **MVP Tier:** 🟡 Tier 2 (Should Have)
**Affects:** Game Detail View

#### Description

Create a comprehensive game summary page that displays when a game is marked as complete. This page shows final stats, key moments, and highlight media.

#### Features

- Final score with team branding
- Game timeline with key events (goals, cards, substitutions)
- Player statistics table (goals, assists, minutes played)
- Highlight videos/photos from the match (from #103)
- Share functionality for social media
- PDF export option

#### Mockup Concept

```
┌─────────────────────────────────────────────────┐
│  [Team Logo]  Thunder FC  3 - 1  Blue Dragons   │
│              ⚽ 12' ⚽ 34' ⚽ 67'     ⚽ 45'       │
├─────────────────────────────────────────────────┤
│  Timeline                                        │
│  12' ⚽ Goal - Alex (assist: Jordan)            │
│  34' ⚽ Goal - Casey                             │
│  45' ⚽ Goal - [Opponent]                        │
│  67' ⚽ Goal - Alex (assist: Riley)              │
├─────────────────────────────────────────────────┤
│  Player Stats                                    │
│  Alex:   2 goals, 0 assists, 65 min            │
│  Jordan: 0 goals, 1 assist, 70 min             │
│  ...                                            │
├─────────────────────────────────────────────────┤
│  Highlights  [▶ Video 1] [📷 Photo 1] [▶ Video 2]│
└─────────────────────────────────────────────────┘
```

#### Acceptance Criteria

- [ ] Summary page automatically displays when game status is COMPLETED
- [ ] Final score prominently displayed
- [ ] Timeline shows all key events in chronological order
- [ ] Player stats table with sortable columns
- [ ] Media gallery section (if media attached)
- [ ] Share button generates shareable link
- [ ] Mobile-optimized layout

#### Related

- Depends on #103 (Media Uploads) for highlight section
- Uses existing game event data

---

### Issue [#183](https://github.com/JoA-MoS/garage/issues/183): Team Association View for Users

**Labels:** `enhancement`, `ux`, `multi-team`
**Priority:** High | **MVP Tier:** 🔴 Tier 1 (Must Have)
**Affects:** Dashboard, Games List

#### Description

Users should be able to see games for all teams they are associated with. The dashboard should aggregate upcoming and recent games across all their teams.

This feature implements the **GraphQL "my" Viewer Pattern** - a well-established pattern (used by GitHub, Shopify, Facebook) for user-scoped queries.

#### Current State

- `TeamMember` entity already supports multi-team association ✅
- `User.teamMemberships` relationship exists ✅
- UI only shows games for a single selected team

#### Expected Behavior

- Dashboard shows aggregated view across all user's teams
- Games list can be filtered by team or show all
- Clear team indicator on each game card
- Quick team switcher in navigation

#### Implementation: GraphQL "my" Viewer Pattern

Instead of passing user IDs from the client:

```graphql
# Current approach (requires client to know user ID)
query {
  teams(userId: $currentUserId) {
    name
  }
  games(userId: $currentUserId) {
    name
  }
}

# Viewer pattern (cleaner, more secure)
query {
  my {
    teams {
      name
    }
    games {
      name
    }
  }
}
```

**Benefits:**

1. **Cleaner Query Ergonomics** - No user ID boilerplate from client
2. **Security by Default** - User extracted from auth context, not client input
3. **Type Safety** - Expose user-specific computed fields that don't make sense globally
4. **Caching** - Apollo Client caches `my` as stable entry point per session

#### Proposed Schema

```graphql
type Query {
  my: MyData # nullable - returns null if not authenticated
  # Keep direct access for deep links, admin views
  team(id: ID!): Team
  game(id: ID!): Game
}

type MyData {
  # Identity
  user: User!

  # Teams
  teams: [Team!]! # All teams I belong to
  ownedTeams: [Team!]! # Teams where I'm OWNER
  managedTeams: [Team!]! # Teams where I'm OWNER or MANAGER
  # Games (aggregated across all my teams)
  upcomingGames(limit: Int): [Game!]!
  recentGames(limit: Int): [Game!]!
  liveGames: [Game!]! # Games currently in progress
  # Activity
  recentActivity(limit: Int): [Activity!]!

  # Stats
  playerStats: PlayerFullStats # If user is also a player
}
```

#### Implementation Tasks

**Backend:**

- [ ] Create `MyData` GraphQL object type
- [ ] Create `my.resolver.ts` with `@Query(() => MyData)`
- [ ] Implement field resolvers for teams, games, etc.
- [ ] Add `@CurrentUser()` decorator usage for auth context
- [ ] Handle null case when not authenticated
- [ ] Ensure DataLoader is used to prevent N+1 queries

**Example Backend Implementation:**

```typescript
// my.resolver.ts
@Resolver(() => MyData)
export class MyResolver {
  @Query(() => MyData, { nullable: true, name: 'my' })
  getMy(@CurrentUser() user: User | null): MyData | null {
    if (!user) return null;
    return { userId: user.id };
  }

  @ResolveField(() => [Team])
  async teams(@Parent() my: MyData): Promise<Team[]> {
    return this.teamsService.findByUserId(my.userId);
  }

  @ResolveField(() => [Game])
  async upcomingGames(@Parent() my: MyData, @Args('limit', { nullable: true }) limit?: number): Promise<Game[]> {
    return this.gamesService.findUpcomingByUserId(my.userId, limit);
  }
}
```

**Frontend:**

- [ ] Create `useMyData()` hook or query
- [ ] Update Dashboard to use `my { teams, upcomingGames, recentGames }`
- [ ] Update navigation to use `my.teams` for team switcher
- [ ] Cache `my` query appropriately in Apollo Client

**UI Tasks:**

- [ ] Games list has "All Teams" filter option
- [ ] Each game card shows team name/color for context
- [ ] User can quickly navigate to team-specific views

#### Example Dashboard Query

```graphql
query MyDashboard {
  my {
    user {
      firstName
    }
    teams {
      id
      name
      primaryColor
    }
    upcomingGames(limit: 5) {
      id
      scheduledStart
      homeTeam {
        name
      }
      awayTeam {
        name
      }
    }
    recentGames(limit: 5) {
      id
      name
      status
      homeScore
      awayScore
    }
  }
}
```

#### Acceptance Criteria

- [ ] `my` query returns null when not authenticated
- [ ] `my.teams` returns only teams user is a member of
- [ ] `my.upcomingGames` aggregates games across all user's teams
- [ ] `my.recentGames` shows completed games from user's teams
- [ ] Query performance is optimized (DataLoader, no N+1)
- [ ] Frontend dashboard uses this pattern
- [ ] User can quickly navigate to team-specific views

#### Design Considerations

1. **Hybrid Approach**: Keep direct queries like `team(id)` for deep links and admin views
2. **Naming**: Using `my` (possessive) rather than `viewer` or `me` since most fields are collections the user belongs to
3. **Nullability**: `my` is nullable to handle unauthenticated state gracefully

---

### Issue [#184](https://github.com/JoA-MoS/garage/issues/184): One-Time Game Invite Links

**Labels:** `enhancement`, `sharing`, `new-feature`
**Priority:** Low | **MVP Tier:** ⚪ Tier 4 (Post-MVP)
**Affects:** Game Sharing

#### Description

Allow users to invite someone to view a specific game via a one-time invite link. The invitee must register/login with the email the invite was sent to.

#### Flow

1. User clicks "Invite to view game" on game page
2. Enters invitee's email address
3. System generates unique invite link and sends email
4. Invitee clicks link → prompted to login/register with that email
5. Upon successful auth with matching email, gains view access to that specific game

#### Data Model

```typescript
GameInvite {
  id: ID
  gameId: ID
  invitedEmail: string
  invitedById: ID
  token: string       // Secure random token for link
  createdAt: DateTime
  expiresAt: DateTime // 7 days default
  acceptedAt?: DateTime
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
}
```

#### Acceptance Criteria

- [ ] "Invite" button on game page generates invite link
- [ ] Email sent with game details and invite link
- [ ] Invite link validates email matches at login
- [ ] Invited user gains view-only access to that specific game
- [ ] Invite expires after 7 days if not accepted
- [ ] Game owner can see pending invites and revoke them

#### Security Considerations

- Token must be cryptographically secure
- Email validation prevents unauthorized access
- View-only access (no editing/recording)
- Rate limiting on invite creation

---

### Issue [#185](https://github.com/JoA-MoS/garage/issues/185): Bug - Full Page Refresh After Scoring Goal (Vercel/Railway)

**Labels:** `bug`, `production`, `critical`
**Priority:** Critical | **MVP Tier:** 🟢 Tier 3 (Nice to Have - Investigate)
**Affects:** Game Tracking (Production)

#### Description

When deployed to Vercel (frontend) and Railway (backend), scoring a goal appears to cause a full view refresh instead of an optimistic update or smooth state change.

#### Steps to Reproduce

1. Deploy app to Vercel/Railway
2. Start tracking a game
3. Record a goal
4. Observe: Page appears to fully refresh

#### Expected Behavior

- Goal records with optimistic update
- UI updates smoothly without page refresh
- Score increments immediately

#### Investigation Areas

- [ ] Check Apollo Client cache configuration in production
- [ ] Verify WebSocket/subscription reconnection behavior
- [ ] Check if optimistic response is configured on goal mutation
- [ ] Review network tab for unexpected navigation
- [ ] Check for unhandled errors triggering error boundary
- [ ] Compare local dev behavior vs production

#### Technical Notes

This works correctly in local development, suggesting environment-specific issue:

- Different WebSocket behavior in production?
- Apollo cache invalidation triggering refetch?
- Error in subscription causing reconnection?

#### Related

- May relate to real-time sync implementation

---

### Issue [#186](https://github.com/JoA-MoS/garage/issues/186): Per-Game Stats Configuration with Team Defaults

**Labels:** `enhancement`, `game-configuration`
**Priority:** High | **MVP Tier:** 🟡 Tier 2 (Should Have)
**Affects:** Game Creation, Game Settings

#### Description

Stats tracking configuration should be settable per-game, with team defaults. Different games may warrant different tracking levels (e.g., track more for league games, less for scrimmages).

#### Current State

- `TeamConfiguration.statsTrackingLevel` exists (FULL, SCORER_ONLY, GOALS_ONLY) ✅
- This is team-wide, cannot be overridden per game

#### Proposed Changes

**Extend `Game` entity:**

```typescript
// Add to game.entity.ts
@Column({
  type: 'varchar',
  length: 20,
  nullable: true, // null = use team default
})
statsTrackingLevel?: StatsTrackingLevel;

// Feature toggles can also be per-game
@Column({ type: 'json', nullable: true })
statsFeatureOverrides?: {
  trackSubstitutions?: boolean;
  trackPossession?: boolean;
  // ... etc
};
```

**Additionally, support different tracking for each team in a game:**

```typescript
// Add to game-team.entity.ts
@Column({
  type: 'varchar',
  length: 20,
  nullable: true,
})
statsTrackingLevel?: StatsTrackingLevel;
```

#### Use Case Example

> "For our team, I want to record scorer and assister, but for the opponent I'll just record goals."

This requires `GameTeam.statsTrackingLevel` to override per-team-per-game.

#### Acceptance Criteria

- [ ] Game creation form shows stats config inherited from team defaults
- [ ] User can override stats config when creating/editing game
- [ ] Each team in a game can have different tracking level
- [ ] UI adapts goal recording form based on team's tracking level
- [ ] Team defaults apply when no override specified

#### Related

- Extends #102 (Feature Toggles)
- Uses existing `TeamConfiguration` as defaults

---

### Issue [#187](https://github.com/JoA-MoS/garage/issues/187): Sticky Score Header When Scrolling

**Labels:** `enhancement`, `ux`, `mobile`
**Priority:** Medium | **MVP Tier:** 🟡 Tier 2 (Should Have)
**Affects:** Game Page UI

#### Description

When scrolling down on the game page, the game clock and score should stick to the top of the page in a compact format, providing constant visibility of the game state.

#### Current Behavior

Score and clock scroll off screen when viewing lineup or events below.

#### Expected Behavior

When user scrolls past the header:

- Header transforms to sticky compact mode
- Single row format: `[Team 1 Score] | [Clock] | [Team 2 Score]`
- Quick action buttons (Goal for each team) remain accessible
- Tapping sticky header scrolls back to top

#### Mockup

**Normal Header:**

```
┌─────────────────────────────────┐
│    Thunder FC                   │
│       ⚽⚽⚽                       │
│        3                        │
│                                 │
│      23:45                      │
│      1st Half                   │
│                                 │
│        1                        │
│       ⚽                        │
│   Blue Dragons                  │
└─────────────────────────────────┘
```

**Sticky Header (when scrolled):**

```
┌─────────────────────────────────┐
│ Thunder 3 | 23:45 1H | Dragons 1│
│ [+ Goal]            [+ Goal]   │
└─────────────────────────────────┘
```

#### Acceptance Criteria

- [ ] Score and clock stick to top when scrolling past threshold
- [ ] Compact format shows both teams, scores, and time
- [ ] Quick action buttons for recording goals (one per team)
- [ ] Smooth transition animation between modes
- [ ] Works correctly on mobile and desktop
- [ ] Tapping sticky header scrolls to top

#### Technical Notes

- Use CSS `position: sticky` or Intersection Observer
- May need to track scroll position for smooth transitions
- Ensure touch targets are large enough on mobile (44px min)

---

### Issue [#188](https://github.com/JoA-MoS/garage/issues/188): Player Photos and Field Quick View

**Labels:** `enhancement`, `new-feature`, `parent-ux`
**Priority:** Low | **MVP Tier:** ⚪ Tier 4 (Post-MVP)
**Affects:** Roster, Game View

#### Description

Allow uploading player photos and provide a "field view" that shows player photos and names for parents/spectators to quickly identify who is on the field.

#### Use Case

> Parents watching a game want to quickly identify players and learn their names based on appearance. A visual reference helps them cheer for teammates and learn the roster.

#### Features

1. **Player Photo Upload:** Profile photos for players
2. **Field Quick View:** Visual display of current lineup with photos

#### Field Quick View Mockup

```
┌─────────────────────────────────┐
│        Current Lineup           │
│                                 │
│           [📷]                  │
│          Jordan                 │
│            GK                   │
│                                 │
│    [📷]   [📷]   [📷]   [📷]    │
│   Alex   Casey  Riley  Morgan   │
│    LB     CB     CB     RB      │
│                                 │
│    [📷]   [📷]   [📷]   [📷]    │
│   Jamie  Quinn  Taylor Avery    │
│    LM     CM     CM     RM      │
│                                 │
│         [📷]   [📷]             │
│        Dylan  Parker            │
│          ST     ST              │
└─────────────────────────────────┘
```

#### Implementation

**Extend `User` entity:**

```typescript
@Column({ nullable: true })
photoUrl?: string;

@Column({ nullable: true })
thumbnailUrl?: string;
```

**New UI Component:** `FieldQuickView.presentation.tsx`

- Takes current lineup data
- Renders players in formation shape
- Shows photo, name, and position for each

#### Acceptance Criteria

- [ ] Players can have profile photos uploaded
- [ ] Photos display on roster page
- [ ] Field Quick View accessible during active games
- [ ] Formation layout adjusts to team's formation setting
- [ ] Photos have placeholder for missing images
- [ ] Mobile optimized (tappable to see larger photo)
- [ ] Privacy respects `lastNameVisibility` setting

#### Technical Notes

- Image upload similar to #103 (Media Uploads)
- Thumbnail generation for performance
- Consider lazy loading for large rosters
- Formation positioning based on `TeamConfiguration.defaultFormation`

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

| Version | Date       | Changes                                                                                                                                                                                     |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1     | 2024-12-14 | Initial roadmap created                                                                                                                                                                     |
| 0.2     | 2024-12-15 | Added: Merge duplicate users, Fix team colors, Team member management, Code quality review                                                                                                  |
| 0.3     | 2024-12-15 | Added: PlayMetrics ICS game import feature                                                                                                                                                  |
| 0.4     | 2024-12-15 | Added: Navigation restructure for multi-team UX                                                                                                                                             |
| 0.5     | 2025-12-15 | Expanded: Team Access Management with 6 deliverables (Foundation, Ownership, Guards, Privacy, Parent Linking, Invitations)                                                                  |
| 0.6     | 2025-12-15 | Simplified: Replace Platform Admin role with Clerk's built-in impersonation feature                                                                                                         |
| 0.7     | 2025-12-30 | Added: Priority 5 - UX Enhancements (Issues #101-#110): Primary team positioning, feature toggles, media uploads, game summary, multi-team view, game invites, sticky header, player photos |
| 0.8     | 2025-12-30 | Added: MVP Prioritization section with 4 tiers, sprint planning, and tier badges on all Priority 5 issues                                                                                   |
