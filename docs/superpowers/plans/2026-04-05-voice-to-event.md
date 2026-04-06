# Voice-to-Event Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hands-free voice input to the soccer stats game page — speak events and an AI model converts them into game event mutations.

**Architecture:** Push-to-talk on the frontend captures speech via Web Speech API, sends the raw transcription to a new `interpretVoice` GraphQL mutation. The backend `VoiceInterpreterModule` builds game context from the DB, sends it + tool definitions to a swappable AI provider (Claude/OpenAI), then executes high-confidence tool calls via existing services. Low-confidence results are published via a new `voiceConfirmationRequested` subscription for user resolution.

**Tech Stack:** NestJS (backend module), Anthropic SDK + OpenAI SDK (AI providers), GraphQL subscriptions (PubSub), React + Web Speech API (frontend), Tailwind CSS (styling)

**Spec:** `docs/superpowers/specs/2026-04-05-voice-to-event-design.md`

---

## File Map

### Backend — New files

| File                                                                                          | Responsibility                                                                                                 |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.module.ts`             | Module declaration, provider factory for AI provider                                                           |
| `apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.resolver.ts`           | GraphQL mutations (`interpretVoice`, `resolveVoiceConfirmation`) + subscription (`voiceConfirmationRequested`) |
| `apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.service.ts`            | Orchestrator: builds context → calls AI → processes results → executes/publishes                               |
| `apps/soccer-stats/api/src/modules/voice-interpreter/providers/ai-provider.interface.ts`      | `AIProvider` interface, `InterpretRequest`, `ToolCallResult`, `ToolDefinition` types                           |
| `apps/soccer-stats/api/src/modules/voice-interpreter/providers/claude.provider.ts`            | Anthropic SDK implementation of `AIProvider`                                                                   |
| `apps/soccer-stats/api/src/modules/voice-interpreter/providers/openai.provider.ts`            | OpenAI SDK implementation of `AIProvider`                                                                      |
| `apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-definitions.ts`               | Tool schemas for each game event operation, filtered by game phase                                             |
| `apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-executor.ts`                  | Maps AI tool calls → existing service methods with auto-filled params                                          |
| `apps/soccer-stats/api/src/modules/voice-interpreter/tools/game-context.builder.ts`           | Queries DB for game state, roster, lineup, score — builds system prompt                                        |
| `apps/soccer-stats/api/src/modules/voice-interpreter/dto/interpret-voice.input.ts`            | `InterpretVoiceInput` GraphQL input type                                                                       |
| `apps/soccer-stats/api/src/modules/voice-interpreter/dto/resolve-voice-confirmation.input.ts` | `ResolveVoiceConfirmationInput` + `SelectedCandidateInput` GraphQL input types                                 |
| `apps/soccer-stats/api/src/modules/voice-interpreter/dto/voice-confirmation.output.ts`        | `VoiceConfirmationPayload`, `AmbiguousCandidate`, `CandidateOption` GraphQL output types                       |
| `apps/soccer-stats/api/src/modules/voice-interpreter/pending-confirmation.store.ts`           | In-memory Map with TTL for pending confirmations                                                               |

### Backend — Modified files

| File                                          | Change                          |
| --------------------------------------------- | ------------------------------- |
| `apps/soccer-stats/api/src/app/app.module.ts` | Import `VoiceInterpreterModule` |

### Backend — Test files

| File                                                                                     | Tests                                                 |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `apps/soccer-stats/api/src/modules/voice-interpreter/tools/game-context.builder.spec.ts` | Context builder produces correct prompt structure     |
| `apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-definitions.spec.ts`     | Tool filtering by game phase                          |
| `apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-executor.spec.ts`        | Dispatch to correct service methods, auto-fill params |
| `apps/soccer-stats/api/src/modules/voice-interpreter/providers/claude.provider.spec.ts`  | Translates to/from Anthropic API format               |
| `apps/soccer-stats/api/src/modules/voice-interpreter/providers/openai.provider.spec.ts`  | Translates to/from OpenAI API format                  |
| `apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.service.spec.ts`  | Orchestration: context → AI → execute/publish         |
| `apps/soccer-stats/api/src/modules/voice-interpreter/pending-confirmation.store.spec.ts` | Store, retrieve, TTL expiry                           |

### Frontend — New files

| File                                                                                    | Responsibility                                                                                                  |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `apps/soccer-stats/ui/src/app/components/smart/voice-input/use-voice-input.hook.ts`     | Web Speech API lifecycle, STT provider abstraction, mutation orchestration                                      |
| `apps/soccer-stats/ui/src/app/components/smart/voice-input/voice-input-button.tsx`      | Mic FAB with idle/listening/processing states                                                                   |
| `apps/soccer-stats/ui/src/app/components/smart/voice-input/voice-input-overlay.tsx`     | Listening bar with live transcription text                                                                      |
| `apps/soccer-stats/ui/src/app/components/smart/voice-input/voice-confirmation-card.tsx` | Ambiguous event resolution card                                                                                 |
| `apps/soccer-stats/ui/src/app/components/smart/voice-input/index.ts`                    | Barrel export                                                                                                   |
| `apps/soccer-stats/ui/src/app/services/voice-graphql.service.ts`                        | GraphQL documents: `INTERPRET_VOICE`, `RESOLVE_VOICE_CONFIRMATION`, `VOICE_CONFIRMATION_REQUESTED` subscription |

### Frontend — Modified files

| File                                               | Change                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `apps/soccer-stats/ui/src/app/pages/game.page.tsx` | Add voice input button, wire `voiceConfirmationRequested` subscription alongside existing `gameEventChanged` |

---

## Task 1: AI Provider Interface & Types

**Files:**

- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/providers/ai-provider.interface.ts`

- [ ] **Step 1: Create the AI provider interface file**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/providers/ai-provider.interface.ts

/**
 * Common tool definition format. Both Claude and OpenAI providers translate
 * this into their native tool/function calling format.
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required: string[];
  };
}

/**
 * Request sent to the AI provider. The system prompt includes game context
 * (roster, field positions, game status, score) so the AI can interpret
 * spoken input accurately.
 */
export interface InterpretRequest {
  transcription: string;
  tools: ToolDefinition[];
  systemPrompt: string;
}

/**
 * A candidate option when a tool call parameter is ambiguous.
 * For example, "Jay scored" might match Jay S. (#7) or Jayden M. (#14).
 */
export interface AmbiguousParam {
  paramName: string;
  candidates: { id: string; name: string; confidence: number }[];
}

/**
 * A single tool call result from the AI provider.
 * Confidence is self-assessed by the model (0.0 - 1.0).
 */
export interface ToolCallResult {
  toolName: string;
  args: Record<string, unknown>;
  confidence: number;
  reasoning: string;
  ambiguousCandidates?: AmbiguousParam[];
}

/**
 * Common interface for AI providers. Implementations translate between
 * our ToolDefinition format and the provider's native format (Claude tool_use
 * vs OpenAI function calling).
 */
export interface AIProvider {
  readonly name: string;
  interpret(request: InterpretRequest): Promise<ToolCallResult[]>;
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `pnpm nx build soccer-stats-api --skip-nx-cache 2>&1 | tail -20`
Expected: Build succeeds (file is not imported yet, but should have no syntax errors)

- [ ] **Step 3: Commit**

```bash
git add apps/soccer-stats/api/src/modules/voice-interpreter/providers/ai-provider.interface.ts
git commit -m "feat(voice-interpreter): add AI provider interface and shared types"
```

---

## Task 2: Pending Confirmation Store

**Files:**

- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/pending-confirmation.store.ts`
- Test: `apps/soccer-stats/api/src/modules/voice-interpreter/pending-confirmation.store.spec.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/pending-confirmation.store.spec.ts
import { PendingConfirmationStore, PendingConfirmation } from './pending-confirmation.store';

describe('PendingConfirmationStore', () => {
  let store: PendingConfirmationStore;

  beforeEach(() => {
    store = new PendingConfirmationStore();
    jest.useFakeTimers();
  });

  afterEach(() => {
    store.destroy();
    jest.useRealTimers();
  });

  it('should store and retrieve a pending confirmation', () => {
    const confirmation: PendingConfirmation = {
      toolName: 'recordGoal',
      args: { scorerId: undefined },
      reasoning: 'Ambiguous: Jay or Jayden',
      ambiguousCandidates: [
        {
          paramName: 'scorerId',
          candidates: [
            { id: 'player-1', name: 'Jay S.', confidence: 0.6 },
            { id: 'player-2', name: 'Jayden M.', confidence: 0.5 },
          ],
        },
      ],
      gameId: 'game-123',
      gameTeamId: 'gt-456',
      userId: 'user-789',
    };

    const id = store.add(confirmation);
    const retrieved = store.get(id);

    expect(retrieved).toBeDefined();
    expect(retrieved!.toolName).toBe('recordGoal');
    expect(retrieved!.gameId).toBe('game-123');
  });

  it('should return undefined for non-existent confirmation', () => {
    expect(store.get('non-existent')).toBeUndefined();
  });

  it('should remove a confirmation after retrieval via resolve', () => {
    const id = store.add({
      toolName: 'recordGoal',
      args: {},
      reasoning: 'test',
      ambiguousCandidates: [],
      gameId: 'g1',
      gameTeamId: 'gt1',
      userId: 'u1',
    });

    const resolved = store.resolve(id);
    expect(resolved).toBeDefined();
    expect(store.get(id)).toBeUndefined();
  });

  it('should expire confirmations after TTL', () => {
    const id = store.add({
      toolName: 'recordGoal',
      args: {},
      reasoning: 'test',
      ambiguousCandidates: [],
      gameId: 'g1',
      gameTeamId: 'gt1',
      userId: 'u1',
    });

    expect(store.get(id)).toBeDefined();

    // Advance past TTL (60 seconds)
    jest.advanceTimersByTime(61_000);

    expect(store.get(id)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test soccer-stats-api --testPathPattern=pending-confirmation.store --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/pending-confirmation.store.ts
import { randomUUID } from 'crypto';

import { Injectable, OnModuleDestroy } from '@nestjs/common';

import type { AmbiguousParam } from './providers/ai-provider.interface';

export interface PendingConfirmation {
  toolName: string;
  args: Record<string, unknown>;
  reasoning: string;
  ambiguousCandidates: AmbiguousParam[];
  gameId: string;
  gameTeamId: string;
  userId: string;
}

interface StoredConfirmation extends PendingConfirmation {
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60_000; // 60 seconds

@Injectable()
export class PendingConfirmationStore implements OnModuleDestroy {
  private readonly store = new Map<string, StoredConfirmation>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Cleanup expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 30_000);
  }

  onModuleDestroy() {
    this.destroy();
  }

  add(confirmation: PendingConfirmation): string {
    const id = randomUUID();
    this.store.set(id, {
      ...confirmation,
      expiresAt: Date.now() + DEFAULT_TTL_MS,
    });
    return id;
  }

  get(id: string): PendingConfirmation | undefined {
    const entry = this.store.get(id);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(id);
      return undefined;
    }
    return entry;
  }

  resolve(id: string): PendingConfirmation | undefined {
    const entry = this.get(id);
    if (entry) {
      this.store.delete(id);
    }
    return entry;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }

  private cleanup() {
    const now = Date.now();
    for (const [id, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(id);
      }
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test soccer-stats-api --testPathPattern=pending-confirmation.store --no-cache`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/modules/voice-interpreter/pending-confirmation.store.ts \
        apps/soccer-stats/api/src/modules/voice-interpreter/pending-confirmation.store.spec.ts
git commit -m "feat(voice-interpreter): add pending confirmation store with TTL"
```

---

## Task 3: Game Context Builder

**Files:**

- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/tools/game-context.builder.ts`
- Test: `apps/soccer-stats/api/src/modules/voice-interpreter/tools/game-context.builder.spec.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/tools/game-context.builder.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { GameTeam } from '../../../entities/game-team.entity';
import { Game, GameStatus } from '../../../entities/game.entity';
import { GameEvent } from '../../../entities/game-event.entity';
import { StatsTrackingLevel } from '../../../entities/team-configuration.entity';

import { GameContextBuilder, GameContext } from './game-context.builder';

describe('GameContextBuilder', () => {
  let builder: GameContextBuilder;

  const mockGameTeam: Partial<GameTeam> = {
    id: 'gt-1',
    gameId: 'game-1',
    teamId: 'team-1',
    teamType: 'home',
    formation: '4-3-3',
    statsTrackingLevel: StatsTrackingLevel.Full,
    team: { id: 'team-1', name: 'Thunderbolts' } as any,
    game: {
      id: 'game-1',
      status: GameStatus.FIRST_HALF,
      actualStart: new Date('2026-04-05T10:00:00Z'),
      pausedAt: null,
      statsTrackingLevel: null,
      teams: [],
    } as any,
  };

  const mockLineupPlayers = [
    {
      gameEventId: 'evt-1',
      playerId: 'p-1',
      firstName: 'Brayden',
      lastName: 'Smith',
      position: 'ST',
      isOnField: true,
    },
    {
      gameEventId: 'evt-2',
      playerId: 'p-2',
      firstName: 'Deacon',
      lastName: 'Miller',
      position: 'CM',
      isOnField: true,
    },
    {
      gameEventId: 'evt-3',
      playerId: 'p-3',
      firstName: 'Sky',
      lastName: 'Wilson',
      position: null,
      isOnField: false,
    },
  ];

  const mockGameEventsService = {
    getGameLineup: jest.fn().mockResolvedValue({
      gameTeamId: 'gt-1',
      formation: '4-3-3',
      currentOnField: mockLineupPlayers.filter((p) => p.isOnField),
      bench: mockLineupPlayers.filter((p) => !p.isOnField),
      starters: [],
      gameRoster: mockLineupPlayers,
    }),
    findEventsByGameTeam: jest.fn().mockResolvedValue([]),
  };

  const mockGameTeamsRepository = {
    findOne: jest.fn().mockResolvedValue(mockGameTeam),
  };

  const mockGamesRepository = {
    findOne: jest.fn().mockResolvedValue(mockGameTeam.game),
  };

  const mockGameEventsRepository = {
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameContextBuilder, { provide: 'GameEventsService', useValue: mockGameEventsService }, { provide: getRepositoryToken(GameTeam), useValue: mockGameTeamsRepository }, { provide: getRepositoryToken(Game), useValue: mockGamesRepository }, { provide: getRepositoryToken(GameEvent), useValue: mockGameEventsRepository }],
    }).compile();

    builder = module.get(GameContextBuilder);
  });

  it('should build context with game state and roster', async () => {
    const context = await builder.build('gt-1', 'user-1');

    expect(context.gameId).toBe('game-1');
    expect(context.gameTeamId).toBe('gt-1');
    expect(context.gameStatus).toBe(GameStatus.FIRST_HALF);
    expect(context.teamName).toBe('Thunderbolts');
    expect(context.userId).toBe('user-1');
  });

  it('should include on-field players with event IDs', async () => {
    const context = await builder.build('gt-1', 'user-1');

    expect(context.onFieldPlayers).toHaveLength(2);
    expect(context.onFieldPlayers[0]).toEqual({
      playerId: 'p-1',
      eventId: 'evt-1',
      name: 'Brayden Smith',
      firstName: 'Brayden',
      lastName: 'Smith',
      position: 'ST',
    });
  });

  it('should include bench players', async () => {
    const context = await builder.build('gt-1', 'user-1');

    expect(context.benchPlayers).toHaveLength(1);
    expect(context.benchPlayers[0].name).toBe('Sky Wilson');
  });

  it('should build a system prompt string', async () => {
    const context = await builder.build('gt-1', 'user-1');
    const prompt = builder.buildSystemPrompt(context);

    expect(prompt).toContain('CURRENT GAME STATE');
    expect(prompt).toContain('FIRST_HALF');
    expect(prompt).toContain('Thunderbolts');
    expect(prompt).toContain('Brayden Smith');
    expect(prompt).toContain('Sky Wilson');
    expect(prompt).toContain('ON FIELD');
    expect(prompt).toContain('ON BENCH');
  });

  it('should include stats tracking level in context', async () => {
    const context = await builder.build('gt-1', 'user-1');

    expect(context.statsTrackingLevel).toBe(StatsTrackingLevel.Full);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test soccer-stats-api --testPathPattern=game-context.builder --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/tools/game-context.builder.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GameTeam } from '../../../entities/game-team.entity';
import { Game, GameStatus } from '../../../entities/game.entity';
import { GameEvent } from '../../../entities/game-event.entity';
import { StatsTrackingLevel } from '../../../entities/team-configuration.entity';
import { GameEventsService } from '../../game-events/game-events.service';

export interface ContextPlayer {
  playerId: string;
  eventId: string;
  name: string;
  firstName: string;
  lastName: string;
  position?: string;
  jerseyNumber?: string;
  externalPlayerName?: string;
  externalPlayerNumber?: string;
}

export interface GameContext {
  gameId: string;
  gameTeamId: string;
  userId: string;
  gameStatus: GameStatus;
  statsTrackingLevel: StatsTrackingLevel;
  teamName: string;
  currentPeriod: string;
  currentPeriodSecond: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  formation?: string;
  onFieldPlayers: ContextPlayer[];
  benchPlayers: ContextPlayer[];
  recentEvents: { eventType: string; playerName: string; description?: string }[];
}

@Injectable()
export class GameContextBuilder {
  constructor(
    @Inject('GameEventsService')
    private readonly gameEventsService: GameEventsService,
    @InjectRepository(GameTeam)
    private readonly gameTeamsRepository: Repository<GameTeam>,
    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,
    @InjectRepository(GameEvent)
    private readonly gameEventsRepository: Repository<GameEvent>,
  ) {}

  async build(gameTeamId: string, userId: string): Promise<GameContext> {
    // Load game team with relations
    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: gameTeamId },
      relations: ['team', 'game', 'game.teams', 'game.teams.team'],
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${gameTeamId} not found`);
    }

    const game = gameTeam.game;

    // Get current lineup via existing service
    const lineup = await this.gameEventsService.getGameLineup(gameTeamId);

    // Determine stats tracking level (cascade: gameTeam > game > default)
    const statsTrackingLevel = gameTeam.statsTrackingLevel ?? game.statsTrackingLevel ?? StatsTrackingLevel.Full;

    // Determine current period from game status
    const currentPeriod = this.inferCurrentPeriod(game.status);

    // Calculate period seconds from game start/timestamps
    const currentPeriodSecond = this.calculatePeriodSecond(game);

    // Determine scores from game teams
    const homeTeam = game.teams?.find((t) => t.teamType === 'home');
    const awayTeam = game.teams?.find((t) => t.teamType === 'away');

    // Count goals for score
    const homeScore = homeTeam?.finalScore ?? 0;
    const awayScore = awayTeam?.finalScore ?? 0;

    // Map on-field players
    const onFieldPlayers: ContextPlayer[] = lineup.currentOnField.map((p) => ({
      playerId: p.playerId ?? '',
      eventId: p.gameEventId,
      name: p.playerName ?? p.externalPlayerName ?? 'Unknown',
      firstName: p.firstName ?? '',
      lastName: p.lastName ?? '',
      position: p.position ?? undefined,
      externalPlayerName: p.externalPlayerName ?? undefined,
      externalPlayerNumber: p.externalPlayerNumber ?? undefined,
    }));

    // Map bench players
    const benchPlayers: ContextPlayer[] = lineup.bench.map((p) => ({
      playerId: p.playerId ?? '',
      eventId: p.gameEventId,
      name: p.playerName ?? p.externalPlayerName ?? 'Unknown',
      firstName: p.firstName ?? '',
      lastName: p.lastName ?? '',
      position: p.position ?? undefined,
      externalPlayerName: p.externalPlayerName ?? undefined,
      externalPlayerNumber: p.externalPlayerNumber ?? undefined,
    }));

    // Get recent events for context
    const recentGameEvents = await this.gameEventsRepository.find({
      where: { gameTeamId },
      relations: ['eventType', 'player'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const recentEvents = recentGameEvents.map((e) => ({
      eventType: e.eventType?.name ?? 'UNKNOWN',
      playerName: e.player ? `${e.player.firstName} ${e.player.lastName}` : (e.externalPlayerName ?? 'Unknown'),
      description: e.description ?? undefined,
    }));

    return {
      gameId: game.id,
      gameTeamId,
      userId,
      gameStatus: game.status,
      statsTrackingLevel,
      teamName: gameTeam.team?.name ?? 'Unknown Team',
      currentPeriod,
      currentPeriodSecond,
      homeTeamName: homeTeam?.team?.name ?? 'Home',
      awayTeamName: awayTeam?.team?.name ?? 'Away',
      homeScore,
      awayScore,
      formation: lineup.formation ?? undefined,
      onFieldPlayers,
      benchPlayers,
      recentEvents,
    };
  }

  buildSystemPrompt(context: GameContext): string {
    const onFieldLines = context.onFieldPlayers
      .map((p) => {
        const name = p.externalPlayerName ?? `${p.firstName} ${p.lastName}`;
        const num = p.externalPlayerNumber ? `#${p.externalPlayerNumber} ` : '';
        const pos = p.position ? ` — ${p.position}` : '';
        return `  ${num}${name}${pos} [eventId: ${p.eventId}]`;
      })
      .join('\n');

    const benchLines = context.benchPlayers
      .map((p) => {
        const name = p.externalPlayerName ?? `${p.firstName} ${p.lastName}`;
        const num = p.externalPlayerNumber ? `#${p.externalPlayerNumber} ` : '';
        return `  ${num}${name} [playerId: ${p.playerId}]`;
      })
      .join('\n');

    const recentLines = context.recentEvents.length > 0 ? context.recentEvents.map((e) => `  ${e.eventType}: ${e.playerName}`).join('\n') : '  (none)';

    return `You are a soccer game event interpreter for a youth soccer statistics tracking app.

Convert the user's spoken input into tool calls that record game events. You may
return multiple tool calls for a single utterance.

CURRENT GAME STATE:
- Game Status: ${context.gameStatus}
- Period: ${context.currentPeriod}
- Clock: ${this.formatClock(context.currentPeriodSecond)}
- Score: ${context.homeTeamName} ${context.homeScore} - ${context.awayScore} ${context.awayTeamName}
- Stats Tracking Level: ${context.statsTrackingLevel} (FULL = positions required, SCORER_ONLY/GOALS_ONLY = no positions needed)
- Formation: ${context.formation ?? 'not set'}

ROSTER (${context.teamName}):
ON FIELD:
${onFieldLines || '  (empty)'}

ON BENCH:
${benchLines || '  (empty)'}

RECENT EVENTS:
${recentLines}

RULES:
- Match player names using fuzzy matching. Speech-to-text WILL mangle
  names. Always match against the roster above — the roster is the source
  of truth for player names.
- For on-field players, use the eventId shown in brackets for any tool
  calls that require playerOutEventId or playerEventId.
- For bench players, use the playerId shown in brackets for tool calls
  that require playerId (e.g., bringing a player onto the field).
- If multiple players could match a spoken name, set confidence below 0.8
  and include all candidates in ambiguousCandidates.
- One utterance may describe multiple events. Return a separate tool call
  for each. Expand batch operations ("everyone on the bench comes on")
  into individual tool calls using the roster context.
- SUBSTITUTION DIRECTION: When the user says "X for Y", check who is
  currently ON FIELD vs ON BENCH to determine who is coming on and who
  is going off. Do NOT rely on word order alone.
- BATCH SUB SHORTCUT: If the number of players coming off equals the
  number on the bench, assume all bench players are coming on.
- TRACKING LEVEL: When stats tracking level is FULL, substitutions
  require explicit pairing (who replaces whom) and positions. When
  SCORER_ONLY or GOALS_ONLY, players can go on/off independently
  without pairing or positions.
- Use game state to infer event type:
  - Pre-game: player names + positions = roster additions
  - In-game: "X on for Y" = substitution
  - In-game: "X scored" = goal
  - "start first half" / "end period" = game flow events
  - "current score is X to Y" = opponent goal events if score changed
  - Corrections ("for Brayden" after a goal) = update previous event
- The system auto-fills gameTeamId, period, and periodSecond. Do not
  include these in your tool call arguments.
- Set confidence 0.0-1.0 for each tool call reflecting how certain you
  are about the interpretation.
- Include a brief reasoning string explaining your interpretation.`;
  }

  private inferCurrentPeriod(status: GameStatus): string {
    switch (status) {
      case GameStatus.FIRST_HALF:
      case GameStatus.IN_PROGRESS:
        return '1';
      case GameStatus.HALFTIME:
        return 'HT';
      case GameStatus.SECOND_HALF:
        return '2';
      default:
        return '0';
    }
  }

  private calculatePeriodSecond(game: Game): number {
    // If game hasn't started or is paused, return 0
    if (!game.actualStart || game.pausedAt) return 0;

    const now = new Date();
    const periodStart = game.status === GameStatus.SECOND_HALF && game.secondHalfStart ? game.secondHalfStart : game.actualStart;

    const elapsed = Math.floor((now.getTime() - periodStart.getTime()) / 1000);
    return Math.max(0, Math.min(elapsed, 5999));
  }

  private formatClock(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test soccer-stats-api --testPathPattern=game-context.builder --no-cache`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/modules/voice-interpreter/tools/game-context.builder.ts \
        apps/soccer-stats/api/src/modules/voice-interpreter/tools/game-context.builder.spec.ts
git commit -m "feat(voice-interpreter): add game context builder for AI prompt"
```

---

## Task 4: Tool Definitions

**Files:**

- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-definitions.ts`
- Test: `apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-definitions.spec.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-definitions.spec.ts
import { GameStatus } from '../../../entities/game.entity';

import { getToolsForGamePhase } from './tool-definitions';

describe('getToolsForGamePhase', () => {
  it('should return lineup tools for SCHEDULED status', () => {
    const tools = getToolsForGamePhase(GameStatus.SCHEDULED);
    const names = tools.map((t) => t.name);

    expect(names).toContain('addPlayerToRoster');
    expect(names).not.toContain('recordGoal');
    expect(names).not.toContain('substitutePlayer');
  });

  it('should return in-game tools for FIRST_HALF status', () => {
    const tools = getToolsForGamePhase(GameStatus.FIRST_HALF);
    const names = tools.map((t) => t.name);

    expect(names).toContain('recordGoal');
    expect(names).toContain('substitutePlayer');
    expect(names).toContain('bringPlayerOntoField');
    expect(names).toContain('removePlayerFromField');
    expect(names).toContain('swapPositions');
    expect(names).toContain('recordFormationChange');
    expect(names).toContain('startPeriod');
    expect(names).toContain('endPeriod');
  });

  it('should return in-game tools for SECOND_HALF status', () => {
    const tools = getToolsForGamePhase(GameStatus.SECOND_HALF);
    const names = tools.map((t) => t.name);

    expect(names).toContain('recordGoal');
    expect(names).toContain('substitutePlayer');
  });

  it('should return halftime tools for HALFTIME status', () => {
    const tools = getToolsForGamePhase(GameStatus.HALFTIME);
    const names = tools.map((t) => t.name);

    expect(names).toContain('bringPlayerOntoField');
    expect(names).toContain('removePlayerFromField');
    expect(names).toContain('startPeriod');
    // Goals should NOT be available at halftime
    expect(names).not.toContain('recordGoal');
  });

  it('should always include recordPositionChange', () => {
    const scheduled = getToolsForGamePhase(GameStatus.SCHEDULED);
    const firstHalf = getToolsForGamePhase(GameStatus.FIRST_HALF);

    expect(scheduled.map((t) => t.name)).toContain('recordPositionChange');
    expect(firstHalf.map((t) => t.name)).toContain('recordPositionChange');
  });

  it('should return no tools for COMPLETED status', () => {
    const tools = getToolsForGamePhase(GameStatus.COMPLETED);
    expect(tools).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test soccer-stats-api --testPathPattern=tool-definitions --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-definitions.ts
import { GameStatus } from '../../../entities/game.entity';
import type { ToolDefinition } from '../providers/ai-provider.interface';

const addPlayerToRoster: ToolDefinition = {
  name: 'addPlayerToRoster',
  description: 'Add a player to the game roster. Without position = bench player. With position = planned starter.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'Player ID for managed roster player',
      },
      position: {
        type: 'string',
        description: 'Position if player is a planned starter (e.g., "CM", "ST", "GK"). Omit for bench.',
      },
    },
    required: ['playerId'],
  },
};

const recordGoal: ToolDefinition = {
  name: 'recordGoal',
  description: 'Record a goal. Scorer can be a managed player (scorerId) or external player (externalScorerName). Assist is optional.',
  parameters: {
    type: 'object',
    properties: {
      scorerId: {
        type: 'string',
        description: 'Player ID of the managed-team scorer',
      },
      externalScorerName: {
        type: 'string',
        description: 'Name of external/opponent scorer',
      },
      assisterId: {
        type: 'string',
        description: 'Player ID of the managed-team assister',
      },
      externalAssisterName: {
        type: 'string',
        description: 'Name of external/opponent assister',
      },
    },
    required: [],
  },
};

const substitutePlayer: ToolDefinition = {
  name: 'substitutePlayer',
  description: "Substitute one player for another. Requires the on-field player's event ID (playerOutEventId) and the incoming player's ID (playerInId).",
  parameters: {
    type: 'object',
    properties: {
      playerOutEventId: {
        type: 'string',
        description: 'The GameEvent ID of the player currently on field (from the ON FIELD list eventId)',
      },
      playerInId: {
        type: 'string',
        description: 'Player ID of the player coming on from bench',
      },
      externalPlayerInName: {
        type: 'string',
        description: 'External player name if substituting in an opponent player',
      },
    },
    required: ['playerOutEventId'],
  },
};

const bringPlayerOntoField: ToolDefinition = {
  name: 'bringPlayerOntoField',
  description: 'Bring a player onto the field (SUBSTITUTION_IN without a paired out). Used for late arrivals or halftime lineup changes.',
  parameters: {
    type: 'object',
    properties: {
      playerId: {
        type: 'string',
        description: 'Player ID for managed roster player',
      },
      externalPlayerName: {
        type: 'string',
        description: 'External player name (for opponents)',
      },
      position: {
        type: 'string',
        description: 'Position for the player (e.g., "CM", "ST", "GK")',
      },
    },
    required: ['position'],
  },
};

const removePlayerFromField: ToolDefinition = {
  name: 'removePlayerFromField',
  description: "Remove a player from the field without replacement. Requires the on-field player's event ID.",
  parameters: {
    type: 'object',
    properties: {
      playerEventId: {
        type: 'string',
        description: 'The GameEvent ID of the player to remove (from the ON FIELD list eventId)',
      },
    },
    required: ['playerEventId'],
  },
};

const swapPositions: ToolDefinition = {
  name: 'swapPositions',
  description: "Swap positions of two on-field players. Requires both players' event IDs.",
  parameters: {
    type: 'object',
    properties: {
      player1EventId: {
        type: 'string',
        description: 'GameEvent ID of the first player',
      },
      player2EventId: {
        type: 'string',
        description: 'GameEvent ID of the second player',
      },
    },
    required: ['player1EventId', 'player2EventId'],
  },
};

const recordFormationChange: ToolDefinition = {
  name: 'recordFormationChange',
  description: 'Record a formation change (e.g., "4-3-3", "3-5-2").',
  parameters: {
    type: 'object',
    properties: {
      formation: {
        type: 'string',
        description: 'Formation code (e.g., "4-3-3", "3-5-2")',
      },
    },
    required: ['formation'],
  },
};

const recordPositionChange: ToolDefinition = {
  name: 'recordPositionChange',
  description: 'Record a position change for a player already on the field.',
  parameters: {
    type: 'object',
    properties: {
      playerEventId: {
        type: 'string',
        description: 'GameEvent ID of the player changing position',
      },
      newPosition: {
        type: 'string',
        description: 'New position (e.g., "CM", "ST", "GK")',
      },
    },
    required: ['playerEventId', 'newPosition'],
  },
};

const startPeriod: ToolDefinition = {
  name: 'startPeriod',
  description: 'Start a period. Creates PERIOD_START event and SUB_IN events for the lineup.',
  parameters: {
    type: 'object',
    properties: {
      period: {
        type: 'string',
        description: 'Period identifier (e.g., "1", "2", "OT1")',
      },
    },
    required: ['period'],
  },
};

const endPeriod: ToolDefinition = {
  name: 'endPeriod',
  description: 'End a period. Creates PERIOD_END event and SUB_OUT events for all on-field players.',
  parameters: {
    type: 'object',
    properties: {
      period: {
        type: 'string',
        description: 'Period identifier to end (e.g., "1", "2", "OT1")',
      },
    },
    required: ['period'],
  },
};

const PREGAME_TOOLS = [addPlayerToRoster, recordPositionChange];
const IN_GAME_TOOLS = [recordGoal, substitutePlayer, bringPlayerOntoField, removePlayerFromField, swapPositions, recordFormationChange, recordPositionChange, startPeriod, endPeriod];
const HALFTIME_TOOLS = [bringPlayerOntoField, removePlayerFromField, recordPositionChange, startPeriod, endPeriod];

export function getToolsForGamePhase(status: GameStatus): ToolDefinition[] {
  switch (status) {
    case GameStatus.SCHEDULED:
      return PREGAME_TOOLS;
    case GameStatus.FIRST_HALF:
    case GameStatus.SECOND_HALF:
    case GameStatus.IN_PROGRESS:
      return IN_GAME_TOOLS;
    case GameStatus.HALFTIME:
      return HALFTIME_TOOLS;
    case GameStatus.COMPLETED:
    case GameStatus.CANCELLED:
      return [];
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test soccer-stats-api --testPathPattern=tool-definitions --no-cache`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-definitions.ts \
        apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-definitions.spec.ts
git commit -m "feat(voice-interpreter): add tool definitions with game-phase filtering"
```

---

## Task 5: Tool Executor

**Files:**

- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-executor.ts`
- Test: `apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-executor.spec.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-executor.spec.ts
import { GameStatus } from '../../../entities/game.entity';
import { StatsTrackingLevel } from '../../../entities/team-configuration.entity';

import { ToolExecutor } from './tool-executor';
import type { GameContext } from './game-context.builder';
import type { ToolCallResult } from '../providers/ai-provider.interface';

describe('ToolExecutor', () => {
  let executor: ToolExecutor;

  const mockGameEventsService = {
    recordGoal: jest.fn().mockResolvedValue({ id: 'evt-goal-1' }),
    substitutePlayer: jest.fn().mockResolvedValue([{ id: 'evt-sub-1' }]),
    bringPlayerOntoField: jest.fn().mockResolvedValue({ id: 'evt-bring-1' }),
    removePlayerFromField: jest.fn().mockResolvedValue({ id: 'evt-remove-1' }),
    swapPositions: jest.fn().mockResolvedValue([{ id: 'evt-swap-1' }]),
    recordFormationChange: jest.fn().mockResolvedValue({ id: 'evt-form-1' }),
    recordPositionChange: jest.fn().mockResolvedValue({ id: 'evt-pos-1' }),
    addPlayerToGameRoster: jest.fn().mockResolvedValue({ id: 'evt-roster-1' }),
    startPeriod: jest.fn().mockResolvedValue({ events: [{ id: 'evt-period-1' }] }),
    endPeriod: jest.fn().mockResolvedValue({ events: [{ id: 'evt-period-2' }] }),
    updateGoal: jest.fn().mockResolvedValue({ id: 'evt-goal-updated' }),
  };

  const baseContext: GameContext = {
    gameId: 'game-1',
    gameTeamId: 'gt-1',
    userId: 'user-1',
    gameStatus: GameStatus.FIRST_HALF,
    statsTrackingLevel: StatsTrackingLevel.Full,
    teamName: 'Thunderbolts',
    currentPeriod: '1',
    currentPeriodSecond: 600,
    homeTeamName: 'Thunderbolts',
    awayTeamName: 'Opponents',
    homeScore: 0,
    awayScore: 0,
    onFieldPlayers: [],
    benchPlayers: [],
    recentEvents: [],
  };

  beforeEach(() => {
    executor = new ToolExecutor(mockGameEventsService as any);
    jest.clearAllMocks();
  });

  it('should execute recordGoal with auto-filled params', async () => {
    const toolCall: ToolCallResult = {
      toolName: 'recordGoal',
      args: { scorerId: 'p-1', assisterId: 'p-2' },
      confidence: 0.95,
      reasoning: 'Brayden scored, assist Deacon',
    };

    await executor.execute(toolCall, baseContext);

    expect(mockGameEventsService.recordGoal).toHaveBeenCalledWith(
      {
        scorerId: 'p-1',
        assisterId: 'p-2',
        gameTeamId: 'gt-1',
        period: '1',
        periodSecond: 600,
      },
      'user-1',
    );
  });

  it('should execute substitutePlayer with auto-filled params', async () => {
    const toolCall: ToolCallResult = {
      toolName: 'substitutePlayer',
      args: { playerOutEventId: 'evt-1', playerInId: 'p-3' },
      confidence: 0.9,
      reasoning: 'Sky on for Brayden',
    };

    await executor.execute(toolCall, baseContext);

    expect(mockGameEventsService.substitutePlayer).toHaveBeenCalledWith(
      {
        playerOutEventId: 'evt-1',
        playerInId: 'p-3',
        gameTeamId: 'gt-1',
        period: '1',
        periodSecond: 600,
      },
      'user-1',
    );
  });

  it('should throw for unknown tool name', async () => {
    const toolCall: ToolCallResult = {
      toolName: 'unknownTool',
      args: {},
      confidence: 0.9,
      reasoning: 'test',
    };

    await expect(executor.execute(toolCall, baseContext)).rejects.toThrow('Unknown tool: unknownTool');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test soccer-stats-api --testPathPattern=tool-executor --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-executor.ts
import { Injectable, Inject, BadRequestException } from '@nestjs/common';

import { GameEvent } from '../../../entities/game-event.entity';
import { GameEventsService } from '../../game-events/game-events.service';
import type { PeriodResult } from '../../game-events/dto/period-result.output';
import type { ToolCallResult } from '../providers/ai-provider.interface';
import type { GameContext } from './game-context.builder';

type ExecuteResult = GameEvent | GameEvent[] | PeriodResult | boolean;

@Injectable()
export class ToolExecutor {
  constructor(
    @Inject('GameEventsService')
    private readonly gameEventsService: GameEventsService,
  ) {}

  async execute(toolCall: ToolCallResult, context: GameContext): Promise<ExecuteResult> {
    const baseArgs = {
      gameTeamId: context.gameTeamId,
      period: context.currentPeriod,
      periodSecond: context.currentPeriodSecond,
    };

    switch (toolCall.toolName) {
      case 'recordGoal':
        return this.gameEventsService.recordGoal({ ...baseArgs, ...toolCall.args } as any, context.userId);

      case 'substitutePlayer':
        return this.gameEventsService.substitutePlayer({ ...baseArgs, ...toolCall.args } as any, context.userId);

      case 'bringPlayerOntoField':
        return this.gameEventsService.bringPlayerOntoField({ ...baseArgs, ...toolCall.args } as any, context.userId);

      case 'removePlayerFromField':
        return this.gameEventsService.removePlayerFromField({ ...baseArgs, ...toolCall.args } as any, context.userId);

      case 'swapPositions':
        return this.gameEventsService.swapPositions({ ...baseArgs, ...toolCall.args } as any, context.userId);

      case 'recordFormationChange':
        return this.gameEventsService.recordFormationChange({ ...baseArgs, ...toolCall.args } as any, context.userId);

      case 'recordPositionChange':
        return this.gameEventsService.recordPositionChange({ ...baseArgs, ...toolCall.args } as any, context.userId);

      case 'addPlayerToRoster':
        return this.gameEventsService.addPlayerToGameRoster({ gameTeamId: context.gameTeamId, ...toolCall.args } as any, context.userId);

      case 'startPeriod':
        return this.gameEventsService.startPeriod({ gameTeamId: context.gameTeamId, ...toolCall.args } as any, context.userId);

      case 'endPeriod':
        return this.gameEventsService.endPeriod({ gameTeamId: context.gameTeamId, ...toolCall.args } as any, context.userId);

      default:
        throw new BadRequestException(`Unknown tool: ${toolCall.toolName}`);
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test soccer-stats-api --testPathPattern=tool-executor --no-cache`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-executor.ts \
        apps/soccer-stats/api/src/modules/voice-interpreter/tools/tool-executor.spec.ts
git commit -m "feat(voice-interpreter): add tool executor dispatch layer"
```

---

## Task 6: Claude AI Provider

**Files:**

- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/providers/claude.provider.ts`
- Test: `apps/soccer-stats/api/src/modules/voice-interpreter/providers/claude.provider.spec.ts`

- [ ] **Step 1: Install Anthropic SDK**

Run: `pnpm add @anthropic-ai/sdk --filter soccer-stats-api`

Verify: `pnpm nx build soccer-stats-api --skip-nx-cache 2>&1 | tail -5`

- [ ] **Step 2: Write the failing tests**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/providers/claude.provider.spec.ts
import { ClaudeProvider } from './claude.provider';
import type { InterpretRequest, ToolDefinition } from './ai-provider.interface';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  })),
}));

import Anthropic from '@anthropic-ai/sdk';

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider;
  let mockCreate: jest.Mock;

  const sampleTool: ToolDefinition = {
    name: 'recordGoal',
    description: 'Record a goal',
    parameters: {
      type: 'object',
      properties: {
        scorerId: { type: 'string', description: 'Scorer player ID' },
      },
      required: ['scorerId'],
    },
  };

  const sampleRequest: InterpretRequest = {
    transcription: 'Brayden scored',
    tools: [sampleTool],
    systemPrompt: 'You are a soccer game event interpreter.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new ClaudeProvider('test-api-key', 'claude-sonnet-4-6');
    // Get the mock create function from the constructed client
    const clientInstance = (Anthropic as unknown as jest.Mock).mock.results[0]?.value;
    mockCreate = clientInstance?.messages?.create;
  });

  it('should have name "claude"', () => {
    expect(provider.name).toBe('claude');
  });

  it('should translate tool calls from Anthropic format to ToolCallResult', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          id: 'call-1',
          name: 'recordGoal',
          input: {
            scorerId: 'p-1',
            confidence: 0.95,
            reasoning: 'Only one Brayden on roster, clearly a goal',
          },
        },
      ],
    });

    const results = await provider.interpret(sampleRequest);

    expect(results).toHaveLength(1);
    expect(results[0].toolName).toBe('recordGoal');
    expect(results[0].args).toEqual({ scorerId: 'p-1' });
    expect(results[0].confidence).toBe(0.95);
    expect(results[0].reasoning).toBe('Only one Brayden on roster, clearly a goal');
  });

  it('should handle multiple tool calls in one response', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          id: 'call-1',
          name: 'substitutePlayer',
          input: {
            playerOutEventId: 'evt-1',
            playerInId: 'p-3',
            confidence: 0.9,
            reasoning: 'Brayden on for Deacon',
          },
        },
        {
          type: 'tool_use',
          id: 'call-2',
          name: 'substitutePlayer',
          input: {
            playerOutEventId: 'evt-2',
            playerInId: 'p-4',
            confidence: 0.85,
            reasoning: 'Allen on for Sky',
          },
        },
      ],
    });

    const results = await provider.interpret(sampleRequest);
    expect(results).toHaveLength(2);
  });

  it('should extract ambiguousCandidates when present', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          id: 'call-1',
          name: 'recordGoal',
          input: {
            scorerId: null,
            confidence: 0.5,
            reasoning: 'Jay could match multiple players',
            ambiguousCandidates: [
              {
                paramName: 'scorerId',
                candidates: [
                  { id: 'p-1', name: 'Jay S.', confidence: 0.6 },
                  { id: 'p-2', name: 'Jayden M.', confidence: 0.4 },
                ],
              },
            ],
          },
        },
      ],
    });

    const results = await provider.interpret(sampleRequest);
    expect(results[0].confidence).toBe(0.5);
    expect(results[0].ambiguousCandidates).toHaveLength(1);
    expect(results[0].ambiguousCandidates![0].candidates).toHaveLength(2);
  });

  it('should return empty array when no tool calls in response', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: "I couldn't understand that.",
        },
      ],
    });

    const results = await provider.interpret(sampleRequest);
    expect(results).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm nx test soccer-stats-api --testPathPattern=claude.provider --no-cache`
Expected: FAIL — module not found

- [ ] **Step 4: Write the implementation**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/providers/claude.provider.ts
import { Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

import type { AIProvider, InterpretRequest, ToolCallResult, ToolDefinition, AmbiguousParam } from './ai-provider.interface';

/**
 * Claude AI provider using Anthropic's tool_use feature.
 *
 * The provider instructs Claude to include confidence, reasoning, and
 * ambiguousCandidates as fields in the tool call input alongside the
 * actual arguments. These meta-fields are then extracted and separated
 * from the real args in the response processing.
 */
export class ClaudeProvider implements AIProvider {
  readonly name = 'claude';
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly logger = new Logger(ClaudeProvider.name);

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async interpret(request: InterpretRequest): Promise<ToolCallResult[]> {
    const tools = request.tools.map((tool) => this.toAnthropicTool(tool));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: request.systemPrompt,
      tools,
      messages: [
        {
          role: 'user',
          content: request.transcription,
        },
      ],
    });

    return this.extractToolCalls(response.content);
  }

  private toAnthropicTool(tool: ToolDefinition): Anthropic.Messages.Tool {
    // Add meta-fields (confidence, reasoning, ambiguousCandidates) to the
    // tool schema so Claude returns them alongside the real args
    const augmentedProperties = {
      ...tool.parameters.properties,
      confidence: {
        type: 'number' as const,
        description: 'Your confidence in this interpretation (0.0 to 1.0). Below 0.8 means ambiguous.',
      },
      reasoning: {
        type: 'string' as const,
        description: 'Brief explanation of why you chose this interpretation.',
      },
      ambiguousCandidates: {
        type: 'array' as const,
        description: 'When confidence < 0.8, list the ambiguous parameters and candidate matches.',
        items: {
          type: 'object' as const,
          properties: {
            paramName: { type: 'string' as const },
            candidates: {
              type: 'array' as const,
              items: {
                type: 'object' as const,
                properties: {
                  id: { type: 'string' as const },
                  name: { type: 'string' as const },
                  confidence: { type: 'number' as const },
                },
              },
            },
          },
        },
      },
    };

    return {
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object' as const,
        properties: augmentedProperties as Record<string, unknown>,
        required: [...tool.parameters.required, 'confidence', 'reasoning'],
      },
    };
  }

  private extractToolCalls(content: Anthropic.Messages.ContentBlock[]): ToolCallResult[] {
    return content
      .filter((block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use')
      .map((block) => {
        const input = block.input as Record<string, unknown>;

        // Extract meta-fields, everything else is the real args
        const { confidence, reasoning, ambiguousCandidates, ...args } = input;

        return {
          toolName: block.name,
          args,
          confidence: (confidence as number) ?? 0.5,
          reasoning: (reasoning as string) ?? '',
          ambiguousCandidates: (ambiguousCandidates as AmbiguousParam[] | undefined) ?? undefined,
        };
      });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test soccer-stats-api --testPathPattern=claude.provider --no-cache`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/soccer-stats/api/src/modules/voice-interpreter/providers/claude.provider.ts \
        apps/soccer-stats/api/src/modules/voice-interpreter/providers/claude.provider.spec.ts
git commit -m "feat(voice-interpreter): add Claude AI provider with tool_use"
```

---

## Task 7: OpenAI AI Provider

**Files:**

- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/providers/openai.provider.ts`
- Test: `apps/soccer-stats/api/src/modules/voice-interpreter/providers/openai.provider.spec.ts`

- [ ] **Step 1: Install OpenAI SDK**

Run: `pnpm add openai --filter soccer-stats-api`

- [ ] **Step 2: Write the failing tests**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/providers/openai.provider.spec.ts
import { OpenAIProvider } from './openai.provider';
import type { InterpretRequest, ToolDefinition } from './ai-provider.interface';

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

import OpenAI from 'openai';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let mockCreate: jest.Mock;

  const sampleTool: ToolDefinition = {
    name: 'recordGoal',
    description: 'Record a goal',
    parameters: {
      type: 'object',
      properties: {
        scorerId: { type: 'string', description: 'Scorer player ID' },
      },
      required: ['scorerId'],
    },
  };

  const sampleRequest: InterpretRequest = {
    transcription: 'Brayden scored',
    tools: [sampleTool],
    systemPrompt: 'You are a soccer game event interpreter.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OpenAIProvider('test-api-key', 'gpt-4o-mini');
    const clientInstance = (OpenAI as unknown as jest.Mock).mock.results[0]?.value;
    mockCreate = clientInstance?.chat?.completions?.create;
  });

  it('should have name "openai"', () => {
    expect(provider.name).toBe('openai');
  });

  it('should translate tool calls from OpenAI format to ToolCallResult', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            tool_calls: [
              {
                id: 'call-1',
                type: 'function',
                function: {
                  name: 'recordGoal',
                  arguments: JSON.stringify({
                    scorerId: 'p-1',
                    confidence: 0.95,
                    reasoning: 'Only one Brayden on roster',
                  }),
                },
              },
            ],
          },
        },
      ],
    });

    const results = await provider.interpret(sampleRequest);

    expect(results).toHaveLength(1);
    expect(results[0].toolName).toBe('recordGoal');
    expect(results[0].args).toEqual({ scorerId: 'p-1' });
    expect(results[0].confidence).toBe(0.95);
  });

  it('should return empty array when no tool calls', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Could not understand', tool_calls: null } }],
    });

    const results = await provider.interpret(sampleRequest);
    expect(results).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm nx test soccer-stats-api --testPathPattern=openai.provider --no-cache`
Expected: FAIL — module not found

- [ ] **Step 4: Write the implementation**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/providers/openai.provider.ts
import { Logger } from '@nestjs/common';
import OpenAI from 'openai';

import type { AIProvider, InterpretRequest, ToolCallResult, ToolDefinition, AmbiguousParam } from './ai-provider.interface';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(OpenAIProvider.name);

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async interpret(request: InterpretRequest): Promise<ToolCallResult[]> {
    const tools = request.tools.map((tool) => this.toOpenAITool(tool));

    const response = await this.client.chat.completions.create({
      model: this.model,
      tools,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.transcription },
      ],
    });

    const toolCalls = response.choices[0]?.message?.tool_calls;
    if (!toolCalls) return [];

    return toolCalls.map((tc) => {
      const parsed = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      const { confidence, reasoning, ambiguousCandidates, ...args } = parsed;

      return {
        toolName: tc.function.name,
        args,
        confidence: (confidence as number) ?? 0.5,
        reasoning: (reasoning as string) ?? '',
        ambiguousCandidates: (ambiguousCandidates as AmbiguousParam[] | undefined) ?? undefined,
      };
    });
  }

  private toOpenAITool(tool: ToolDefinition): OpenAI.Chat.Completions.ChatCompletionTool {
    const augmentedProperties = {
      ...tool.parameters.properties,
      confidence: {
        type: 'number' as const,
        description: 'Your confidence in this interpretation (0.0 to 1.0). Below 0.8 means ambiguous.',
      },
      reasoning: {
        type: 'string' as const,
        description: 'Brief explanation of why you chose this interpretation.',
      },
      ambiguousCandidates: {
        type: 'array' as const,
        description: 'When confidence < 0.8, list the ambiguous parameters and candidate matches.',
        items: {
          type: 'object' as const,
          properties: {
            paramName: { type: 'string' as const },
            candidates: {
              type: 'array' as const,
              items: {
                type: 'object' as const,
                properties: {
                  id: { type: 'string' as const },
                  name: { type: 'string' as const },
                  confidence: { type: 'number' as const },
                },
              },
            },
          },
        },
      },
    };

    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: augmentedProperties,
          required: [...tool.parameters.required, 'confidence', 'reasoning'],
        },
      },
    };
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test soccer-stats-api --testPathPattern=openai.provider --no-cache`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/soccer-stats/api/src/modules/voice-interpreter/providers/openai.provider.ts \
        apps/soccer-stats/api/src/modules/voice-interpreter/providers/openai.provider.spec.ts
git commit -m "feat(voice-interpreter): add OpenAI AI provider with function calling"
```

---

## Task 8: GraphQL DTOs

**Files:**

- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/dto/interpret-voice.input.ts`
- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/dto/resolve-voice-confirmation.input.ts`
- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/dto/voice-confirmation.output.ts`

- [ ] **Step 1: Create InterpretVoiceInput**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/dto/interpret-voice.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, MinLength } from 'class-validator';

@InputType()
export class InterpretVoiceInput {
  @Field(() => ID)
  @IsUUID()
  gameTeamId: string;

  @Field()
  @IsString()
  @MinLength(1)
  transcription: string;
}
```

- [ ] **Step 2: Create ResolveVoiceConfirmationInput**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/dto/resolve-voice-confirmation.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString } from 'class-validator';

@InputType()
export class SelectedCandidateInput {
  @Field()
  @IsString()
  paramName: string;

  @Field(() => ID)
  @IsUUID()
  selectedId: string;
}

@InputType()
export class ResolveVoiceConfirmationInput {
  @Field(() => ID)
  @IsUUID()
  confirmationId: string;

  @Field(() => [SelectedCandidateInput])
  selectedCandidates: SelectedCandidateInput[];
}
```

- [ ] **Step 3: Create VoiceConfirmationPayload output types**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/dto/voice-confirmation.output.ts
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class CandidateOption {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Float)
  confidence: number;
}

@ObjectType()
export class AmbiguousCandidateOutput {
  @Field()
  paramName: string;

  @Field(() => [CandidateOption])
  candidates: CandidateOption[];
}

@ObjectType()
export class VoiceConfirmationPayload {
  @Field(() => ID)
  confirmationId: string;

  @Field(() => ID)
  gameId: string;

  @Field()
  toolName: string;

  @Field()
  reasoning: string;

  @Field(() => [AmbiguousCandidateOutput])
  ambiguousCandidates: AmbiguousCandidateOutput[];
}
```

- [ ] **Step 4: Verify build compiles**

Run: `pnpm nx build soccer-stats-api --skip-nx-cache 2>&1 | tail -10`
Expected: Build succeeds (files not yet imported in module)

- [ ] **Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/modules/voice-interpreter/dto/
git commit -m "feat(voice-interpreter): add GraphQL input/output DTOs"
```

---

## Task 9: Voice Interpreter Service (Orchestrator)

**Files:**

- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.service.ts`
- Test: `apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';

import { GameStatus } from '../../entities/game.entity';
import { StatsTrackingLevel } from '../../entities/team-configuration.entity';

import { VoiceInterpreterService } from './voice-interpreter.service';
import { PendingConfirmationStore } from './pending-confirmation.store';
import type { GameContext } from './tools/game-context.builder';
import type { AIProvider, ToolCallResult } from './providers/ai-provider.interface';

describe('VoiceInterpreterService', () => {
  let service: VoiceInterpreterService;
  let mockAIProvider: jest.Mocked<AIProvider>;
  let mockPubSub: { publish: jest.Mock };

  const baseContext: GameContext = {
    gameId: 'game-1',
    gameTeamId: 'gt-1',
    userId: 'user-1',
    gameStatus: GameStatus.FIRST_HALF,
    statsTrackingLevel: StatsTrackingLevel.Full,
    teamName: 'Thunderbolts',
    currentPeriod: '1',
    currentPeriodSecond: 600,
    homeTeamName: 'Thunderbolts',
    awayTeamName: 'Opponents',
    homeScore: 0,
    awayScore: 0,
    onFieldPlayers: [],
    benchPlayers: [],
    recentEvents: [],
  };

  const mockContextBuilder = {
    build: jest.fn().mockResolvedValue(baseContext),
    buildSystemPrompt: jest.fn().mockReturnValue('system prompt'),
  };

  const mockToolExecutor = {
    execute: jest.fn().mockResolvedValue({ id: 'evt-1' }),
  };

  beforeEach(async () => {
    mockAIProvider = {
      name: 'claude',
      interpret: jest.fn(),
    };

    mockPubSub = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [VoiceInterpreterService, PendingConfirmationStore, { provide: 'AI_PROVIDER', useValue: mockAIProvider }, { provide: 'PUB_SUB', useValue: mockPubSub }, { provide: 'GameContextBuilder', useValue: mockContextBuilder }, { provide: 'ToolExecutor', useValue: mockToolExecutor }],
    }).compile();

    service = module.get(VoiceInterpreterService);
  });

  it('should execute high-confidence tool calls immediately', async () => {
    const toolCall: ToolCallResult = {
      toolName: 'recordGoal',
      args: { scorerId: 'p-1' },
      confidence: 0.95,
      reasoning: 'Brayden scored',
    };

    mockAIProvider.interpret.mockResolvedValue([toolCall]);

    await service.interpretVoice('gt-1', 'Brayden scored', 'user-1');

    expect(mockToolExecutor.execute).toHaveBeenCalledTimes(1);
    expect(mockPubSub.publish).not.toHaveBeenCalledWith(expect.stringContaining('voiceConfirmation'), expect.anything());
  });

  it('should publish low-confidence tool calls as pending confirmations', async () => {
    const toolCall: ToolCallResult = {
      toolName: 'recordGoal',
      args: { scorerId: undefined },
      confidence: 0.5,
      reasoning: 'Jay could match multiple players',
      ambiguousCandidates: [
        {
          paramName: 'scorerId',
          candidates: [
            { id: 'p-1', name: 'Jay S.', confidence: 0.6 },
            { id: 'p-2', name: 'Jayden M.', confidence: 0.4 },
          ],
        },
      ],
    };

    mockAIProvider.interpret.mockResolvedValue([toolCall]);

    await service.interpretVoice('gt-1', 'Jay scored', 'user-1');

    expect(mockToolExecutor.execute).not.toHaveBeenCalled();
    expect(mockPubSub.publish).toHaveBeenCalledWith(
      'voiceConfirmation:game-1',
      expect.objectContaining({
        voiceConfirmationRequested: expect.objectContaining({
          toolName: 'recordGoal',
          gameId: 'game-1',
        }),
      }),
    );
  });

  it('should handle mixed confidence results', async () => {
    const highConf: ToolCallResult = {
      toolName: 'recordGoal',
      args: { scorerId: 'p-1' },
      confidence: 0.95,
      reasoning: 'Clear goal',
    };
    const lowConf: ToolCallResult = {
      toolName: 'substitutePlayer',
      args: {},
      confidence: 0.4,
      reasoning: 'Ambiguous',
      ambiguousCandidates: [],
    };

    mockAIProvider.interpret.mockResolvedValue([highConf, lowConf]);

    await service.interpretVoice('gt-1', 'Goal brayden, sub jay', 'user-1');

    expect(mockToolExecutor.execute).toHaveBeenCalledTimes(1);
    expect(mockPubSub.publish).toHaveBeenCalledTimes(1);
  });

  it('should handle empty AI response', async () => {
    mockAIProvider.interpret.mockResolvedValue([]);

    await service.interpretVoice('gt-1', 'mumble mumble', 'user-1');

    expect(mockToolExecutor.execute).not.toHaveBeenCalled();
    expect(mockPubSub.publish).not.toHaveBeenCalled();
  });

  it('should reject transcriptions exceeding 500 characters', async () => {
    const longText = 'a'.repeat(501);

    await expect(service.interpretVoice('gt-1', longText, 'user-1')).rejects.toThrow('Transcription too long');

    expect(mockAIProvider.interpret).not.toHaveBeenCalled();
  });

  it('should truncate tool calls exceeding limit of 10', async () => {
    const toolCalls = Array.from({ length: 15 }, (_, i) => ({
      toolName: 'recordGoal',
      args: { scorerId: `p-${i}` },
      confidence: 0.95,
      reasoning: `Goal ${i}`,
    }));

    mockAIProvider.interpret.mockResolvedValue(toolCalls);

    await service.interpretVoice('gt-1', 'many goals', 'user-1');

    expect(mockToolExecutor.execute).toHaveBeenCalledTimes(10);
  });

  it('should rate limit after 5 requests per minute', async () => {
    mockAIProvider.interpret.mockResolvedValue([]);

    // First 5 should succeed
    for (let i = 0; i < 5; i++) {
      await service.interpretVoice('gt-1', 'test', 'user-1');
    }

    // 6th should fail
    await expect(service.interpretVoice('gt-1', 'test', 'user-1')).rejects.toThrow('Rate limit exceeded');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test soccer-stats-api --testPathPattern=voice-interpreter.service --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.service.ts
import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

import type { AIProvider } from './providers/ai-provider.interface';
import { GameContextBuilder } from './tools/game-context.builder';
import { ToolExecutor } from './tools/tool-executor';
import { getToolsForGamePhase } from './tools/tool-definitions';
import { PendingConfirmationStore } from './pending-confirmation.store';

const DEFAULT_CONFIDENCE_THRESHOLD = 0.8;
const MAX_TRANSCRIPTION_LENGTH = 500;
const MAX_TOOL_CALLS = 10;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

@Injectable()
export class VoiceInterpreterService {
  private readonly logger = new Logger(VoiceInterpreterService.name);
  private readonly confidenceThreshold: number;
  private readonly rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  constructor(
    @Inject('AI_PROVIDER') private readonly aiProvider: AIProvider,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
    @Inject('GameContextBuilder')
    private readonly contextBuilder: GameContextBuilder,
    @Inject('ToolExecutor') private readonly toolExecutor: ToolExecutor,
    private readonly pendingStore: PendingConfirmationStore,
  ) {
    this.confidenceThreshold = parseFloat(process.env.VOICE_CONFIDENCE_THRESHOLD ?? '') || DEFAULT_CONFIDENCE_THRESHOLD;
  }

  async interpretVoice(gameTeamId: string, transcription: string, userId: string): Promise<void> {
    // Guardrail: transcription length limit
    if (transcription.length > MAX_TRANSCRIPTION_LENGTH) {
      throw new BadRequestException(`Transcription too long (${transcription.length} chars, max ${MAX_TRANSCRIPTION_LENGTH})`);
    }

    // Guardrail: rate limit per user
    this.checkRateLimit(userId);

    // 1. Build game context
    const context = await this.contextBuilder.build(gameTeamId, userId);

    // 2. Get tools for current game phase
    const tools = getToolsForGamePhase(context.gameStatus);

    if (tools.length === 0) {
      this.logger.warn(`No tools available for game status: ${context.gameStatus}`);
      return;
    }

    // 3. Build system prompt and call AI
    const systemPrompt = this.contextBuilder.buildSystemPrompt(context);

    const toolCalls = await this.aiProvider.interpret({
      transcription,
      tools,
      systemPrompt,
    });

    if (toolCalls.length === 0) {
      this.logger.debug('AI returned no tool calls for transcription');
      return;
    }

    // Guardrail: cap tool calls to prevent runaway batch expansions
    const limitedToolCalls = toolCalls.slice(0, MAX_TOOL_CALLS);
    if (toolCalls.length > MAX_TOOL_CALLS) {
      this.logger.warn(`AI returned ${toolCalls.length} tool calls, truncating to ${MAX_TOOL_CALLS}`);
    }

    // 4. Process each tool call based on confidence
    for (const toolCall of limitedToolCalls) {
      if (toolCall.confidence >= this.confidenceThreshold) {
        // High confidence — execute immediately
        try {
          await this.toolExecutor.execute(toolCall, context);
          this.logger.log(`Executed ${toolCall.toolName} (confidence: ${toolCall.confidence}): ${toolCall.reasoning}`);
        } catch (error) {
          this.logger.error(`Failed to execute ${toolCall.toolName}: ${error.message}`, error.stack);
        }
      } else {
        // Low confidence — store and publish for confirmation
        const confirmationId = this.pendingStore.add({
          toolName: toolCall.toolName,
          args: toolCall.args,
          reasoning: toolCall.reasoning,
          ambiguousCandidates: toolCall.ambiguousCandidates ?? [],
          gameId: context.gameId,
          gameTeamId: context.gameTeamId,
          userId,
        });

        await this.pubSub.publish(`voiceConfirmation:${context.gameId}`, {
          voiceConfirmationRequested: {
            confirmationId,
            gameId: context.gameId,
            toolName: toolCall.toolName,
            reasoning: toolCall.reasoning,
            ambiguousCandidates: toolCall.ambiguousCandidates ?? [],
          },
        });

        this.logger.log(`Pending confirmation ${confirmationId} for ${toolCall.toolName} (confidence: ${toolCall.confidence})`);
      }
    }
  }

  async resolveConfirmation(confirmationId: string, selectedCandidates: { paramName: string; selectedId: string }[]): Promise<void> {
    const pending = this.pendingStore.resolve(confirmationId);

    if (!pending) {
      this.logger.warn(`Confirmation ${confirmationId} not found or expired`);
      return;
    }

    // Merge selected candidates into the original args
    const resolvedArgs = { ...pending.args };
    for (const selection of selectedCandidates) {
      resolvedArgs[selection.paramName] = selection.selectedId;
    }

    // Build a context for execution
    const context = await this.contextBuilder.build(pending.gameTeamId, pending.userId);

    try {
      await this.toolExecutor.execute(
        {
          toolName: pending.toolName,
          args: resolvedArgs,
          confidence: 1.0,
          reasoning: `User confirmed: ${pending.reasoning}`,
        },
        context,
      );
      this.logger.log(`Resolved confirmation ${confirmationId} for ${pending.toolName}`);
    } catch (error) {
      this.logger.error(`Failed to execute resolved ${pending.toolName}: ${error.message}`, error.stack);
    }
  }

  private checkRateLimit(userId: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(userId);

    if (!entry || now > entry.resetAt) {
      this.rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
      throw new BadRequestException('Rate limit exceeded — try again in a moment');
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test soccer-stats-api --testPathPattern=voice-interpreter.service --no-cache`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.service.ts \
        apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.service.spec.ts
git commit -m "feat(voice-interpreter): add orchestrator service with confidence routing"
```

---

## Task 10: GraphQL Resolver

**Files:**

- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.resolver.ts`

- [ ] **Step 1: Create the resolver**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.resolver.ts
import { Resolver, Mutation, Subscription, Args, ID } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Public } from '../auth/public.decorator';

import { VoiceInterpreterService } from './voice-interpreter.service';
import { InterpretVoiceInput } from './dto/interpret-voice.input';
import { ResolveVoiceConfirmationInput } from './dto/resolve-voice-confirmation.input';
import { VoiceConfirmationPayload } from './dto/voice-confirmation.output';

@Resolver()
@UseGuards(ClerkAuthGuard)
export class VoiceInterpreterResolver {
  constructor(
    private readonly voiceService: VoiceInterpreterService,
    @Inject('PUB_SUB') private pubSub: PubSub,
  ) {}

  @Mutation(() => Boolean, {
    name: 'interpretVoice',
    description: 'Send a voice transcription for AI interpretation. Results arrive via gameEventChanged and voiceConfirmationRequested subscriptions.',
  })
  async interpretVoice(@Args('input') input: InterpretVoiceInput, @CurrentUser() user: AuthenticatedUser): Promise<boolean> {
    // Fire-and-forget — results come via subscriptions
    // We await to catch immediate errors (bad gameTeamId, etc.)
    await this.voiceService.interpretVoice(input.gameTeamId, input.transcription, user.id);
    return true;
  }

  @Mutation(() => Boolean, {
    name: 'resolveVoiceConfirmation',
    description: 'Resolve an ambiguous voice interpretation by selecting candidates.',
  })
  async resolveVoiceConfirmation(@Args('input') input: ResolveVoiceConfirmationInput): Promise<boolean> {
    await this.voiceService.resolveConfirmation(input.confirmationId, input.selectedCandidates);
    return true;
  }

  @Subscription(() => VoiceConfirmationPayload, {
    name: 'voiceConfirmationRequested',
    filter: (
      payload: {
        voiceConfirmationRequested: VoiceConfirmationPayload;
      },
      variables: { gameId: string },
    ) => payload.voiceConfirmationRequested.gameId === variables.gameId,
  })
  @Public()
  voiceConfirmationRequested(@Args('gameId', { type: () => ID }) gameId: string) {
    return this.pubSub.asyncIterableIterator(`voiceConfirmation:${gameId}`);
  }
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm nx build soccer-stats-api --skip-nx-cache 2>&1 | tail -10`
Expected: May fail due to module not registered — that's OK, we wire it in the next task.

- [ ] **Step 3: Commit**

```bash
git add apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.resolver.ts
git commit -m "feat(voice-interpreter): add GraphQL resolver for voice mutations and subscription"
```

---

## Task 11: Module Wiring & Registration

**Files:**

- Create: `apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.module.ts`
- Modify: `apps/soccer-stats/api/src/app/app.module.ts`

- [ ] **Step 1: Create the module**

```typescript
// apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GameTeam } from '../../entities/game-team.entity';
import { Game } from '../../entities/game.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { AuthModule } from '../auth/auth.module';
import { GameEventsModule } from '../game-events/game-events.module';
import { GameEventsService } from '../game-events/game-events.service';

import { VoiceInterpreterService } from './voice-interpreter.service';
import { VoiceInterpreterResolver } from './voice-interpreter.resolver';
import { GameContextBuilder } from './tools/game-context.builder';
import { ToolExecutor } from './tools/tool-executor';
import { PendingConfirmationStore } from './pending-confirmation.store';
import { ClaudeProvider } from './providers/claude.provider';
import { OpenAIProvider } from './providers/openai.provider';

@Module({
  imports: [TypeOrmModule.forFeature([GameTeam, Game, GameEvent]), forwardRef(() => AuthModule), forwardRef(() => GameEventsModule)],
  providers: [
    // AI provider — selected by VOICE_AI_PROVIDER env var
    {
      provide: 'AI_PROVIDER',
      useFactory: () => {
        const providerName = process.env.VOICE_AI_PROVIDER ?? 'claude';
        const model = process.env.VOICE_AI_MODEL ?? (providerName === 'openai' ? 'gpt-4o-mini' : 'claude-sonnet-4-6');

        if (providerName === 'openai') {
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) throw new Error('OPENAI_API_KEY required when VOICE_AI_PROVIDER=openai');
          return new OpenAIProvider(apiKey, model);
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('ANTHROPIC_API_KEY required when VOICE_AI_PROVIDER=claude');
        return new ClaudeProvider(apiKey, model);
      },
    },
    // Context builder — injected by token so service can use @Inject
    {
      provide: 'GameContextBuilder',
      useClass: GameContextBuilder,
    },
    // Tool executor — injected by token
    {
      provide: 'ToolExecutor',
      useClass: ToolExecutor,
    },
    // GameEventsService alias for injection into context builder & executor
    {
      provide: 'GameEventsService',
      useExisting: GameEventsService,
    },
    PendingConfirmationStore,
    VoiceInterpreterService,
    VoiceInterpreterResolver,
  ],
})
export class VoiceInterpreterModule {}
```

- [ ] **Step 2: Register the module in AppModule**

In `apps/soccer-stats/api/src/app/app.module.ts`, add the import:

```typescript
import { VoiceInterpreterModule } from '../modules/voice-interpreter/voice-interpreter.module';
```

Add `VoiceInterpreterModule` to the `imports` array after `MyModule`:

```typescript
imports: [
  // ... existing imports ...
  MyModule,
  VoiceInterpreterModule,
],
```

- [ ] **Step 3: Build and verify**

Run: `pnpm nx build soccer-stats-api --skip-nx-cache 2>&1 | tail -20`
Expected: Build succeeds. The module is registered and all providers resolve.

Note: The app won't start without `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` set, but that's correct — the factory will throw at startup if the key is missing.

- [ ] **Step 4: Run all voice-interpreter tests**

Run: `pnpm nx test soccer-stats-api --testPathPattern=voice-interpreter --no-cache`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/modules/voice-interpreter/voice-interpreter.module.ts \
        apps/soccer-stats/api/src/app/app.module.ts
git commit -m "feat(voice-interpreter): wire module into app with provider factory"
```

---

## Task 12: Frontend — GraphQL Documents

**Files:**

- Create: `apps/soccer-stats/ui/src/app/services/voice-graphql.service.ts`

- [ ] **Step 1: Create the GraphQL documents**

```typescript
// apps/soccer-stats/ui/src/app/services/voice-graphql.service.ts
import { gql } from '@apollo/client';

export const INTERPRET_VOICE = gql`
  mutation InterpretVoice($input: InterpretVoiceInput!) {
    interpretVoice(input: $input)
  }
`;

export const RESOLVE_VOICE_CONFIRMATION = gql`
  mutation ResolveVoiceConfirmation($input: ResolveVoiceConfirmationInput!) {
    resolveVoiceConfirmation(input: $input)
  }
`;

export const VOICE_CONFIRMATION_SUBSCRIPTION = gql`
  subscription VoiceConfirmationRequested($gameId: ID!) {
    voiceConfirmationRequested(gameId: $gameId) {
      confirmationId
      gameId
      toolName
      reasoning
      ambiguousCandidates {
        paramName
        candidates {
          id
          name
          confidence
        }
      }
    }
  }
`;
```

- [ ] **Step 2: Run codegen to generate types**

Run: `pnpm nx run soccer-stats-graphql-codegen:codegen`

Note: This will only work if the API is running with the new schema. If codegen fails because the API isn't running, you can skip this step and the types will be generated when the full stack runs. The raw `gql` documents work without generated types.

- [ ] **Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/services/voice-graphql.service.ts
git commit -m "feat(voice-interpreter): add frontend GraphQL documents for voice"
```

---

## Task 13: Frontend — useVoiceInput Hook

**Files:**

- Create: `apps/soccer-stats/ui/src/app/components/smart/voice-input/use-voice-input.hook.ts`

- [ ] **Step 1: Create the hook**

```typescript
// apps/soccer-stats/ui/src/app/components/smart/voice-input/use-voice-input.hook.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';

import { INTERPRET_VOICE } from '../../../services/voice-graphql.service';

export type VoiceInputState = 'idle' | 'listening' | 'processing';

interface SpeechRecognitionResult {
  readonly transcript: string;
  readonly isFinal: boolean;
}

interface UseVoiceInputOptions {
  gameTeamId: string;
}

interface UseVoiceInputReturn {
  state: VoiceInputState;
  transcript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
}

// Web Speech API types (not in all TS lib versions)
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: { error: string }) => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    item: (index: number) => {
      item: (index: number) => SpeechRecognitionResult;
      isFinal: boolean;
      length: number;
    };
    [index: number]: {
      [index: number]: SpeechRecognitionResult;
      isFinal: boolean;
      length: number;
    };
  };
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

function getSpeechRecognitionClass(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useVoiceInput({ gameTeamId }: UseVoiceInputOptions): UseVoiceInputReturn {
  const [state, setState] = useState<VoiceInputState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  const [interpretVoice] = useMutation(INTERPRET_VOICE);

  const isSupported = getSpeechRecognitionClass() !== null;

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) return;

    setError(null);
    setTranscript('');
    finalTranscriptRef.current = '';
    setState('listening');

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
      }

      setTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onend = () => {
      // Auto-stopped (silence or manual stop)
      const finalText = finalTranscriptRef.current.trim();
      recognitionRef.current = null;

      if (finalText) {
        setState('processing');
        interpretVoice({
          variables: {
            input: {
              gameTeamId,
              transcription: finalText,
            },
          },
        })
          .then(() => {
            setState('idle');
          })
          .catch((err) => {
            setError(err.message ?? 'Voice interpretation failed');
            setState('idle');
          });
      } else {
        setState('idle');
      }
    };

    recognition.onerror = (event: { error: string }) => {
      setError(`Speech recognition error: ${event.error}`);
      setState('idle');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [gameTeamId, interpretVoice]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    state,
    transcript,
    isSupported,
    startListening,
    stopListening,
    error,
  };
}
```

- [ ] **Step 2: Verify lint**

Run: `pnpm nx lint soccer-stats-ui --skip-nx-cache 2>&1 | tail -5`
Expected: Lint passes (or only pre-existing issues)

- [ ] **Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/voice-input/use-voice-input.hook.ts
git commit -m "feat(voice-interpreter): add useVoiceInput hook with Web Speech API"
```

---

## Task 14: Frontend — Voice Input Button & Overlay

**Files:**

- Create: `apps/soccer-stats/ui/src/app/components/smart/voice-input/voice-input-button.tsx`
- Create: `apps/soccer-stats/ui/src/app/components/smart/voice-input/voice-input-overlay.tsx`

- [ ] **Step 1: Create VoiceInputButton**

```typescript
// apps/soccer-stats/ui/src/app/components/smart/voice-input/voice-input-button.tsx
import type { VoiceInputState } from './use-voice-input.hook';

interface VoiceInputButtonProps {
  state: VoiceInputState;
  onTap: () => void;
}

export function VoiceInputButton({ state, onTap }: VoiceInputButtonProps) {
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  return (
    <button
      onClick={onTap}
      disabled={isProcessing}
      className={`fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${
        isListening
          ? 'animate-pulse bg-red-500 text-white'
          : isProcessing
            ? 'cursor-wait bg-gray-400 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
      aria-label={
        isListening
          ? 'Stop listening'
          : isProcessing
            ? 'Processing voice...'
            : 'Start voice input'
      }
    >
      {isProcessing ? (
        <svg
          className="h-6 w-6 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        <svg
          className="h-6 w-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Create VoiceInputOverlay**

```typescript
// apps/soccer-stats/ui/src/app/components/smart/voice-input/voice-input-overlay.tsx
interface VoiceInputOverlayProps {
  transcript: string;
  isVisible: boolean;
}

export function VoiceInputOverlay({
  transcript,
  isVisible,
}: VoiceInputOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-36 left-4 right-4 z-50 rounded-lg bg-gray-900/90 px-4 py-3 text-white shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Listening
        </span>
      </div>
      <p className="mt-1 min-h-[1.5rem] text-sm">
        {transcript || 'Speak now...'}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/voice-input/voice-input-button.tsx \
        apps/soccer-stats/ui/src/app/components/smart/voice-input/voice-input-overlay.tsx
git commit -m "feat(voice-interpreter): add voice input button FAB and listening overlay"
```

---

## Task 15: Frontend — Voice Confirmation Card

**Files:**

- Create: `apps/soccer-stats/ui/src/app/components/smart/voice-input/voice-confirmation-card.tsx`

- [ ] **Step 1: Create VoiceConfirmationCard**

```typescript
// apps/soccer-stats/ui/src/app/components/smart/voice-input/voice-confirmation-card.tsx
import { useMutation } from '@apollo/client/react';

import { RESOLVE_VOICE_CONFIRMATION } from '../../../services/voice-graphql.service';

interface CandidateOption {
  id: string;
  name: string;
  confidence: number;
}

interface AmbiguousCandidate {
  paramName: string;
  candidates: CandidateOption[];
}

interface VoiceConfirmationCardProps {
  confirmationId: string;
  toolName: string;
  reasoning: string;
  ambiguousCandidates: AmbiguousCandidate[];
  onResolved: () => void;
  onDismissed: () => void;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  recordGoal: 'Goal',
  substitutePlayer: 'Substitution',
  bringPlayerOntoField: 'Player On',
  removePlayerFromField: 'Player Off',
  swapPositions: 'Position Swap',
  recordFormationChange: 'Formation',
  addPlayerToRoster: 'Roster Add',
  startPeriod: 'Start Period',
  endPeriod: 'End Period',
  recordPositionChange: 'Position Change',
};

export function VoiceConfirmationCard({
  confirmationId,
  toolName,
  reasoning,
  ambiguousCandidates,
  onResolved,
  onDismissed,
}: VoiceConfirmationCardProps) {
  const [resolveConfirmation, { loading }] = useMutation(
    RESOLVE_VOICE_CONFIRMATION,
  );

  const handleSelect = async (
    paramName: string,
    selectedId: string,
  ) => {
    await resolveConfirmation({
      variables: {
        input: {
          confirmationId,
          selectedCandidates: [{ paramName, selectedId }],
        },
      },
    });
    onResolved();
  };

  return (
    <div className="fixed bottom-36 left-4 right-4 z-50 rounded-lg border border-amber-500/30 bg-gray-900/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">
          {TOOL_DISPLAY_NAMES[toolName] ?? toolName} — Confirm
        </span>
        <button
          onClick={onDismissed}
          className="text-gray-400 hover:text-white"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-400">{reasoning}</p>

      {ambiguousCandidates.map((candidate) => (
        <div key={candidate.paramName} className="mt-2">
          <div className="flex flex-wrap gap-2">
            {candidate.candidates.map((option) => (
              <button
                key={option.id}
                onClick={() =>
                  handleSelect(candidate.paramName, option.id)
                }
                disabled={loading}
                className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-white transition hover:bg-blue-600 disabled:opacity-50"
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create barrel export**

```typescript
// apps/soccer-stats/ui/src/app/components/smart/voice-input/index.ts
export { VoiceInputButton } from './voice-input-button';
export { VoiceInputOverlay } from './voice-input-overlay';
export { VoiceConfirmationCard } from './voice-confirmation-card';
export { useVoiceInput } from './use-voice-input.hook';
export type { VoiceInputState } from './use-voice-input.hook';
```

- [ ] **Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/voice-input/
git commit -m "feat(voice-interpreter): add voice confirmation card and barrel exports"
```

---

## Task 16: Frontend — Wire Voice into Game Page

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx`

- [ ] **Step 1: Add imports to game page**

At the top of `apps/soccer-stats/ui/src/app/pages/game.page.tsx`, add:

```typescript
import { useSubscription } from '@apollo/client/react';
import { VoiceInputButton, VoiceInputOverlay, VoiceConfirmationCard, useVoiceInput } from '../components/smart/voice-input';
import { VOICE_CONFIRMATION_SUBSCRIPTION } from '../services/voice-graphql.service';
```

- [ ] **Step 2: Add voice state inside the GamePage component**

Inside the `GamePage` component, after the existing hooks and state, add:

```typescript
// Voice input state
const managedGameTeamId = data?.game?.teams?.find((t: { teamType: string }) => t.teamType === 'home')?.id;

const {
  state: voiceState,
  transcript: voiceTranscript,
  isSupported: voiceSupported,
  startListening,
  stopListening,
  error: voiceError,
} = useVoiceInput({
  gameTeamId: managedGameTeamId ?? '',
});

// Voice confirmation subscription
const [pendingConfirmations, setPendingConfirmations] = useState<
  Array<{
    confirmationId: string;
    toolName: string;
    reasoning: string;
    ambiguousCandidates: Array<{
      paramName: string;
      candidates: Array<{ id: string; name: string; confidence: number }>;
    }>;
  }>
>([]);

useSubscription(VOICE_CONFIRMATION_SUBSCRIPTION, {
  variables: { gameId },
  skip: !gameId,
  onData: ({ data: subData }) => {
    const payload = subData?.data?.voiceConfirmationRequested;
    if (payload) {
      setPendingConfirmations((prev) => [...prev, payload]);
    }
  },
});
```

- [ ] **Step 3: Add voice UI to the JSX**

At the end of the component's JSX return (before the final closing `</>`), add:

```tsx
{
  /* Voice input */
}
{
  voiceSupported && managedGameTeamId && (
    <>
      <VoiceInputButton state={voiceState} onTap={voiceState === 'listening' ? stopListening : startListening} />
      <VoiceInputOverlay transcript={voiceTranscript} isVisible={voiceState === 'listening'} />
      {pendingConfirmations.map((confirmation) => (
        <VoiceConfirmationCard key={confirmation.confirmationId} confirmationId={confirmation.confirmationId} toolName={confirmation.toolName} reasoning={confirmation.reasoning} ambiguousCandidates={confirmation.ambiguousCandidates} onResolved={() => setPendingConfirmations((prev) => prev.filter((c) => c.confirmationId !== confirmation.confirmationId))} onDismissed={() => setPendingConfirmations((prev) => prev.filter((c) => c.confirmationId !== confirmation.confirmationId))} />
      ))}
    </>
  );
}
```

- [ ] **Step 4: Verify lint and build**

Run: `pnpm nx lint soccer-stats-ui --skip-nx-cache 2>&1 | tail -10`
Run: `pnpm nx build soccer-stats-ui --skip-nx-cache 2>&1 | tail -10`
Expected: Both pass

- [ ] **Step 5: Commit**

```bash
git add apps/soccer-stats/ui/src/app/pages/game.page.tsx
git commit -m "feat(voice-interpreter): wire voice input into game page"
```

---

## Task 17: Environment Configuration & Documentation

**Files:**

- Modify: `apps/soccer-stats/api/.env` (or `.env.example`)

- [ ] **Step 1: Add voice configuration to .env example**

Append to the environment file (`.env` or `.env.example`) in `apps/soccer-stats/api/`:

```env
# Voice Interpreter Configuration
VOICE_AI_PROVIDER=claude
VOICE_AI_MODEL=claude-sonnet-4-6
ANTHROPIC_API_KEY=
# OPENAI_API_KEY=
VOICE_CONFIDENCE_THRESHOLD=0.8
```

- [ ] **Step 2: Run full test suite**

Run: `pnpm nx test soccer-stats-api --no-cache 2>&1 | tail -20`
Expected: All tests pass (existing + new voice-interpreter tests)

- [ ] **Step 3: Run full lint**

Run: `pnpm nx lint soccer-stats-api --skip-nx-cache && pnpm nx lint soccer-stats-ui --skip-nx-cache`
Expected: Both pass

- [ ] **Step 4: Commit**

```bash
git add apps/soccer-stats/api/.env.example  # or .env
git commit -m "feat(voice-interpreter): add voice configuration env vars"
```

---

## Task 18: Integration Smoke Test

This task verifies the full pipeline works end-to-end with the API running.

- [ ] **Step 1: Start the API with voice config**

Set env vars and start:

```bash
ANTHROPIC_API_KEY=<your-key> pnpm nx serve:dev soccer-stats-api
```

- [ ] **Step 2: Test the interpretVoice mutation via GraphQL playground**

Navigate to `http://localhost:3333/api/graphql` and run:

```graphql
mutation {
  interpretVoice(input: { gameTeamId: "<a real game team ID from your DB>", transcription: "Brayden scored" })
}
```

Expected: Returns `true`. Check API logs for tool execution or pending confirmation.

- [ ] **Step 3: Test the subscription**

In a second GraphQL playground tab, subscribe:

```graphql
subscription {
  voiceConfirmationRequested(gameId: "<game ID>") {
    confirmationId
    toolName
    reasoning
    ambiguousCandidates {
      paramName
      candidates {
        id
        name
        confidence
      }
    }
  }
}
```

Then fire an ambiguous mutation and verify the subscription receives the payload.

- [ ] **Step 4: Start the UI and test push-to-talk**

```bash
pnpm nx serve soccer-stats-ui
```

Navigate to a game page. The mic button should appear in the bottom-right corner. Tap it, speak, and verify the flow works end-to-end.

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(voice-interpreter): address integration test findings"
```
