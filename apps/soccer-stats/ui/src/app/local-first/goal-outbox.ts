import type {
  GetGameByIdQuery,
  RecordGoalInput,
} from '@garage/soccer-stats/graphql-codegen';

export type GoalInput = RecordGoalInput & { clientActionId?: string };
export interface PendingGoal {
  id: string;
  input: GoalInput;
  createdAt: string;
  attempts: number;
  nextAttempt: number;
  status: 'saved-device' | 'needs-attention';
  error?: string;
}
/** Only unsent work lives on the device; Apollo owns confirmed game data. */
export interface OutboxState {
  actions: PendingGoal[];
}
export interface GoalStore {
  read(scope: string): Promise<OutboxState | undefined>;
  change(
    scope: string,
    update: (state: OutboxState) => OutboxState,
  ): Promise<OutboxState>;
}

/**
 * Overlay pending goals on confirmed game data. The server stores a goal under
 * its clientActionId, so once the confirmed copy arrives the pending one is
 * hidden by ID and the two never show twice.
 */
export function projectGoals(
  confirmed: GetGameByIdQuery | undefined,
  actions: PendingGoal[],
): GetGameByIdQuery | undefined {
  if (!confirmed) return undefined;
  const pending = actions.filter((a) => a.status !== 'needs-attention');
  if (!pending.length) return confirmed;
  return {
    ...confirmed,
    game: {
      ...confirmed.game,
      teams: (confirmed.game.teams ?? []).map((team) => ({
        ...team,
        events: [
          ...(team.events ?? []),
          ...pending
            .filter(
              (a) =>
                a.input.gameTeamId === team.id &&
                !team.events?.some((e) => e.id === a.id),
            )
            .map((a) => ({
              __typename: 'GameEvent' as const,
              id: a.id,
              createdAt: a.createdAt,
              period: a.input.period,
              periodSecond: a.input.periodSecond ?? 0,
              position: null,
              formation: null,
              playerId: a.input.scorerId ?? null,
              externalPlayerName: a.input.externalScorerName ?? null,
              externalPlayerNumber: a.input.externalScorerNumber ?? null,
              player: null,
              eventType: {
                __typename: 'EventType' as const,
                id: 'local-goal',
                name: 'GOAL',
                category: 'SCORING',
              },
              childEvents:
                a.input.assisterId || a.input.externalAssisterName
                  ? [
                      {
                        __typename: 'GameEvent' as const,
                        id: `${a.id}-assist`,
                        playerId: a.input.assisterId ?? null,
                        externalPlayerName:
                          a.input.externalAssisterName ?? null,
                        externalPlayerNumber:
                          a.input.externalAssisterNumber ?? null,
                        position: null,
                        period: a.input.period,
                        periodSecond: a.input.periodSecond ?? 0,
                        player: null,
                        eventType: {
                          __typename: 'EventType' as const,
                          id: 'local-assist',
                          name: 'ASSIST',
                          category: 'SCORING',
                        },
                      },
                    ]
                  : [],
            })),
        ],
      })),
    },
  };
}

/**
 * Decide whether a failed send needs the user (terminal) or can be retried
 * automatically with backoff. Terminal goals stop syncing and show Retry/Discard.
 */
export function isTerminalSyncError(error: unknown): boolean {
  const e = error as { errors?: { extensions?: { code?: string } }[] };
  return !!e?.errors?.some((x) =>
    [
      'BAD_REQUEST',
      'BAD_USER_INPUT',
      'FORBIDDEN',
      'UNAUTHENTICATED',
      'NOT_FOUND',
    ].includes(x.extensions?.code ?? ''),
  );
}

export class GoalOutbox {
  private running?: Promise<void>;
  constructor(
    readonly scope: string,
    private store: GoalStore,
    private send: (input: GoalInput) => Promise<unknown>,
    /** Refresh confirmed game data (the Apollo cache) from the server. */
    private confirm: () => Promise<unknown>,
    private changed: (state: OutboxState) => void = () => undefined,
    private active: () => boolean = () => true,
  ) {}
  async load(): Promise<OutboxState> {
    return { actions: (await this.store.read(this.scope))?.actions ?? [] };
  }
  private async change(update: (state: OutboxState) => OutboxState) {
    const state = await this.store.change(this.scope, (s) =>
      this.active() ? { actions: update(s).actions } : s,
    );
    if (this.active()) this.changed(state);
    return state;
  }
  /** Resolves once the goal is committed to the device, never on network. */
  async enqueue(
    input: GoalInput,
    id: string = crypto.randomUUID(),
  ): Promise<void> {
    if (!this.active()) throw new Error('Sign in before recording goals');
    await this.change((s) => ({
      actions: [
        ...s.actions,
        {
          id,
          input: { ...input, clientActionId: id },
          createdAt: new Date().toISOString(),
          attempts: 0,
          nextAttempt: 0,
          status: 'saved-device',
        },
      ],
    }));
  }
  retry(id: string) {
    return this.change((s) => ({
      actions: s.actions.map((a) =>
        a.id === id
          ? { ...a, status: 'saved-device', error: undefined, nextAttempt: 0 }
          : a,
      ),
    }));
  }
  discard(id: string) {
    return this.change((s) => ({
      actions: s.actions.filter(
        (a) => a.id !== id || a.status !== 'needs-attention',
      ),
    }));
  }
  /** Concurrent callers share one in-flight drain. */
  sync(now = Date.now()): Promise<void> {
    if (this.running) return this.running;
    this.running = this.flush(now).finally(() => {
      this.running = undefined;
    });
    return this.running;
  }
  private async flush(now: number) {
    const acknowledged = new Set<string>();
    for (const action of (await this.load()).actions) {
      if (!this.active()) return;
      if (action.status === 'needs-attention') continue;
      // Preserve recording order: later goals wait behind a backed-off one.
      if (action.nextAttempt > now) break;
      try {
        await this.send(action.input);
        acknowledged.add(action.id);
      } catch (error) {
        const terminal = isTerminalSyncError(error);
        await this.change((s) => ({
          actions: s.actions.map((a) =>
            a.id !== action.id
              ? a
              : {
                  ...a,
                  attempts: a.attempts + 1,
                  nextAttempt:
                    now + Math.min(60000, 1000 * 2 ** Math.min(a.attempts, 6)),
                  status: terminal ? 'needs-attention' : 'saved-device',
                  error:
                    (error as { message?: string })?.message ??
                    'Sync failed; retry available',
                },
          ),
        }));
        if (!terminal) break;
      }
    }
    if (!acknowledged.size || !this.active()) return;
    // Pull the server's copy into the cache before dropping the local one so
    // the goal never vanishes from view. If this fails or the page dies here,
    // the goal is simply resent and the server answers from its receipt.
    await this.confirm();
    await this.change((s) => ({
      actions: s.actions.filter((a) => !acknowledged.has(a.id)),
    }));
  }
}
