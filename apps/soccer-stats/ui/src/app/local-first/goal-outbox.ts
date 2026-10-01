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
export interface GoalState {
  snapshot?: GetGameByIdQuery;
  revision?: number;
  actions: PendingGoal[];
}
export interface GoalStore {
  read(scope: string): Promise<GoalState | undefined>;
  change(
    scope: string,
    update: (state: GoalState) => GoalState,
  ): Promise<GoalState>;
}

/** Confirmed data is never contaminated with optimistic events. */
export function projectGoals(state?: GoalState): GetGameByIdQuery | undefined {
  if (!state?.snapshot) return undefined;
  const snapshot = state.snapshot;
  return {
    ...snapshot,
    game: {
      ...snapshot.game,
      teams: (snapshot.game.teams ?? []).map((team) => ({
        ...team,
        events: [
          ...(team.events ?? []),
          ...state.actions
            .filter(
              (a) =>
                a.status !== 'needs-attention' &&
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

export class GoalOutbox {
  private running?: Promise<void>;
  constructor(
    readonly scope: string,
    private store: GoalStore,
    private send: (input: GoalInput) => Promise<unknown>,
    private fetchSnapshot: (signal: AbortSignal) => Promise<GetGameByIdQuery>,
    private changed: (state: GoalState) => void = () => undefined,
    private active: () => boolean = () => true,
    private accepted: (snapshot: GetGameByIdQuery) => void = () => undefined,
  ) {}
  async load() {
    return (await this.store.read(this.scope)) ?? { actions: [] };
  }
  private async change(update: (state: GoalState) => GoalState) {
    const state = await this.store.change(this.scope, (s) =>
      this.active() ? update(s) : s,
    );
    if (this.active()) this.changed(state);
    return state;
  }
  /** Unversioned cache data may seed an empty store, never replace durable truth. */
  hydrate(snapshot: GetGameByIdQuery) {
    return this.change((s) =>
      s.snapshot
        ? s
        : {
            ...s,
            snapshot,
            revision: (s.revision ?? 0) + 1,
          },
    );
  }
  /** Capture expectedRevision before obtaining fresh data, not after its arrival. */
  async confirm(
    snapshot: GetGameByIdQuery,
    expectedRevision: number,
    acknowledgedId?: string,
  ) {
    const ids = new Set(
      snapshot.game.teams?.flatMap((t) => t.events?.map((e) => e.id) ?? []),
    );
    let accepted = false;
    await this.change((s) => {
      if ((s.revision ?? 0) !== expectedRevision) return s;
      accepted = true;
      return {
        snapshot,
        revision: expectedRevision + 1,
        actions: s.actions.filter(
          (a) => a.id !== acknowledgedId && !ids.has(a.id),
        ),
      };
    });
    return accepted;
  }
  async enqueue(
    input: GoalInput,
    id: string = crypto.randomUUID(),
  ): Promise<void> {
    if (!this.active()) throw new Error('Sign in before recording goals');
    await this.change((s) => {
      if (
        !s.snapshot ||
        !s.snapshot.game.teams?.some((t) => t.id === input.gameTeamId)
      )
        throw new Error('A confirmed game snapshot is required');
      return {
        ...s,
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
      };
    });
  }
  retry(id: string) {
    return this.change((s) => ({
      ...s,
      actions: s.actions.map((a) =>
        a.id === id
          ? { ...a, status: 'saved-device', error: undefined, nextAttempt: 0 }
          : a,
      ),
    }));
  }
  discard(id: string) {
    return this.change((s) => ({
      ...s,
      actions: s.actions.filter(
        (a) => a.id !== id || a.status !== 'needs-attention',
      ),
    }));
  }
  sync(now = Date.now()): Promise<void> {
    if (this.running) return this.running;
    this.running = this.flush(now).finally(() => {
      this.running = undefined;
    });
    return this.running;
  }
  private async snapshot(): Promise<GetGameByIdQuery> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Race as well as abort: links/transports may ignore AbortSignal. Their late
    // results must never resume a timed-out drain or commit stale membership.
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('Confirmed game snapshot timed out; retry available'));
        controller.abort();
      }, 15000);
    });
    try {
      return await Promise.race([
        this.fetchSnapshot(controller.signal),
        timeout,
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  private async fetchAndCommit(acknowledgedId?: string) {
    // Read the durable generation before starting I/O. Subscription ingress and
    // other tabs advance it in the same transaction as membership/retirement.
    const revision = (await this.load()).revision ?? 0;
    if (!this.active()) return;
    const snapshot = await this.snapshot();
    const accepted = await this.confirm(snapshot, revision, acknowledgedId);
    // Cache publication follows ordering and durable commit, never network return.
    if (accepted && this.active()) this.accepted(snapshot);
  }
  async refresh() {
    if (!this.active()) return;
    await this.fetchAndCommit();
  }
  private async flush(now: number) {
    for (const action of (await this.load()).actions) {
      if (!this.active()) return;
      if (action.status === 'needs-attention') continue;
      if (action.nextAttempt > now) return;
      try {
        await this.send(action.input);
        if (!this.active()) return;
        // Fetch after ACK, even if the goal was since deleted. Snapshot replacement and
        // outbox retirement are ONE local transaction: crash cannot lose either half.
        await this.fetchAndCommit(action.id);
      } catch (error) {
        const e = error as {
          message?: string;
          errors?: { extensions?: { code?: string } }[];
        };
        const terminal = e.errors?.some((x) =>
          [
            'BAD_REQUEST',
            'BAD_USER_INPUT',
            'FORBIDDEN',
            'UNAUTHENTICATED',
            'NOT_FOUND',
          ].includes(x.extensions?.code ?? ''),
        );
        await this.change((s) => ({
          ...s,
          actions: s.actions.map((a) =>
            a.id !== action.id
              ? a
              : {
                  ...a,
                  attempts: a.attempts + 1,
                  nextAttempt:
                    now + Math.min(60000, 1000 * 2 ** Math.min(a.attempts, 6)),
                  status: terminal ? 'needs-attention' : 'saved-device',
                  error: e.message ?? 'Sync failed; retry available',
                },
          ),
        }));
        if (!terminal) return;
      }
    }
  }
}
