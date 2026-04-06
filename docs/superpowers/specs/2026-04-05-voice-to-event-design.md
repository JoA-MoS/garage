# Voice-to-Event Pipeline Design

**Date:** 2026-04-05
**Status:** Draft
**Domain:** soccer-stats

## Problem

During live games, the coach/stat tracker currently uses the touch UI to record events (goals, substitutions, lineup changes, etc.). This requires looking at the phone, navigating modals, and selecting players — all disruptive during fast-paced play.

The user has validated a voice-based workflow using Claude + voice transcription externally and wants to bring this into the app natively. The voice input should be a full-fidelity input method covering all event types, not a limited shortcut.

## Goals

- Hands-free event recording via push-to-talk during live games
- Context-aware interpretation: same spoken phrase means different things depending on game state
- Confidence-based execution: unambiguous events commit instantly, ambiguous ones pause for confirmation
- Provider-swappable AI backend (Claude, OpenAI) behind a common interface
- STT layer swappable (Web Speech API now, cloud STT later)
- No changes to existing services, mutations, or subscription infrastructure

## Non-Goals

- Text-to-speech / audio feedback (visual feedback via existing UI is sufficient)
- Continuous background listening (push-to-talk only)
- Offline voice support
- Custom speech model training

## Architecture Overview

```
User speaks ──> Web Speech API ──> Raw text
                                      │
                                      ▼
                            GraphQL mutation:
                            interpretVoice(input)
                                      │
                                      ▼
                           VoiceInterpreterService
                           ├─ GameContextBuilder: queries DB for
                           │  game state, roster, field positions
                           ├─ Filters tool definitions by game phase
                           ├─ Sends to AI provider (Claude/OpenAI)
                           │
                           ▼
                      AI returns tool calls + confidence
                           │
                  ┌────────┴────────┐
                  │                 │
             >= 0.8 conf       < 0.8 conf
                  │                 │
           Execute via          Store as pending
           existing services        │
                  │                 │
                  ▼                 ▼
           PubSub:              PubSub:
           gameEventChanged     voiceConfirmationRequested
                  │                 │
                  ▼                 ▼
           UI updates           Confirmation card
           automatically        appears on screen
                                    │
                                    ▼
                              User taps to resolve
                                    │
                                    ▼
                              GraphQL mutation:
                              resolveVoiceConfirmation
                                    │
                                    ▼
                              Execute resolved events
                              via existing services
                                    │
                                    ▼
                              PubSub: gameEventChanged
```

## Backend Design

### New Module: `voice-interpreter`

Location: `apps/soccer-stats/api/src/modules/voice-interpreter/`

```
voice-interpreter/
├── voice-interpreter.module.ts
├── voice-interpreter.resolver.ts        # GraphQL mutations + subscription
├── voice-interpreter.service.ts         # Orchestrator
├── providers/
│   ├── ai-provider.interface.ts         # Common interface
│   ├── claude.provider.ts               # Anthropic SDK + tool_use
│   └── openai.provider.ts              # OpenAI SDK + function calling
├── tools/
│   ├── tool-definitions.ts             # Tool schemas from existing DTOs
│   ├── tool-executor.ts                # Maps tool calls -> service methods
│   └── game-context.builder.ts         # Builds game state for prompt
└── dto/
    ├── interpret-voice.input.ts         # { gameTeamId, transcription }
    ├── voice-confirmation.output.ts     # Subscription payload for pending events
    └── resolve-voice-confirmation.input.ts  # { confirmationId, resolvedArgs }
```

### AI Provider Interface

```typescript
interface AIProvider {
  readonly name: string;

  interpret(request: InterpretRequest): Promise<ToolCallResult[]>;
}

interface InterpretRequest {
  transcription: string;
  tools: ToolDefinition[];
  systemPrompt: string;
}

interface ToolCallResult {
  toolName: string;
  args: Record<string, unknown>;
  confidence: number; // 0.0 - 1.0
  reasoning: string; // Why this interpretation
  ambiguousCandidates?: {
    // Present when confidence < threshold
    paramName: string; // e.g., "scorerId"
    candidates: { id: string; name: string; score: number }[];
  }[];
}
```

Both `ClaudeProvider` and `OpenAIProvider` implement this interface, translating the common `ToolDefinition` format into their native tool/function calling format.

### Game Context Builder

Queries the database to build a snapshot the AI needs for accurate interpretation:

- **Game status:** NOT_STARTED, IN_PROGRESS, HALFTIME, COMPLETED, etc.
- **Current period and clock:** e.g., Period 1, 14:30 elapsed
- **Current score**
- **Full roster:** Player names, jersey numbers, current on-field positions
- **On-field player event IDs:** The `substitutePlayer` mutation requires `playerOutEventId` (the game event ID of the player's current on-field entry), not a player ID. The context builder must provide the mapping of on-field players to their current event IDs so the AI can reference them in tool calls.
- **Bench players:** Available for substitution
- **Recent events:** Last ~5 events for conversational context

This context is injected into the system prompt so the AI can:

- Fuzzy-match spoken names to roster players ("Bray" -> Brayden, "#7" -> Brayden S.)
- Infer event type from game state ("Brayden at striker" pre-game = roster add, mid-game = position change)
- Auto-fill period and periodSecond from the current game clock

### Tool Definitions

Tools are filtered by game phase so the AI only sees what's valid:

| Game Phase        | Available Tools                                                                                                             | Maps To Service Method                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Pre-game / Lineup | `addPlayerToRoster`, `setPlayerPosition`                                                                                    | `GameEventsService.addPlayerToGameRoster()`      |
| In-game           | `recordGoal`, `substitutePlayer`, `swapPositions`, `recordFormationChange`, `bringPlayerOntoField`, `removePlayerFromField` | Corresponding existing service methods           |
| Game flow         | `startPeriod`, `endPeriod`                                                                                                  | `GameEventsService.startPeriod()`, `endPeriod()` |
| Any phase         | `recordPositionChange`                                                                                                      | `GameEventsService.recordPositionChange()`       |

Each tool definition includes:

- Name and description
- Parameter schema derived from existing input DTOs
- Which parameters the system auto-fills (period, periodSecond, gameTeamId)

### Tool Executor

Maps AI tool call outputs directly to existing service methods. No new business logic — it's purely a dispatch layer:

```typescript
class ToolExecutor {
  async execute(toolCall: ToolCallResult, context: GameContext): Promise<GameEvent | GameEvent[]> {
    // Auto-fill common params
    const args = {
      ...toolCall.args,
      gameTeamId: context.gameTeamId,
      period: context.currentPeriod,
      periodSecond: context.currentPeriodSecond,
    };

    switch (toolCall.toolName) {
      case 'recordGoal':
        return this.gameEventsService.recordGoal(args, context.userId);
      case 'substitutePlayer':
        return this.gameEventsService.substitutePlayer(args, context.userId);
      // ... etc
    }
  }
}
```

### Confidence System

The AI model self-assesses confidence per tool call:

- **High (>= 0.8):** Unambiguous. "Brayden scored" with one Brayden on roster. Execute immediately.
- **Medium (0.5 - 0.8):** Plausible but uncertain. "Jay scored" with Jay and Jayden on roster. Return as pending confirmation.
- **Low (< 0.5):** Cannot map. "Someone scored" with no player identified. Return as pending confirmation.

The confidence threshold (0.8) is configurable via environment variable `VOICE_CONFIDENCE_THRESHOLD`.

### GraphQL Schema Additions

```graphql
# Mutation: fire-and-forget interpretation request
type Mutation {
  interpretVoice(input: InterpretVoiceInput!): Boolean!
  resolveVoiceConfirmation(input: ResolveVoiceConfirmationInput!): Boolean!
}

input InterpretVoiceInput {
  gameTeamId: ID!
  transcription: String!
}

input ResolveVoiceConfirmationInput {
  confirmationId: ID!
  selectedCandidates: [SelectedCandidate!]! # User's picks for ambiguous params
}

input SelectedCandidate {
  paramName: String! # e.g., "scorerId"
  selectedId: ID! # The candidate the user chose
}

# Subscription: pending confirmations pushed to client
type Subscription {
  voiceConfirmationRequested(gameId: ID!): VoiceConfirmationPayload!
}

type VoiceConfirmationPayload {
  confirmationId: ID!
  gameId: ID!
  toolName: String!
  reasoning: String!
  proposedArgs: JSON!
  ambiguousCandidates: [AmbiguousCandidate!]!
}

type AmbiguousCandidate {
  paramName: String!
  candidates: [CandidateOption!]!
}

type CandidateOption {
  id: ID!
  name: String!
  confidence: Float!
}
```

### Pending Confirmation Storage

Pending confirmations need short-lived storage so the `resolveVoiceConfirmation` mutation can look up the original tool call. Options:

- **In-memory Map** keyed by confirmationId, with a TTL (e.g., 60 seconds). Simple, sufficient for single-instance deployment.
- If multi-instance is needed later, move to Redis. YAGNI for now.

### Provider Configuration

```env
VOICE_AI_PROVIDER=claude          # or "openai"
VOICE_AI_MODEL=claude-sonnet-4-6  # or "gpt-4o-mini"
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
VOICE_CONFIDENCE_THRESHOLD=0.8
```

Provider selection via factory:

```typescript
{
  provide: 'AI_PROVIDER',
  useFactory: (config: ConfigService) => {
    const provider = config.get('VOICE_AI_PROVIDER');
    return provider === 'openai'
      ? new OpenAIProvider(config)
      : new ClaudeProvider(config);
  },
}
```

## Frontend Design

### New Components

Location: `apps/soccer-stats/ui/src/app/components/smart/voice-input/`

```
voice-input/
├── voice-input-button.tsx         # Floating mic button (FAB)
├── voice-input-overlay.tsx        # Listening state + live transcription
├── voice-confirmation-card.tsx    # Ambiguous event resolution UI
└── use-voice-input.hook.ts        # Web Speech API + mutation orchestration
```

### UX Flow

```
 IDLE              LISTENING           PROCESSING          RESULT
┌──────┐         ┌───────────┐       ┌───────────┐      ┌──────────────┐
│      │  tap    │           │ stop  │           │      │ toast: Goal  │
│ mic  │───────> │  recording│──────>│ thinking  │─────>│  #7 Brayden  │
│      │        │ "brayden  │       │           │      │              │
└──────┘        │  scored"  │       └───────────┘      │ card: Sub    │
                └───────────┘                          │ Jay or Jayden│
  FAB in          Shows live          interpretVoice    └──────────────┘
  bottom          transcription       mutation fired
  corner          from Web Speech                       High-conf: toast
                  API                                   Low-conf: card
                                                        via subscription
```

### Voice Input Button

- Floating action button, always visible on the game page during active games
- Positioned bottom-right, above existing controls
- States: idle, listening (pulsing indicator), processing (spinner)
- Tap to start, tap again to stop (also auto-stops on silence)
- Hidden when Web Speech API is not available (unsupported browser)

### Voice Input Overlay

- Lightweight bar at bottom of screen during listening state
- Shows live transcription text as Web Speech API captures it
- Disappears when listening stops

### Voice Confirmation Card

- Slides up from bottom when `voiceConfirmationRequested` subscription fires
- Shows the AI's interpretation and the ambiguous candidates
- E.g., "Goal by... Jay S. (#7) or Jayden M. (#14)?" with tap targets
- Tapping resolves via `resolveVoiceConfirmation` mutation
- Dismiss to cancel (pending confirmation expires via TTL)
- Multiple confirmations can stack if the utterance had several ambiguous events

### use-voice-input Hook

Encapsulates:

- Web Speech API lifecycle (start, stop, interim results, final transcript)
- Calling the `interpretVoice` mutation on stop
- Managing button state (idle, listening, processing)
- Feature detection (is Web Speech API available?)

The hook does NOT manage subscription state — that's handled by the existing game page subscription setup. The `voiceConfirmationRequested` subscription is added alongside `gameEventChanged`.

**Note:** The `interpretVoice` mutation accepts `gameTeamId`, but the `voiceConfirmationRequested` subscription filters on `gameId`. The resolver looks up `gameId` from the `gameTeamId` relationship when publishing to PubSub, matching the existing `gameEventChanged` pattern.

### STT Swappability

The `use-voice-input` hook abstracts the STT implementation:

```typescript
interface STTProvider {
  start(): void;
  stop(): void;
  onTranscript: (callback: (text: string, isFinal: boolean) => void) => void;
  isSupported(): boolean;
}
```

Default implementation uses Web Speech API. A cloud STT implementation (Whisper, Deepgram) can be swapped in by implementing this interface. The backend never changes — it always receives text.

## System Prompt Template

```
You are a soccer game event interpreter for a youth soccer statistics tracking app.

Convert the user's spoken input into tool calls that record game events. You may
return multiple tool calls for a single utterance.

CURRENT GAME STATE:
- Game Status: {gameStatus}
- Period: {currentPeriod}
- Clock: {clockDisplay}
- Score: {homeTeamName} {homeScore} - {awayScore} {awayTeamName}

ROSTER ({teamName}):
ON FIELD:
{onFieldPlayers: #number firstName lastName — position}

ON BENCH:
{benchPlayers: #number firstName lastName}

RULES:
- Match player names using fuzzy matching. Spoken names may be partial,
  nicknames, or jersey numbers only.
- If multiple players could match a spoken name, set confidence below 0.8
  and include all candidates in ambiguousCandidates.
- One utterance may describe multiple events. Return a separate tool call
  for each.
- Use game state to infer event type:
  - Pre-game: player names + positions = roster additions
  - In-game: "X on for Y" = substitution
  - In-game: "X scored" = goal
  - "start first half" / "end period" = game flow events
- The system auto-fills gameTeamId, period, and periodSecond. Do not
  include these in your tool call arguments.
- Set confidence 0.0-1.0 for each tool call reflecting how certain you
  are about the interpretation.
- Include a brief reasoning string explaining your interpretation.
```

## Error Handling

| Scenario                                   | Behavior                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Web Speech API unavailable                 | Mic button hidden, tooltip on game page                                |
| Web Speech API returns empty transcript    | No mutation fired, button returns to idle                              |
| AI provider API error (timeout, 500, etc.) | Toast error: "Voice interpretation failed, try again"                  |
| AI returns no tool calls                   | Toast: "Couldn't understand that — try again"                          |
| AI returns tool call for invalid operation | ToolExecutor validates against game state, skips invalid, toasts error |
| Pending confirmation expires (TTL)         | Confirmation card auto-dismisses                                       |
| Multiple rapid utterances                  | Queued — second interpretation waits for first to complete             |

## Testing Strategy

- **Unit tests:** AI provider implementations with mocked API responses, ToolExecutor dispatch logic, GameContextBuilder output
- **Integration tests:** VoiceInterpreterService end-to-end with mocked AI provider returning canned tool calls, verifying events are created in DB and published via PubSub
- **Frontend tests:** use-voice-input hook with mocked Web Speech API, confirmation card interaction
- **Manual testing:** Real voice input against live game with both Claude and OpenAI providers
